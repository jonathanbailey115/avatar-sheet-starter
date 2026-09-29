import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Character } from '../types/schema'
import { useLibraryStore } from './library'

/** The character open in the builder, with a useState-style setter the panels already use. */
export function useActiveCharacter(): {
    character: Character | null
    setCharacter: Dispatch<SetStateAction<Character>>
} {
    const character = useLibraryStore(
        (state) => state.characters.find((item) => item.id === state.activeId) ?? null,
    )
    const updateCharacter = useLibraryStore((state) => state.updateCharacter)

    const setCharacter = useCallback<Dispatch<SetStateAction<Character>>>(
        (value) => {
            const id = useLibraryStore.getState().activeId
            if (!id) return
            updateCharacter(id, (current) =>
                typeof value === 'function' ? value(current) : value,
            )
        },
        [updateCharacter],
    )

    return { character, setCharacter }
}
