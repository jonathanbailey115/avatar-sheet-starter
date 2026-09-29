import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RollEntry } from '../engine/rolls'
import { CampaignError } from './types'
import type {
    Campaign,
    CampaignBackend,
    CampaignEvent,
    CampaignMember,
    CampaignRoll,
    CampaignSnapshot,
    MemberStatus,
    PlayerSummary,
    Visibility,
} from './types'

/** Row shapes as Postgres returns them. */
export interface CampaignRow {
    id: string
    code: string
    name: string
    gm_id: string
}
export interface MemberRow {
    user_id: string
    display_name: string
    role: 'gm' | 'player'
}
export interface StatusRow {
    user_id: string
    summary: PlayerSummary
    updated_at: string
}
export interface RollRow {
    id: string
    user_id: string
    display_name: string
    visibility: Visibility
    entry: RollEntry
    created_at: string
}

export const campaignFromRow = (row: CampaignRow): Campaign => ({
    id: row.id,
    code: row.code,
    name: row.name,
    gmId: row.gm_id,
})

export const memberFromRow = (row: MemberRow): CampaignMember => ({
    userId: row.user_id,
    displayName: row.display_name,
    role: row.role,
})

export const statusFromRow = (row: StatusRow): MemberStatus => ({
    userId: row.user_id,
    summary: row.summary,
    updatedAt: Date.parse(row.updated_at),
})

export const rollFromRow = (row: RollRow): CampaignRoll => ({
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    visibility: row.visibility,
    entry: row.entry,
    createdAt: Date.parse(row.created_at),
})

const CAMPAIGN_COLUMNS = 'id, code, name, gm_id'
const ROLL_LIMIT = 200

/** Turn a Supabase error into something a player can read. */
export function friendlyError(error: { message?: string; code?: string } | null | undefined): CampaignError {
    const message = error?.message ?? 'Something went wrong.'
    if (/Anonymous sign-ins are disabled/i.test(message)) {
        return new CampaignError('Anonymous sign-ins are off in your Supabase project. Turn them on under Authentication > Providers.')
    }
    if (/Failed to fetch|NetworkError|network/i.test(message)) {
        return new CampaignError('Could not reach the campaign server. Check your connection.')
    }
    if (/row-level security|permission denied/i.test(message)) {
        return new CampaignError('You are not allowed to do that in this campaign.')
    }
    // The database functions raise readable messages ("No campaign with that code").
    return new CampaignError(message)
}

function unwrap<T>(result: { data: T | null; error: { message?: string; code?: string } | null }): T {
    if (result.error) throw friendlyError(result.error)
    if (result.data === null) throw new CampaignError('The server returned nothing.')
    return result.data
}

export class SupabaseBackend implements CampaignBackend {
    readonly kind = 'supabase' as const
    private client: SupabaseClient
    private userId = ''

    constructor(url: string, anonKey: string) {
        this.client = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
    }

    async init(): Promise<string> {
        const existing = await this.client.auth.getSession()
        if (existing.data.session) {
            this.userId = existing.data.session.user.id
            return this.userId
        }

        const created = await this.client.auth.signInAnonymously()
        if (created.error || !created.data.user) throw friendlyError(created.error)
        this.userId = created.data.user.id
        return this.userId
    }

    private async fetchCampaign(id: string): Promise<Campaign> {
        const result = await this.client.from('campaigns').select(CAMPAIGN_COLUMNS).eq('id', id).single<CampaignRow>()
        return campaignFromRow(unwrap(result))
    }

    async createCampaign(name: string, displayName: string) {
        const result = await this.client.rpc('create_campaign', { p_name: name, p_display_name: displayName })
        const rows = unwrap(result) as Array<{ out_id: string; out_code: string; out_gm_key: string }>
        const row = rows[0]
        return {
            campaign: { id: row.out_id, code: row.out_code, name: name.trim(), gmId: this.userId },
            gmKey: row.out_gm_key,
        }
    }

    async joinCampaign(code: string, displayName: string): Promise<Campaign> {
        const result = await this.client.rpc('join_campaign', { p_code: code, p_display_name: displayName })
        return this.fetchCampaign(unwrap(result) as string)
    }

    async claimGm(code: string, gmKey: string, displayName: string): Promise<Campaign> {
        const result = await this.client.rpc('claim_gm', { p_code: code, p_gm_key: gmKey, p_display_name: displayName })
        return this.fetchCampaign(unwrap(result) as string)
    }

    async listCampaigns(): Promise<Campaign[]> {
        const result = await this.client.from('campaigns').select(CAMPAIGN_COLUMNS).order('created_at', { ascending: true })
        return unwrap(result as { data: CampaignRow[] | null; error: null }).map(campaignFromRow)
    }

    async load(campaignId: string): Promise<CampaignSnapshot> {
        const [campaign, members, statuses, rolls] = await Promise.all([
            this.fetchCampaign(campaignId),
            this.client.from('campaign_members').select('user_id, display_name, role').eq('campaign_id', campaignId),
            this.client.from('member_status').select('user_id, summary, updated_at').eq('campaign_id', campaignId),
            this.client
                .from('campaign_rolls')
                .select('id, user_id, display_name, visibility, entry, created_at')
                .eq('campaign_id', campaignId)
                .order('created_at', { ascending: false })
                .limit(ROLL_LIMIT),
        ])

        return {
            campaign,
            members: unwrap(members as { data: MemberRow[] | null; error: null }).map(memberFromRow),
            statuses: unwrap(statuses as { data: StatusRow[] | null; error: null }).map(statusFromRow),
            rolls: unwrap(rolls as { data: RollRow[] | null; error: null }).map(rollFromRow),
        }
    }

    subscribe(campaignId: string, onEvent: (event: CampaignEvent) => void): () => void {
        const filter = `campaign_id=eq.${campaignId}`
        const changed = () => onEvent({ type: 'changed' })

        const channel = this.client
            .channel(`campaign:${campaignId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'campaign_rolls', filter }, (payload) =>
                onEvent({ type: 'roll', roll: rollFromRow(payload.new as RollRow) }),
            )
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'campaign_rolls', filter }, changed)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_members', filter }, changed)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'member_status', filter }, changed)
            .subscribe()

        return () => {
            void this.client.removeChannel(channel)
        }
    }

    async publishRoll(campaignId: string, entry: RollEntry, visibility: Visibility, displayName: string): Promise<void> {
        const { error } = await this.client.from('campaign_rolls').insert({
            campaign_id: campaignId,
            user_id: this.userId,
            display_name: displayName,
            visibility,
            entry,
        })
        if (error) throw friendlyError(error)
    }

    async publishStatus(campaignId: string, summary: PlayerSummary): Promise<void> {
        const { error } = await this.client
            .from('member_status')
            .upsert(
                { campaign_id: campaignId, user_id: this.userId, summary, updated_at: new Date().toISOString() },
                { onConflict: 'campaign_id,user_id' },
            )
        if (error) throw friendlyError(error)
    }

    async clearRolls(campaignId: string): Promise<void> {
        const { error } = await this.client.from('campaign_rolls').delete().eq('campaign_id', campaignId)
        if (error) throw friendlyError(error)
    }

    async leave(campaignId: string): Promise<void> {
        await this.removeMember(campaignId, this.userId)
    }

    async removeMember(campaignId: string, userId: string): Promise<void> {
        const status = await this.client.from('member_status').delete().eq('campaign_id', campaignId).eq('user_id', userId)
        if (status.error) throw friendlyError(status.error)
        const member = await this.client.from('campaign_members').delete().eq('campaign_id', campaignId).eq('user_id', userId)
        if (member.error) throw friendlyError(member.error)
    }
}
