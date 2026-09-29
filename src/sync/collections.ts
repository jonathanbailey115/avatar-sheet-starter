import { useLibraryStore, writeActiveCharacter } from '../store/library'
import { useNpcStore } from '../store/npcs'
import { useRollLog } from '../store/rollLog'
import type { SavedKind } from '../campaign/types'
import type { Character } from '../types/schema'

/** The two lists that sync: the player's characters and the GM's NPCs. */
export interface Collection {
    kind: SavedKind
    all(): Character[]
    /** Add or replace by id. The characters are already validated. */
    put(characters: Character[]): void
    remove(ids: string[]): void
    subscribe(listener: () => void): () => void
}

const upsert = (current: Character[], incoming: Character[]): Character[] => {
    const byId = new Map(incoming.map((character) => [character.id, character]))
    const merged = current.map((character) => byId.get(character.id) ?? character)
    const known = new Set(current.map((character) => character.id))
    return [...merged, ...incoming.filter((character) => !known.has(character.id))]
}

export const collections: Collection[] = [
    {
        kind: 'character',
        all: () => useLibraryStore.getState().characters,
        put: (incoming) => useLibraryStore.setState((state) => ({ characters: upsert(state.characters, incoming) })),
        remove: (ids) => {
            // Deleted on another device: its rolls go too, the same as deleting it here.
            useRollLog.getState().removeForCharacters(ids)
            useLibraryStore.setState((state) => {
                if (state.activeId && ids.includes(state.activeId)) writeActiveCharacter(null)
                return {
                    characters: state.characters.filter((character) => !ids.includes(character.id)),
                    activeId: state.activeId && ids.includes(state.activeId) ? null : state.activeId,
                }
            })
        },
        subscribe: (listener) => useLibraryStore.subscribe(listener),
    },
    {
        kind: 'npc',
        all: () => useNpcStore.getState().npcs,
        put: (incoming) => useNpcStore.setState((state) => ({ npcs: upsert(state.npcs, incoming) })),
        remove: (ids) => useNpcStore.setState((state) => ({ npcs: state.npcs.filter((npc) => !ids.includes(npc.id)) })),
        subscribe: (listener) => useNpcStore.subscribe(listener),
    },
]
