import type { Character } from '../types/schema'

/**
 * The copy of an NPC that goes into a campaign. Players can receive it once revealed, so the GM's
 * private writing stays on the GM's device: notes and the personality fields are blanked.
 */
export function shareableNpc(character: Character): Character {
    return {
        ...structuredClone(character),
        notes: '',
        backgroundNotes: '',
        personality: '',
        ideals: '',
        bonds: '',
        flaws: '',
        migrationNotes: [],
    }
}
