import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { copyCharacter, createBlankCharacter, newId } from '../lib/character'
import { loadStoredCharacters } from '../lib/characterLoad'
import type { QuarantinedRecord } from '../lib/characterLoad'
import { normalizeCharacter } from '../lib/normalize'
import type { Character } from '../types/schema'
import { announceAdded } from '../sync/events'
import { useRollLog } from './rollLog'
import { getContent, useContentStore } from './content'
import { jsonStorage } from './storage'

const ACTIVE_KEY = 'avatar-dnd:active-character'

/** Which character is open belongs to this tab, not the device: another tab may have a different one open. */
function readActive(): string | null {
    try {
        return sessionStorage.getItem(ACTIVE_KEY)
    } catch {
        return null
    }
}

export function writeActiveCharacter(id: string | null): void {
    try {
        if (id) sessionStorage.setItem(ACTIVE_KEY, id)
        else sessionStorage.removeItem(ACTIVE_KEY)
    } catch {
        // private mode: the open character just is not remembered across reloads
    }
}

interface LibraryState {
    characters: Character[]
    activeId: string | null
    quarantine: QuarantinedRecord[]
    createCharacter: () => string
    selectCharacter: (id: string | null) => void
    updateCharacter: (id: string, updater: (current: Character) => Character) => void
    copyCharacter: (id: string) => void
    deleteCharacter: (id: string) => void
    /** Adds characters; ids that already exist get a fresh id so nothing is overwritten. */
    importCharacters: (incoming: Character[]) => number
    clearNotes: (id: string) => void
    renormalizeAll: () => void
    dismissQuarantine: () => void
}

export const useLibraryStore = create<LibraryState>()(
    persist(
        (set, get) => ({
            characters: [],
            activeId: readActive(),
            quarantine: [],

            createCharacter: () => {
                const character = normalizeCharacter(createBlankCharacter(), getContent())
                writeActiveCharacter(character.id)
                set({ characters: [...get().characters, character], activeId: character.id })
                announceAdded('character', [character.id])
                return character.id
            },

            selectCharacter: (id) => {
                writeActiveCharacter(id)
                set({ activeId: id })
            },

            updateCharacter: (id, updater) => {
                const content = getContent()
                set({
                    characters: get().characters.map((character) =>
                        character.id === id
                            ? normalizeCharacter({ ...updater(character), id }, content)
                            : character,
                    ),
                })
            },

            copyCharacter: (id) => {
                const original = get().characters.find((character) => character.id === id)
                if (!original) return
                const copy = copyCharacter(original)
                set({ characters: [...get().characters, copy] })
                announceAdded('character', [copy.id])
            },

            deleteCharacter: (id) => {
                const { characters, activeId } = get()
                if (activeId === id) writeActiveCharacter(null)
                useRollLog.getState().removeForCharacters([id])
                set({
                    characters: characters.filter((character) => character.id !== id),
                    activeId: activeId === id ? null : activeId,
                })
            },

            importCharacters: (incoming) => {
                const content = getContent()
                const existing = new Set(get().characters.map((character) => character.id))
                const added = incoming.map((character) => {
                    const withId = existing.has(character.id)
                        ? { ...character, id: newId() }
                        : character
                    existing.add(withId.id)
                    return normalizeCharacter(withId, content, { reportRemovals: true })
                })
                set({ characters: [...get().characters, ...added] })
                announceAdded('character', added.map((character) => character.id))
                return added.length
            },

            clearNotes: (id) =>
                set({
                    characters: get().characters.map((character) =>
                        character.id === id ? { ...character, migrationNotes: [] } : character,
                    ),
                }),

            renormalizeAll: () => {
                const content = getContent()
                const current = get().characters
                const next = current.map((character) => normalizeCharacter(character, content))
                if (next.some((character, index) => character !== current[index])) {
                    set({ characters: next })
                }
            },

            dismissQuarantine: () => set({ quarantine: [] }),
        }),
        {
            name: 'avatar-dnd:library',
            version: 1,
            storage: jsonStorage,
            partialize: (state) => ({
                characters: state.characters,
                quarantine: state.quarantine,
            }),
            merge: (persisted, current) => {
                const saved = (persisted ?? {}) as Partial<LibraryState>
                const loaded = loadStoredCharacters(saved.characters, getContent())
                // Keep this tab's open character if it still exists (another tab may have deleted it).
                const wanted = current.activeId ?? readActive()
                const activeId = loaded.characters.some((c) => c.id === wanted) ? wanted : null

                return {
                    ...current,
                    characters: loaded.characters,
                    activeId,
                    quarantine: [
                        ...(Array.isArray(saved.quarantine) ? saved.quarantine : []),
                        ...loaded.quarantine,
                    ],
                }
            },
        },
    ),
)

// When the GM edits rules content, keep saved characters consistent with it.
useContentStore.subscribe((state, previous) => {
    if (state.edits !== previous.edits) useLibraryStore.getState().renormalizeAll()
})
