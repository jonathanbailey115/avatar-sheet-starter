import type { RollEntry } from '../engine/rolls'
import { CampaignError } from './types'
import type { Campaign, CampaignMember, CampaignRoll, MemberStatus, PlayerSummary, Visibility } from './types'

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

export const CAMPAIGN_COLUMNS = 'id, code, name, gm_id'
export const ROLL_LIMIT = 200

/** Turn a Supabase error into something a player can read. */
export function friendlyError(error: { message?: string; code?: string } | null | undefined): CampaignError {
    const message = error?.message ?? 'Something went wrong.'
    if (/Invalid login credentials/i.test(message)) {
        return new CampaignError('That email and password do not match.')
    }
    if (/already (been )?registered|already exists/i.test(message)) {
        return new CampaignError('There is already an account with that email. Try signing in instead.')
    }
    if (/Email not confirmed/i.test(message)) {
        return new CampaignError('Confirm your email first. We sent you a link when you signed up.')
    }
    if (/rate limit|too many requests|after d+ seconds/i.test(message)) {
        return new CampaignError('Too many tries in a row. Wait a minute and try again.')
    }
    if (/Password should be|password is too|weak/i.test(message)) {
        return new CampaignError('Choose a longer password (at least 8 characters).')
    }
    if (/valid email|Unable to validate email/i.test(message)) {
        return new CampaignError('That does not look like a valid email address.')
    }
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

export function unwrap<T>(result: { data: T | null; error: { message?: string; code?: string } | null }): T {
    if (result.error) throw friendlyError(result.error)
    if (result.data === null) throw new CampaignError('The server returned nothing.')
    return result.data
}

