import type { RollEntry } from '../engine/rolls'
import type { Character } from '../types/schema'

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

/** An NPC the GM saved to the campaign. Players only receive the ones marked revealed. */
export interface CampaignNpc {
    id: string
    character: Character
    revealed: boolean
    updatedAt: number
}

export interface CampaignSnapshot {
    campaign: Campaign
    members: CampaignMember[]
    statuses: MemberStatus[]
    /** Newest first. */
    rolls: CampaignRoll[]
    npcs: CampaignNpc[]
}

/** 'roll' carries a new roll to append; 'changed' means reload the snapshot. */
export type CampaignEvent = { type: 'roll'; roll: CampaignRoll } | { type: 'changed' }

/** Who is signed in. Local test mode has no accounts, so email and username are null there. */
export interface AccountSession {
    userId: string
    email: string | null
    /** The name other players see. Null until an account has chosen one. */
    username: string | null
}

export type SignUpResult = { status: 'signed-in'; session: AccountSession } | { status: 'confirm-email' }

/** 'device' remembers you here. 'tab' keeps this tab's sign-in separate, so another tab can be someone else. */
export type SessionScope = 'device' | 'tab'

export interface CampaignBackend {
    readonly kind: 'supabase' | 'local'
    /** True when players sign in with accounts. Local test mode has none. */
    readonly accounts: boolean
    /** The current session, or null if nobody is signed in. */
    init(): Promise<AccountSession | null>
    setSessionScope(scope: SessionScope): void
    /** Called when the sign-in disappears without the user asking (for example, signed out in another tab). */
    onSignedOut(callback: () => void): void
    signUp(input: { email: string; password: string; username: string }): Promise<SignUpResult>
    signIn(email: string, password: string): Promise<AccountSession>
    signOut(): Promise<void>
    usernameAvailable(username: string): Promise<boolean>
    setUsername(username: string): Promise<string>
    changePassword(newPassword: string): Promise<void>
    requestPasswordReset(email: string): Promise<void>
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
    /** GM only. Adds the NPC or replaces the saved copy. */
    saveNpc(campaignId: string, npc: { id: string; character: Character; revealed: boolean }): Promise<void>
    deleteNpc(campaignId: string, npcId: string): Promise<void>
}

/** A message meant for the person using the app (wrong code, not allowed, and so on). */
export class CampaignError extends Error {}
