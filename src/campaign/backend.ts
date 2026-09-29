import type { RollEntry } from '../engine/rolls'
import type { Character } from '../types/schema'
import { rememberScope } from './authStorage'
import { createBrowserLocalBackend } from './localBackend'
import { normalizeSupabaseUrl } from './supabaseUrl'
import type { Campaign, CampaignBackend, CampaignEvent, PlayerSummary, SavedKind, SavedUpload, SessionScope, Visibility } from './types'

let instance: CampaignBackend | null = null

/** True when the app was built with a Supabase project, so campaigns work across computers. */
export function hasSupabaseConfig(): boolean {
    return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

/**
 * The password-reset email links back here with "type=recovery" in the address. Supabase removes
 * that from the address as soon as it starts, so remember it before anything else runs.
 */
const openedFromRecoveryLink = typeof window !== 'undefined' && /type=recovery/.test(window.location.hash)

export function cameFromPasswordRecoveryLink(): boolean {
    return openedFromRecoveryLink
}

/**
 * The Supabase client is large, so it is only downloaded when a project is configured, and
 * only when campaigns are first used.
 */
class LazySupabaseBackend implements CampaignBackend {
    readonly kind = 'supabase' as const
    readonly accounts = true
    private inner: Promise<CampaignBackend> | null = null
    onSignedOut = (callback: () => void) => void this.backend().then((b) => b.onSignedOut(callback))
    private loaded: CampaignBackend | null = null

    private backend(): Promise<CampaignBackend> {
        this.inner ??= import('./supabaseBackend').then((module) => {
            const created = new module.SupabaseBackend(
                normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string),
                import.meta.env.VITE_SUPABASE_ANON_KEY as string,
            )
            this.loaded = created
            return created
        })
        return this.inner
    }

    /** Chosen at sign-in. If the client is not created yet it reads the choice when it is. */
    setSessionScope(scope: SessionScope): void {
        rememberScope(scope)
        this.loaded?.setSessionScope(scope)
    }

    init = () => this.backend().then((b) => b.init())
    signUp = (input: { email: string; password: string; username: string }) => this.backend().then((b) => b.signUp(input))
    signIn = (email: string, password: string) => this.backend().then((b) => b.signIn(email, password))
    signOut = () => this.backend().then((b) => b.signOut())
    usernameAvailable = (username: string) => this.backend().then((b) => b.usernameAvailable(username))
    setUsername = (username: string) => this.backend().then((b) => b.setUsername(username))
    changePassword = (newPassword: string) => this.backend().then((b) => b.changePassword(newPassword))
    requestPasswordReset = (email: string) => this.backend().then((b) => b.requestPasswordReset(email))
    createCampaign = (name: string, displayName: string) => this.backend().then((b) => b.createCampaign(name, displayName))
    joinCampaign = (code: string, displayName: string) => this.backend().then((b) => b.joinCampaign(code, displayName))
    claimGm = (code: string, gmKey: string, displayName: string) => this.backend().then((b) => b.claimGm(code, gmKey, displayName))
    listCampaigns = (): Promise<Campaign[]> => this.backend().then((b) => b.listCampaigns())
    load = (campaignId: string) => this.backend().then((b) => b.load(campaignId))
    publishRoll = (campaignId: string, entry: RollEntry, visibility: Visibility, displayName: string) =>
        this.backend().then((b) => b.publishRoll(campaignId, entry, visibility, displayName))
    publishStatus = (campaignId: string, summary: PlayerSummary) => this.backend().then((b) => b.publishStatus(campaignId, summary))
    clearRolls = (campaignId: string) => this.backend().then((b) => b.clearRolls(campaignId))
    leave = (campaignId: string) => this.backend().then((b) => b.leave(campaignId))
    removeMember = (campaignId: string, userId: string) => this.backend().then((b) => b.removeMember(campaignId, userId))
    saveNpc = (campaignId: string, npc: { id: string; character: Character; revealed: boolean }) =>
        this.backend().then((b) => b.saveNpc(campaignId, npc))
    listSavedCharacters = () => this.backend().then((b) => b.listSavedCharacters())
    loadSavedCharacters = (kind: SavedKind, ids: string[]) => this.backend().then((b) => b.loadSavedCharacters(kind, ids))
    saveCharacters = (rows: SavedUpload[]) => this.backend().then((b) => b.saveCharacters(rows))
    deleteNpc = (campaignId: string, npcId: string) => this.backend().then((b) => b.deleteNpc(campaignId, npcId))

    subscribe(campaignId: string, onEvent: (event: CampaignEvent) => void): () => void {
        let stop: (() => void) | null = null
        let cancelled = false

        void this.backend().then((b) => {
            if (!cancelled) stop = b.subscribe(campaignId, onEvent)
        })

        return () => {
            cancelled = true
            stop?.()
        }
    }
}

/** Supabase when configured (see docs/SUPABASE_SETUP.md), otherwise local test mode. */
export function getBackend(): CampaignBackend {
    instance ??= hasSupabaseConfig() ? new LazySupabaseBackend() : createBrowserLocalBackend()
    return instance
}
