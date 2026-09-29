import { describe, expect, it } from 'vitest'
import { CHARACTER_SCHEMA_VERSION, DEFAULT_TRAINING } from '../types/schema'
import { parseCharacterRecord } from './characterIO'
import { getSchemaVersion, migrateCharacter } from './migrations'
import { abilityScoresOf } from '../engine/abilityScores'
import { createBlankCharacter } from './character'
import { legacyCharacterV1 } from './testFixtures'

describe('schema 1 -> 2 migration', () => {
    it('treats data with no schemaVersion as version 1', () => {
        expect(getSchemaVersion(legacyCharacterV1())).toBe(1)
    })

    it('drops chi, bendingType and style', () => {
        const migrated = migrateCharacter(legacyCharacterV1())
        expect(migrated).not.toHaveProperty('chi')
        expect(migrated).not.toHaveProperty('bendingType')
        expect(migrated).not.toHaveProperty('style')
        expect(migrated).not.toHaveProperty('techniques')
        expect(migrated.schemaVersion).toBe(CHARACTER_SCHEMA_VERSION)
    })

    it('keeps old techniques as Practiced and tells the player', () => {
        const character = parseCharacterRecord(legacyCharacterV1())
        expect(character.knownTechniques).toEqual([
            { techniqueId: 'stone-guard', level: 'Practiced', training: DEFAULT_TRAINING },
        ])
        expect(character.migrationNotes.join(' ')).toMatch(/Practiced/)
    })

    it('replaces the removed "Mixed" nation and explains why', () => {
        const character = parseCharacterRecord(legacyCharacterV1({ nation: 'Mixed', lineageId: 'mixed-heritage' }))
        expect(character.nation).toBe('Earth Kingdom')
        expect(character.migrationNotes.join(' ')).toMatch(/Mixed/)
    })

    it('keeps everything the player entered', () => {
        const character = parseCharacterRecord(legacyCharacterV1())
        expect(character.name).toBe('Ling')
        expect(character.level).toBe(3)
        expect(character.constitution).toBe(14)
        expect(character.selectedFeatureIds).toContain('lineage-earth-kingdom-unarmored-defense')
    })

    it('keeps older free-form tools and languages as manual entries', () => {
        const character = parseCharacterRecord(legacyCharacterV1())
        expect(character.manualTools).toEqual(['Smith’s Tools'])
        expect(character.manualLanguages).toEqual(['Common'])
    })
})

describe('migrateCharacter', () => {
    it('is idempotent for current data', () => {
        const once = parseCharacterRecord(legacyCharacterV1())
        const twice = parseCharacterRecord(JSON.parse(JSON.stringify(once)))
        expect(twice).toEqual(once)
    })

    it('refuses data from a newer app version instead of damaging it', () => {
        expect(() => migrateCharacter({ ...legacyCharacterV1(), schemaVersion: 99 })).toThrow(/newer version/)
    })

    it('rejects non-objects', () => {
        expect(() => migrateCharacter(null)).toThrow()
        expect(() => migrateCharacter('nope')).toThrow()
    })
})

describe('schema 2 -> 3 migration', () => {
    /** What a saved schema 2 file looked like: has `hp`, no play state. */
    const v2 = (overrides: Record<string, unknown> = {}) => {
        const migrated = migrateCharacter(legacyCharacterV1()) as Record<string, unknown>
        const playFields = [
            'hpLost', 'tempHp', 'hitDiceUsed', 'deathSaves', 'exhaustion', 'resourcesUsed',
            'hpRolls', 'maxHpAdjustment', 'maxHpOverride', 'armorId', 'hasShield',
        ]
        const rest = Object.fromEntries(Object.entries(migrated).filter(([key]) => !playFields.includes(key)))
        return { ...rest, schemaVersion: 2, hp: 21, ...overrides }
    }

    it('adds play state with full HP and no spent resources', () => {
        const c = parseCharacterRecord(v2())
        expect(c.schemaVersion).toBe(CHARACTER_SCHEMA_VERSION)
        expect(c).toMatchObject({ hpLost: 0, tempHp: 0, hitDiceUsed: 0, exhaustion: 0, resourcesUsed: {}, hasShield: false })
        expect(c.deathSaves).toEqual({ successes: 0, failures: 0 })
    })

    it('keeps an NPC hp as a max HP override', () => {
        expect(parseCharacterRecord(v2({ role: 'NPC' })).maxHpOverride).toBe(21)
    })

    it('drops placeholder hp on player characters so HP is calculated', () => {
        expect(parseCharacterRecord(v2()).maxHpOverride).toBeNull()
    })

    it('asks the player to pick typed armor from the list', () => {
        const c = parseCharacterRecord(v2({ armorName: 'Leather' }))
        expect(c.armorId).toBe('')
        expect(c.migrationNotes.join(' ')).toMatch(/Leather/)
    })
})

describe('schema 3 -> 4 migration', () => {
    const v3 = (overrides: Record<string, unknown> = {}) => {
        const { weapons: _weapons, ...rest } = migrateCharacter(legacyCharacterV1()) as Record<string, unknown>
        return { ...rest, schemaVersion: 3, ...overrides }
    }

    it('adds an empty weapon list', () => {
        const c = parseCharacterRecord(v3())
        expect(c.weapons).toEqual([])
        expect(c.schemaVersion).toBe(CHARACTER_SCHEMA_VERSION)
    })

    it('keeps typed weapon notes and asks the player to pick weapons', () => {
        const c = parseCharacterRecord(v3({ weaponNotes: 'A dao sword' }))
        expect(c.weaponNotes).toBe('A dao sword')
        expect(c.migrationNotes.join(' ')).toMatch(/weapon list/)
    })

    it('does not nag when there were no weapon notes', () => {
        expect(parseCharacterRecord(v3()).migrationNotes.join(' ')).not.toMatch(/weapon list/)
    })
})

describe('schema 4 -> 5 migration', () => {
    const v4 = (overrides: Record<string, unknown> = {}) => {
        const { customBackground: _c, ...rest } = migrateCharacter(legacyCharacterV1()) as Record<string, unknown>
        return {
            ...rest,
            schemaVersion: 4,
            knownTechniques: [{ techniqueId: 'earth-tremors', level: 'Trained' }],
            ...overrides,
        }
    }

    it('gives every known technique fresh training state', () => {
        const c = parseCharacterRecord(v4())
        expect(c.knownTechniques).toEqual([
            { techniqueId: 'earth-tremors', level: 'Trained', training: DEFAULT_TRAINING },
        ])
    })

    it('starts with no custom background', () => {
        expect(parseCharacterRecord(v4()).customBackground).toBeNull()
    })
})

describe('schema 5 to 6: species', () => {
    it('keeps every typed ability score exactly as it was (species "none")', () => {
        const old = { ...JSON.parse(JSON.stringify(createBlankCharacter())), schemaVersion: 5, strength: 14, constitution: 9 }
        delete (old as Record<string, unknown>).species
        delete (old as Record<string, unknown>).speciesAbilityChoices
        delete (old as Record<string, unknown>).speciesSkill
        const migrated = migrateCharacter(old) as Record<string, unknown>
        expect(migrated.schemaVersion).toBe(6)
        expect(migrated).toMatchObject({ species: 'none', speciesAbilityChoices: [], speciesSkill: null, strength: 14, constitution: 9 })
        expect(abilityScoresOf(migrated as never).strength).toBe(14)
    })
})
