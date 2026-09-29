import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RollEntry } from '../engine/rolls'
import { jsonStorage } from './storage'

const MAX_ENTRIES = 200

interface RollLogState {
    /** Newest first. */
    entries: RollEntry[]
    add: (entry: RollEntry) => void
    clear: () => void
}

/** The local roll log. Campaigns (Phase 5) share entries from here with the rest of the table. */
export const useRollLog = create<RollLogState>()(
    persist(
        (set, get) => ({
            entries: [],
            add: (entry) => set({ entries: [entry, ...get().entries].slice(0, MAX_ENTRIES) }),
            clear: () => set({ entries: [] }),
        }),
        {
            name: 'avatar-dnd:rolls',
            version: 1,
            storage: jsonStorage,
            partialize: (state) => ({ entries: state.entries }),
            merge: (persisted, current) => {
                const saved = (persisted as Partial<RollLogState> | undefined)?.entries
                return { ...current, entries: Array.isArray(saved) ? saved.slice(0, MAX_ENTRIES) : [] }
            },
        },
    ),
)
