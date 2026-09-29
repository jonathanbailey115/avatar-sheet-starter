import type {
    AccountSession,
    Campaign,
    CampaignSnapshot,
    PlayerSummary,
    SessionScope,
} from '../campaign/types'
import type { RollEntry } from '../engine/rolls'

export type Phase = 'idle' | 'connecting' | 'signed-out' | 'recovering' | 'ready' | 'error'

export interface CampaignState {
    // Saved on this device
    /** The name used in test mode. Signed-in accounts use their username instead. */
    displayName: string
    /** For each account: which of its characters plays in which campaign. */
    bindings: Record<string, Record<string, string>>
    /** GM recovery keys for campaigns you created. Keep them; they are also shown once at creation. */
    gmKeys: Record<string, string>

    // This tab only
    /** Send your rolls to the GM only. */
    privateRolls: boolean
    phase: Phase
    error: string
    /** A problem sending something (the app keeps working). */
    notice: string
    account: AccountSession | null
    userId: string
    campaigns: Campaign[]
    activeId: string | null
    snapshot: CampaignSnapshot | null

    setDisplayName: (name: string) => void
    setPrivateRolls: (value: boolean) => void
    connect: () => Promise<void>
    signUp: (input: { email: string; password: string; username: string }, scope: SessionScope) => Promise<'signed-in' | 'confirm-email'>
    signIn: (email: string, password: string, scope: SessionScope) => Promise<void>
    signOut: () => Promise<void>
    /** Leave the account shared by this device and sign in to another one in this tab only. */
    switchAccountHere: () => void
    setUsername: (username: string) => Promise<void>
    changePassword: (newPassword: string) => Promise<void>
    finishRecovery: (newPassword: string) => Promise<void>
    createCampaign: (name: string) => Promise<{ campaign: Campaign; gmKey: string }>
    joinCampaign: (code: string) => Promise<Campaign>
    claimGm: (code: string, gmKey: string) => Promise<Campaign>
    openCampaign: (id: string) => Promise<void>
    closeCampaign: () => void
    /** Fetch the open campaign again (after the GM changes something). */
    reload: () => Promise<void>
    leaveCampaign: (id: string) => Promise<void>
    clearLog: () => Promise<void>
    removeMember: (userId: string) => Promise<void>
    bindCharacter: (characterId: string, campaignId: string | null) => void
    publishRoll: (characterId: string, entry: RollEntry) => void
    publishStatus: (campaignId: string, summary: PlayerSummary) => void
    gmRoll: (entry: RollEntry) => void
    dismissNotice: () => void
}
