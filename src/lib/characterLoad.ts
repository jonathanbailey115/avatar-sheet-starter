import { parseCharacterRecord } from './characterIO'
import { normalizeCharacter } from './normalize'
import type { RulesContent } from './normalize'
import type { Character } from '../types/schema'

/** A stored record that could not be loaded. Kept so nothing is ever silently destroyed. */
export interface QuarantinedRecord {
    raw: unknown
    error: string
}

export interface LoadedCharacters {
    characters: Character[]
    quarantine: QuarantinedRecord[]
}

/** Migrate, validate and normalize stored character records. Never throws. */
export function loadStoredCharacters(raw: unknown, content: RulesContent): LoadedCharacters {
    const characters: Character[] = []
    const quarantine: QuarantinedRecord[] = []

    if (!Array.isArray(raw)) return { characters, quarantine }

    for (const record of raw) {
        try {
            const character = parseCharacterRecord(record)
            characters.push(normalizeCharacter(character, content, { reportRemovals: true }))
        } catch (error) {
            quarantine.push({
                raw: record,
                error: error instanceof Error ? error.message : 'Unknown error.',
            })
        }
    }

    return { characters, quarantine }
}
