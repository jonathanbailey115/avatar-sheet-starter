import type { RollEntry } from '../engine/rolls'
import type { Character } from '../types/schema'
import { CampaignServer, emptyServerState } from './server'
import type { ServerState } from './server'
import { CampaignError } from './types'
import type {
    AccountSession,
    Campaign,
    CampaignBackend,
    CampaignEvent,
    CampaignSnapshot,
    PlayerSummary,
    SessionScope,
    SignUpResult,
    Visibility,
} from './types'

/**
 * Local test mode: every browser tab is a separate player, and the "server" is this browser's
 * localStorage. Nothing leaves the computer. Use it to try campaigns without Supabase.
 */

interface KeyValueStore {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
}

export interface ChannelLike {
    postMessage(message: unknown): void
    onmessage: ((event: { data: unknown }) => void) | null
    close(): void
}

export interface LocalDeps {
    /** Shared by every tab (localStorage). */
    shared: KeyValueStore
    /** Private to this tab (sessionStorage): gives each tab its own player identity. */
    session: KeyValueStore
    openChannel: (name: string) => ChannelLike
}

const STATE_KEY = 'avatar-dnd:local-campaign-server'
const USER_KEY = 'avatar-dnd:local-campaign-user'
const CHANNEL = 'avatar-dnd-local-campaigns'

interface ChangeMessage {
    campaignId: string | '*'
}

export class LocalBackend implements CampaignBackend {
    readonly kind = 'local' as const
    readonly accounts = false
    private userId = ''
    private channel: ChannelLike
    private listeners = new Set<(message: ChangeMessage) => void>()

    constructor(private deps: LocalDeps) {
        this.channel = deps.openChannel(CHANNEL)
        this.channel.onmessage = (event) => {
            const message = event.data as ChangeMessage
            for (const listener of this.listeners) listener(message)
        }
    }

    /** Test mode has no accounts: each tab is simply its own player. */
    async init(): Promise<AccountSession | null> {
        const saved = this.deps.session.getItem(USER_KEY)
        if (saved) {
            this.userId = saved
        } else {
            this.userId = globalThis.crypto.randomUUID()
            this.deps.session.setItem(USER_KEY, this.userId)
        }
        return { userId: this.userId, email: null, username: null }
    }

    setSessionScope(_scope: SessionScope): void {}

    onSignedOut(_callback: () => void): void {}

    private noAccounts(): never {
        throw new CampaignError('Accounts need Supabase. Test mode has none.')
    }

    async signUp(): Promise<SignUpResult> {
        return this.noAccounts()
    }
    async signIn(): Promise<AccountSession> {
        return this.noAccounts()
    }
    async signOut(): Promise<void> {}
    async usernameAvailable(): Promise<boolean> {
        return true
    }
    async setUsername(): Promise<string> {
        return this.noAccounts()
    }
    async changePassword(): Promise<void> {
        return this.noAccounts()
    }
    async requestPasswordReset(): Promise<void> {
        return this.noAccounts()
    }

    private read(): CampaignServer {
        const raw = this.deps.shared.getItem(STATE_KEY)
        let state: ServerState = emptyServerState()
        if (raw) {
            try {
                state = { ...emptyServerState(), ...(JSON.parse(raw) as Partial<ServerState>) }
            } catch {
                state = emptyServerState()
            }
        }
        return new CampaignServer(state)
    }

    /** Run a change against the shared state, save it, and tell the other tabs. */
    private change<T>(campaignId: string | '*', run: (server: CampaignServer) => T): T {
        const server = this.read()
        const result = run(server)
        this.deps.shared.setItem(STATE_KEY, JSON.stringify(server.state))
        this.channel.postMessage({ campaignId } satisfies ChangeMessage)
        return result
    }

    async createCampaign(name: string, displayName: string) {
        return this.change('*', (server) => server.createCampaign(this.userId, name, displayName))
    }

    async joinCampaign(code: string, displayName: string): Promise<Campaign> {
        return this.change('*', (server) => server.joinCampaign(this.userId, code, displayName))
    }

    async claimGm(code: string, gmKey: string, displayName: string): Promise<Campaign> {
        return this.change('*', (server) => server.claimGm(this.userId, code, gmKey, displayName))
    }

    async listCampaigns(): Promise<Campaign[]> {
        return this.read().listCampaigns(this.userId)
    }

    async load(campaignId: string): Promise<CampaignSnapshot> {
        return this.read().load(this.userId, campaignId)
    }

    subscribe(campaignId: string, onEvent: (event: CampaignEvent) => void): () => void {
        const listener = (message: ChangeMessage) => {
            if (message.campaignId === campaignId || message.campaignId === '*') onEvent({ type: 'changed' })
        }
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    async publishRoll(campaignId: string, entry: RollEntry, visibility: Visibility, displayName: string): Promise<void> {
        this.change(campaignId, (server) => server.publishRoll(this.userId, campaignId, entry, visibility, displayName))
    }

    async publishStatus(campaignId: string, summary: PlayerSummary): Promise<void> {
        this.change(campaignId, (server) => server.publishStatus(this.userId, campaignId, summary))
    }

    async clearRolls(campaignId: string): Promise<void> {
        this.change(campaignId, (server) => server.clearRolls(this.userId, campaignId))
    }

    async leave(campaignId: string): Promise<void> {
        this.change(campaignId, (server) => server.leave(this.userId, campaignId))
    }

    async saveNpc(campaignId: string, npc: { id: string; character: Character; revealed: boolean }): Promise<void> {
        this.change(campaignId, (server) => server.saveNpc(this.userId, campaignId, npc))
    }

    async deleteNpc(campaignId: string, npcId: string): Promise<void> {
        this.change(campaignId, (server) => server.deleteNpc(this.userId, campaignId, npcId))
    }

    async removeMember(campaignId: string, userId: string): Promise<void> {
        this.change(campaignId, (server) => server.removeMember(this.userId, campaignId, userId))
    }
}

export function createBrowserLocalBackend(): LocalBackend {
    return new LocalBackend({
        shared: localStorage,
        session: sessionStorage,
        openChannel: (name) => {
            const channel = new BroadcastChannel(name)
            const adapter: ChannelLike = {
                postMessage: (message) => channel.postMessage(message),
                close: () => channel.close(),
                onmessage: null,
            }
            channel.onmessage = (event) => adapter.onmessage?.({ data: event.data })
            return adapter
        },
    })
}
