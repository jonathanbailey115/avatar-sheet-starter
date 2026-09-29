import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SavedKind } from '../campaign/types'
import { jsonStorage } from '../store/storage'

/** id -> a time in milliseconds. */
type Times = Record<string, number>
type PerKind = Record<SavedKind, Times>

const empty = (): PerKind => ({ character: {}, npc: {} })

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'error'

interface SyncState {
    // Saved on this device, kept separately for every account that signs in here.
    /** Items each account holds: id -> when that account last changed it on this device. */
    owned: Record<string, PerKind>
    /** Items deleted on this device that the account may still hold: id -> when. */
    tombstones: Record<string, PerKind>

    // This tab only
    status: SyncStatus
    message: string
    lastSyncedAt: number | null

    own: (userId: string, kind: SavedKind, ids: string[], at: number) => void
    touch: (userId: string, kind: SavedKind, id: string, at: number) => void
    disown: (userId: string, kind: SavedKind, ids: string[]) => void
    bury: (userId: string, kind: SavedKind, id: string, at: number) => void
    forgetTombstones: (userId: string, kind: SavedKind, ids: string[]) => void
    setStatus: (status: SyncStatus, message?: string, lastSyncedAt?: number) => void
}

const kindOf = (all: Record<string, PerKind>, userId: string): PerKind => all[userId] ?? empty()

export function createSyncStore(name = 'avatar-dnd:cloud-sync') {
    return create<SyncState>()(
        persist(
            (set, get) => {
                const withTimes = (
                    field: 'owned' | 'tombstones',
                    userId: string,
                    kind: SavedKind,
                    change: (times: Times) => Times,
                ) => {
                    const all = get()[field]
                    const mine = kindOf(all, userId)
                    set({ [field]: { ...all, [userId]: { ...mine, [kind]: change(mine[kind]) } } } as Partial<SyncState>)
                }
                const without = (times: Times, ids: string[]): Times => {
                    const next = { ...times }
                    for (const id of ids) delete next[id]
                    return next
                }

                return {
                    owned: {},
                    tombstones: {},
                    status: 'off',
                    message: '',
                    lastSyncedAt: null,

                    own: (userId, kind, ids, at) =>
                        withTimes('owned', userId, kind, (times) => ({
                            ...times,
                            ...Object.fromEntries(ids.map((id) => [id, at])),
                        })),
                    touch: (userId, kind, id, at) => withTimes('owned', userId, kind, (times) => ({ ...times, [id]: at })),
                    disown: (userId, kind, ids) => withTimes('owned', userId, kind, (times) => without(times, ids)),
                    bury: (userId, kind, id, at) => withTimes('tombstones', userId, kind, (times) => ({ ...times, [id]: at })),
                    forgetTombstones: (userId, kind, ids) =>
                        withTimes('tombstones', userId, kind, (times) => without(times, ids)),
                    setStatus: (status, message = '', lastSyncedAt) =>
                        set({ status, message, ...(lastSyncedAt === undefined ? {} : { lastSyncedAt }) }),
                }
            },
            {
                name,
                version: 1,
                storage: jsonStorage,
                partialize: (state) => ({ owned: state.owned, tombstones: state.tombstones }),
            },
        ),
    )
}

export const useSyncStore = createSyncStore()

/** What an account holds on this device, for one kind. */
export const ownedBy = (state: Pick<SyncState, 'owned'>, userId: string, kind: SavedKind): Times =>
    kindOf(state.owned, userId)[kind]

export const buriedBy = (state: Pick<SyncState, 'tombstones'>, userId: string, kind: SavedKind): Times =>
    kindOf(state.tombstones, userId)[kind]
