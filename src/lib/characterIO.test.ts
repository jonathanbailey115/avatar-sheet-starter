import { CHARACTER_SCHEMA_VERSION } from '../types/schema'
import { describe, expect, it } from 'vitest'
import { createBlankCharacter } from './character'
import { loadStoredCharacters } from './characterLoad'
import {
    parseCharacterImport,
    parseCharacterRecord,
    safeFileName,
    serializeCharacter,
    serializeLibrary,
} from './characterIO'
import { legacyCharacterV1, realContent } from './testFixtures'

describe('character export and import', () => {
    it('round-trips a single character', () => {
        const original = { ...createBlankCharacter(), name: 'Toph', constitution: 16 }
        const result = parseCharacterImport(serializeCharacter(original))
        expect(result.errors).toEqual([])
        expect(result.characters).toEqual([original])
    })

    it('round-trips a whole-library backup', () => {
        const a = { ...createBlankCharacter(), name: 'A' }
        const b = { ...createBlankCharacter(), name: 'B' }
        const result = parseCharacterImport(serializeLibrary([a, b]))
        expect(result.characters.map((c) => c.name)).toEqual(['A', 'B'])
    })

    it('accepts the bare character files older versions exported', () => {
        const result = parseCharacterImport(JSON.stringify(legacyCharacterV1()))
        expect(result.errors).toEqual([])
        expect(result.characters[0].name).toBe('Ling')
        expect(result.characters[0].schemaVersion).toBe(CHARACTER_SCHEMA_VERSION)
    })

    it('imports the good characters and reports the bad ones', () => {
        const good = createBlankCharacter()
        const bad = { ...createBlankCharacter(), strength: 500 }
        const result = parseCharacterImport(JSON.stringify([good, bad]))
        expect(result.characters).toHaveLength(1)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]).toMatch(/Character 2/)
    })

    it('reports garbage without throwing', () => {
        expect(parseCharacterImport('not json').errors[0]).toMatch(/not valid JSON/)
        expect(parseCharacterImport('{"hello":1}').errors[0]).toMatch(/does not contain/)
    })

    it('validates ability scores', () => {
        expect(() => parseCharacterRecord({ ...createBlankCharacter(), wisdom: 0 })).toThrow(/wisdom/)
    })
})

describe('loadStoredCharacters', () => {
    it('never destroys data: unreadable records go to quarantine', () => {
        const broken = { id: 'x', name: 5 }
        const { characters, quarantine } = loadStoredCharacters(
            [legacyCharacterV1(), broken, { ...legacyCharacterV1(), schemaVersion: 99, id: 'future' }],
            realContent,
        )
        expect(characters).toHaveLength(1)
        expect(quarantine).toHaveLength(2)
        expect(quarantine[0].raw).toEqual(broken)
    })

    it('flags a removed class (Guardian) so the player knows', () => {
        const { characters } = loadStoredCharacters([legacyCharacterV1()], realContent)
        expect(characters[0].classId).toBe('')
        expect(characters[0].migrationNotes.join(' ')).toMatch(/guardian/)
        expect(characters[0].selectedFeatureIds).toEqual(['lineage-earth-kingdom-unarmored-defense'])
    })

    it('handles a non-array', () => {
        expect(loadStoredCharacters(undefined, realContent)).toEqual({ characters: [], quarantine: [] })
    })
})

describe('safeFileName', () => {
    it('makes a safe slug', () => {
        expect(safeFileName('Zuko / Prince!', 'character')).toBe('zuko-prince.json')
        expect(safeFileName('', 'character')).toBe('character.json')
    })
})
