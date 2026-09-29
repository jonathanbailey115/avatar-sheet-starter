import { describe, expect, it } from 'vitest'
import { createBlankCharacter } from './character'
import { normalizeCharacter } from './normalize'
import { realContent } from './testFixtures'

const EARTH = 'earth-kingdom-human'

describe('normalizeCharacter', () => {
    it('returns the same object when nothing needs changing', () => {
        const character = normalizeCharacter(createBlankCharacter(), realContent)
        expect(normalizeCharacter(character, realContent)).toBe(character)
    })

    it('derives saving throws from the Earth Kingdom lineage plus its chosen save', () => {
        const character = normalizeCharacter(
            {
                ...createBlankCharacter(),
                lineageId: EARTH,
                lineageSavingThrowChoices: ['wisdom'],
            },
            realContent,
        )
        expect(character.savingThrowProficiencies).toEqual(['constitution', 'wisdom'])
    })

    it('caps lineage skill choices at what gmbinder allows (2)', () => {
        const character = normalizeCharacter(
            {
                ...createBlankCharacter(),
                lineageId: EARTH,
                lineageSkillChoices: ['Athletics', 'Stealth', 'Nature'],
            },
            realContent,
        )
        expect(character.skillProficiencies).toEqual(['Athletics', 'Stealth'])
    })

    it('clears a lineage that does not belong to the chosen nation', () => {
        const character = normalizeCharacter(
            { ...createBlankCharacter(), nation: 'Fire Nation', lineageId: EARTH },
            realContent,
        )
        expect(character.lineageId).toBe('')
    })

    it('drops techniques and features that no longer exist', () => {
        const character = normalizeCharacter(
            {
                ...createBlankCharacter(),
                knownTechniques: [{ techniqueId: 'gone', level: 'Trained' }],
                selectedFeatureIds: ['gone', 'class-weaponsmaster-extra-attack'],
            },
            realContent,
        )
        expect(character.knownTechniques).toEqual([])
        expect(character.selectedFeatureIds).toEqual(['class-weaponsmaster-extra-attack'])
    })

    it('keeps manual proficiencies alongside granted ones', () => {
        const character = normalizeCharacter(
            { ...createBlankCharacter(), manualSkills: ['Insight'] },
            realContent,
        )
        expect(character.skillProficiencies).toContain('Insight')
    })

    it('only writes a note for a removed class when asked to (load/import)', () => {
        const stale = { ...createBlankCharacter(), classId: 'guardian' }
        expect(normalizeCharacter(stale, realContent).migrationNotes).toEqual([])
        expect(
            normalizeCharacter(stale, realContent, { reportRemovals: true }).migrationNotes,
        ).toHaveLength(1)
    })

    it('reports removed techniques on load so nothing vanishes silently', () => {
        const stale = {
            ...createBlankCharacter(),
            knownTechniques: [{ techniqueId: 'stone-guard', level: 'Practiced' as const }],
        }
        const loaded = normalizeCharacter(stale, realContent, { reportRemovals: true })
        expect(loaded.knownTechniques).toEqual([])
        expect(loaded.migrationNotes.join(' ')).toMatch(/stone-guard/)
    })
})
