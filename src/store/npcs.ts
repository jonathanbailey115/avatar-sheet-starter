import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loadStoredCharacters } from '../lib/characterLoad'
import type { QuarantinedRecord } from '../lib/characterLoad'
import { normalizeCharacter } from '../lib/normalize'
import type { Character } from '../types/schema'
import { getContent, useContentStore } from './content'
import { jsonStorage } from './storage'

interface NpcState {
    npcs: Character[]
    /** Stored NPCs that failed to load; kept so they are never silently dropped. */
    quarantine: QuarantinedRecord[]
    addNpc: (npc: Character) => void
    saveNpc: (npc: Character) => void
    deleteNpc: (id: string) => void
    renormalizeAll: () => void
}

export const useNpcStore = create<NpcState>()(
    persist(
        (set, get) => ({
            npcs: [],
            quarantine: [],
            addNpc: (npc) => set({ npcs: [normalizeCharacter(npc, getContent()), ...get().npcs] }),
            saveNpc: (npc) =>
                set({
                    npcs: get().npcs.map((item) =>
                        item.id === npc.id ? normalizeCharacter(npc, getContent()) : item,
                    ),
                }),
            deleteNpc: (id) => set({ npcs: get().npcs.filter((npc) => npc.id !== id) }),
            renormalizeAll: () => {
                const content = getContent()
                const current = get().npcs
                const next = current.map((npc) => normalizeCharacter(npc, content))
                if (next.some((npc, index) => npc !== current[index])) set({ npcs: next })
            },
        }),
        {
            name: 'avatar-dnd:npcs',
            version: 1,
            storage: jsonStorage,
            partialize: (state) => ({ npcs: state.npcs, quarantine: state.quarantine }),
            merge: (persisted, current) => {
                const saved = (persisted ?? {}) as Partial<NpcState>
                const loaded = loadStoredCharacters(saved.npcs, getContent())
                return {
                    ...current,
                    npcs: loaded.characters,
                    quarantine: [
                        ...(Array.isArray(saved.quarantine) ? saved.quarantine : []),
                        ...loaded.quarantine,
                    ],
                }
            },
        },
    ),
)

useContentStore.subscribe((state, previous) => {
    if (state.edits !== previous.edits) useNpcStore.getState().renormalizeAll()
})
