import { getBackend, hasSupabaseConfig } from '../campaign/backend'
import type { SavedKind } from '../campaign/types'
import { useCampaignStore } from '../store/campaign'
import { getContent } from '../store/content'
import type { Character } from '../types/schema'
import { collections } from './collections'
import type { Collection } from './collections'
import { onItemsAdded } from './events'
import { runSync } from './syncRun'
import { ownedBy, useSyncStore } from './syncStore'

/**
 * Keeps this account's characters and NPCs in step with the database. Runs in every tab, for the
 * account signed in to that tab. Characters that were on the device before the account existed are
 * never uploaded unless the player says so (see adoptDeviceCharacters).
 */

const PUSH_DELAY_MS = 2500
const RETRY_MS = 60_000
const REFRESH_MS = 5 * 60_000
const FOCUS_GAP_MS = 30_000

let userId = ''
let stopWatching: (() => void)[] = []
let pushTimer: number | undefined
let retryTimer: number | undefined
let refreshTimer: number | undefined
let running: Promise<void> | null = null
let again = false
/** True while we are writing what we downloaded, so those writes are not mistaken for edits. */
let applying = false
const seen = new Map<SavedKind, Map<string, string>>()

const snapshot = (collection: Collection) => new Map(collection.all().map((item) => [item.id, JSON.stringify(item)]))

function messageOf(error: unknown): string {
    return error instanceof Error ? error.message : 'Could not reach your account.'
}

export function syncEnabled(): boolean {
    const state = useCampaignStore.getState()
    return hasSupabaseConfig() && getBackend().accounts && state.phase === 'ready' && Boolean(state.account?.username)
}

function scheduleSync(delay = PUSH_DELAY_MS): void {
    window.clearTimeout(pushTimer)
    pushTimer = window.setTimeout(() => void syncNow(), delay)
}

/** Notice edits and deletions of items this account holds. */
function onCollectionChanged(collection: Collection): void {
    if (applying || !userId) return
    const store = useSyncStore.getState()
    const owned = ownedBy(store, userId, collection.kind)
    const before = seen.get(collection.kind) ?? new Map<string, string>()
    const now = snapshot(collection)
    const at = Date.now()
    let dirty = false

    for (const [id, json] of now) {
        if (owned[id] !== undefined && before.get(id) !== undefined && before.get(id) !== json) {
            store.touch(userId, collection.kind, id, at)
            dirty = true
        }
    }
    for (const id of before.keys()) {
        if (!now.has(id) && owned[id] !== undefined) {
            store.disown(userId, collection.kind, [id])
            store.bury(userId, collection.kind, id, at)
            dirty = true
        }
    }
    seen.set(collection.kind, now)
    if (dirty) scheduleSync()
}

async function runOnce(): Promise<void> {
    const sync = useSyncStore.getState()
    sync.setStatus('syncing')
    const result = await runSync(userId, {
        backend: getBackend(),
        collections,
        store: useSyncStore,
        content: getContent(),
        applying: (active) => {
            applying = active
        },
        settled: (collection) => seen.set(collection.kind, snapshot(collection)),
    })
    useSyncStore.getState().setStatus(
        'idle',
        result.unreadable > 0 ? `${result.unreadable} saved character${result.unreadable === 1 ? ' was' : 's were'} unreadable and skipped.` : '',
        Date.now(),
    )
}

/** Sync now. Calls that arrive while one is running are folded into one more run afterwards. */
export function syncNow(): Promise<void> {
    if (!userId || !syncEnabled()) return Promise.resolve()
    if (running) {
        again = true
        return running
    }
    window.clearTimeout(pushTimer)
    window.clearTimeout(retryTimer)
    running = runOnce()
        .catch((error: unknown) => {
            useSyncStore.getState().setStatus('error', messageOf(error))
            retryTimer = window.setTimeout(() => void syncNow(), RETRY_MS)
        })
        .finally(() => {
            running = null
            if (again) {
                again = false
                scheduleSync(500)
            }
        })
    return running
}

/** Put every character and NPC on this device that is not yet in the account into it. */
export function adoptDeviceCharacters(): Promise<void> {
    if (!userId) return Promise.resolve()
    const at = Date.now()
    for (const collection of collections) {
        const owned = ownedBy(useSyncStore.getState(), userId, collection.kind)
        const fresh = collection.all().filter((item) => owned[item.id] === undefined).map((item) => item.id)
        useSyncStore.getState().own(userId, collection.kind, fresh, at)
    }
    return syncNow()
}

/** How many items on this device are not in the signed-in account. */
export function countOutsideAccount(
    account: string,
    owned: Record<string, Record<SavedKind, Record<string, number>>>,
    lists: Record<SavedKind, Character[]>,
): Record<SavedKind, number> {
    const mine = owned[account]
    return {
        character: lists.character.filter((item) => mine?.character[item.id] === undefined).length,
        npc: lists.npc.filter((item) => mine?.npc[item.id] === undefined).length,
    }
}

function attach(forUser: string): void {
    detach()
    userId = forUser
    for (const collection of collections) {
        seen.set(collection.kind, snapshot(collection))
        stopWatching.push(collection.subscribe(() => onCollectionChanged(collection)))
    }
    stopWatching.push(
        onItemsAdded((kind, ids) => {
            // A character made in this tab, by this account: it belongs to the account from the start.
            useSyncStore.getState().own(forUser, kind, ids, Date.now())
            const collection = collections.find((item) => item.kind === kind)
            if (collection) seen.set(kind, snapshot(collection))
            scheduleSync()
        }),
    )

    const onFocus = () => {
        const last = useSyncStore.getState().lastSyncedAt
        if (document.visibilityState === 'visible' && (last === null || Date.now() - last > FOCUS_GAP_MS)) void syncNow()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    stopWatching.push(() => {
        window.removeEventListener('focus', onFocus)
        document.removeEventListener('visibilitychange', onFocus)
    })
    refreshTimer = window.setInterval(() => void syncNow(), REFRESH_MS)

    void syncNow()
}

function detach(): void {
    for (const stop of stopWatching) stop()
    stopWatching = []
    window.clearTimeout(pushTimer)
    window.clearTimeout(retryTimer)
    window.clearInterval(refreshTimer)
    seen.clear()
    userId = ''
    useSyncStore.getState().setStatus('off')
}

/** Start following the campaign store's sign-in: sync while an account with a username is signed in. */
export function startCloudSync(): void {
    if (!hasSupabaseConfig()) return
    const check = () => {
        const state = useCampaignStore.getState()
        const wanted = syncEnabled() ? state.userId : ''
        if (wanted === userId) return
        if (wanted) attach(wanted)
        else detach()
    }
    useCampaignStore.subscribe(check)
    check()
}
