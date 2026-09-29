import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RollEntry } from '../engine/rolls'
import type { Character } from '../types/schema'
import { deleteCampaignNpc, listSaved, loadSaved, saveCampaignNpc, saveRows } from './supabaseData'
import { authStorageFor, currentScope, projectRefOf, rememberScope, storageKeyFor } from './authStorage'
import {
    CAMPAIGN_COLUMNS,
    ROLL_LIMIT,
    campaignFromRow,
    friendlyError,
    memberFromRow,
    npcFromRow,
    rollFromRow,
    statusFromRow,
    unwrap,
} from './supabaseMap'
import type { CampaignRow, MemberRow, NpcRow, RollRow, StatusRow } from './supabaseMap'
import type {
    AccountSession,
    Campaign,
    CampaignBackend,
    CampaignEvent,
    CampaignSnapshot,
    PlayerSummary,
    SavedInfo,
    SavedItem,
    SavedKind,
    SavedUpload,
    SessionScope,
    SignUpResult,
    Visibility,
} from './types'

type ClientFactory = typeof createClient

export class SupabaseBackend implements CampaignBackend {
    readonly kind = 'supabase' as const
    readonly accounts = true
    private client: SupabaseClient
    private userId = ''
    private signedOutListener: (() => void) | null = null

    constructor(
        private url: string,
        private anonKey: string,
        scope: SessionScope = currentScope(),
        private factory: ClientFactory = createClient,
    ) {
        this.client = this.build(scope)
    }

    private build(scope: SessionScope): SupabaseClient {
        const client = this.factory(this.url, this.anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                storage: authStorageFor(scope),
                storageKey: storageKeyFor(projectRefOf(this.url), scope),
            },
        })
        // A sign-out in another tab that shares this sign-in reaches us here.
        client.auth.onAuthStateChange?.((event) => {
            if (event === 'SIGNED_OUT' && client === this.client) this.signedOutListener?.()
        })
        return client
    }

    onSignedOut(callback: () => void): void {
        this.signedOutListener = callback
    }

    setSessionScope(scope: SessionScope): void {
        rememberScope(scope)
        this.client = this.build(scope)
    }

    private async describe(user: { id: string; email?: string | null }): Promise<AccountSession> {
        this.userId = user.id
        const profile = await this.client.from('profiles').select('username').maybeSingle<{ username: string }>()
        return { userId: user.id, email: user.email ?? null, username: profile.data?.username ?? null }
    }

    async init(): Promise<AccountSession | null> {
        const existing = await this.client.auth.getSession()
        const user = existing.data.session?.user
        if (!user) return null

        // Guest sign-ins from earlier versions have no account to come back to.
        if (user.is_anonymous) {
            await this.client.auth.signOut({ scope: 'local' })
            return null
        }
        return this.describe(user)
    }

    async signUp(input: { email: string; password: string; username: string }): Promise<SignUpResult> {
        const { data, error } = await this.client.auth.signUp({
            email: input.email.trim(),
            password: input.password,
            options: { data: { username: input.username.trim() } },
        })
        if (error) throw friendlyError(error)
        if (!data.session || !data.user) return { status: 'confirm-email' }

        const session = await this.describe(data.user)
        if (!session.username) {
            // The username was taken or invalid at sign-up; try to claim it now and report if it fails.
            session.username = await this.setUsername(input.username).catch(() => null)
        }
        return { status: 'signed-in', session }
    }

    async signIn(email: string, password: string): Promise<AccountSession> {
        const { data, error } = await this.client.auth.signInWithPassword({ email: email.trim(), password })
        if (error || !data.user) throw friendlyError(error)
        return this.describe(data.user)
    }

    async signOut(): Promise<void> {
        await this.client.auth.signOut({ scope: 'local' })
        this.userId = ''
    }

    async usernameAvailable(username: string): Promise<boolean> {
        const result = await this.client.rpc('username_available', { p_username: username })
        // If the check itself fails, do not block sign-up; the server re-checks.
        return result.error ? true : Boolean(result.data)
    }

    async setUsername(username: string): Promise<string> {
        const result = await this.client.rpc('claim_username', { p_username: username })
        return unwrap(result) as string
    }

    async changePassword(newPassword: string): Promise<void> {
        const { error } = await this.client.auth.updateUser({ password: newPassword })
        if (error) throw friendlyError(error)
    }

    async requestPasswordReset(email: string): Promise<void> {
        const { error } = await this.client.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}${window.location.pathname}`,
        })
        if (error) throw friendlyError(error)
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
        const [campaign, members, statuses, rolls, npcs] = await Promise.all([
            this.fetchCampaign(campaignId),
            this.client.from('campaign_members').select('user_id, display_name, role').eq('campaign_id', campaignId),
            this.client.from('member_status').select('user_id, summary, updated_at').eq('campaign_id', campaignId),
            this.client
                .from('campaign_rolls')
                .select('id, user_id, display_name, visibility, entry, created_at')
                .eq('campaign_id', campaignId)
                .order('created_at', { ascending: false })
                .limit(ROLL_LIMIT),
            this.client.from('campaign_npcs').select('id, data, revealed, updated_at').eq('campaign_id', campaignId),
        ])

        return {
            campaign,
            members: unwrap(members as { data: MemberRow[] | null; error: null }).map(memberFromRow),
            statuses: unwrap(statuses as { data: StatusRow[] | null; error: null }).map(statusFromRow),
            rolls: unwrap(rolls as { data: RollRow[] | null; error: null }).map(rollFromRow),
            npcs: unwrap(npcs as { data: NpcRow[] | null; error: null }).map(npcFromRow),
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_npcs', filter }, changed)
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

    async clearStatus(campaignId: string): Promise<void> {
        const { error } = await this.client.from('member_status').delete().eq('campaign_id', campaignId).eq('user_id', this.userId)
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

    saveNpc(campaignId: string, npc: { id: string; character: Character; revealed: boolean }): Promise<void> {
        return saveCampaignNpc(this.client, campaignId, npc)
    }

    deleteNpc(campaignId: string, npcId: string): Promise<void> {
        return deleteCampaignNpc(this.client, campaignId, npcId)
    }

    listSavedCharacters(): Promise<SavedInfo[]> {
        return listSaved(this.client)
    }

    loadSavedCharacters(kind: SavedKind, ids: string[]): Promise<SavedItem[]> {
        return loadSaved(this.client, kind, ids)
    }

    saveCharacters(rows: SavedUpload[]): Promise<void> {
        return saveRows(this.client, rows)
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
