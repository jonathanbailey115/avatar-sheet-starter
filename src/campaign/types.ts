import type { RollEntry } from '../engine/rolls'

export type CampaignRole = 'gm' | 'player'
export type Visibility = 'all' | 'gm'

export interface Campaign {
    id: string
    code: string
    name: string
    gmId: string
}

export interface CampaignMember {
    userId: string
    displayName: string
    role: CampaignRole
}

/** What the party board shows for one player. Small and safe to share with the table. */
export interface PlayerSummary {
    characterId: string
    name: string
    className: string
    lineageName: string
    level: number
    hp: number
    maxHp: number
    tempHp: number
    armorClass: number
    lifeState: 'conscious' | 'dying' | 'stable' | 'dead'
    exhaustion: number
    initiative: number
    saveDc: number | null
}

export interface MemberStatus {
    userId: string
    summary: PlayerSummary
    updatedAt: number
}

export interface CampaignRoll {
    id: string
    userId: string
    displayName: string
    visibility: Visibility
    entry: RollEntry
    createdAt: number
}

export interface CampaignSnapshot {
    campaign: Campaign
    members: CampaignMember[]
    statuses: MemberStatus[]
    /** Newest first. */
    rolls: CampaignRoll[]
}

/** 'roll' carries a new roll to append; 'changed' means reload the snapshot. */
export type CampaignEvent = { type: 'roll'; roll: CampaignRoll } | { type: 'changed' }

export interface CampaignBackend {
    readonly kind: 'supabase' | 'local'
    /** Sign in (anonymously) and return this device's user id. */
    init(): Promise<string>
    createCampaign(name: string, displayName: string): Promise<{ campaign: Campaign; gmKey: string }>
    joinCampaign(code: string, displayName: string): Promise<Campaign>
    claimGm(code: string, gmKey: string, displayName: string): Promise<Campaign>
    listCampaigns(): Promise<Campaign[]>
    load(campaignId: string): Promise<CampaignSnapshot>
    subscribe(campaignId: string, onEvent: (event: CampaignEvent) => void): () => void
    publishRoll(campaignId: string, entry: RollEntry, visibility: Visibility, displayName: string): Promise<void>
    publishStatus(campaignId: string, summary: PlayerSummary): Promise<void>
    clearRolls(campaignId: string): Promise<void>
    leave(campaignId: string): Promise<void>
    removeMember(campaignId: string, userId: string): Promise<void>
}

/** A message meant for the person using the app (wrong code, not allowed, and so on). */
export class CampaignError extends Error {}
