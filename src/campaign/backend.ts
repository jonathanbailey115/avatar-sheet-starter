import type { RollEntry } from '../engine/rolls'
import { createBrowserLocalBackend } from './localBackend'
import { normalizeSupabaseUrl } from './supabaseUrl'
import type { Campaign, CampaignBackend, CampaignEvent, PlayerSummary, Visibility } from './types'

let instance: CampaignBackend | null = null

/** True when the app was built with a Supabase project, so campaigns work across computers. */
export function hasSupabaseConfig(): boolean {
    return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

/**
 * The Supabase client is large, so it is only downloaded when a project is configured, and
 * only when campaigns are first used.
 */
class LazySupabaseBackend implements CampaignBackend {
    readonly kind = 'supabase' as const
    private inner: Promise<CampaignBackend> | null = null

    private backend(): Promise<CampaignBackend> {
        this.inner ??= import('./supabaseBackend').then(
            (module) =>
                new module.SupabaseBackend(
                    normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string),
                    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
                ),
        )
        return this.inner
    }

    init = () => this.backend().then((b) => b.init())
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
