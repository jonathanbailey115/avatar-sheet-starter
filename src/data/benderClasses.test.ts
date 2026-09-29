import { describe, expect, it } from 'vitest'
import { computeSheet } from '../engine/sheet'
import { disciplinesOf, learnBlocker } from '../engine/techniques'
import { NATION_ELEMENT } from '../engine/bending'
import { createBlankCharacter } from '../lib/character'
import { realContent } from '../lib/testFixtures'
import { airMechanics, fireMechanics, waterMechanics } from './techniques/elementMechanics'
import type { AbilityName, Character, Nation } from '../types/schema'

const CASES: Array<{ classId: string; nation: Nation; ability: AbilityName }> = [
    { classId: 'earthbending', nation: 'Earth Kingdom', ability: 'constitution' },
    { classId: 'waterbending', nation: 'Water Tribe', ability: 'charisma' },
    { classId: 'firebending', nation: 'Fire Nation', ability: 'strength' },
    { classId: 'airbending', nation: 'Air Nomads', ability: 'wisdom' },
]

function build(classId: string, nation: Nation, level: number, patch: Partial<Character> = {}): Character {
    const lineage = realContent.lineages.find((item) => item.nation === nation)
    return {
        ...createBlankCharacter('Player Character'),
        nation,
        lineageId: lineage?.id ?? '',
        classId,
        level,
        ...patch,
    }
}

describe('bending classes', () => {
    it.each(CASES)('$classId bends $nation’s element with $ability', ({ classId, nation, ability }) => {
        const cls = realContent.classes.find((item) => item.id === classId)
        expect(cls?.element).toBe(NATION_ELEMENT[nation])
        expect(cls?.bendingAbility).toBe(ability)
    })

    it.each(CASES)('$classId: Bending Save DC is 8 + proficiency + ability modifier', ({ classId, nation, ability }) => {
        const character = build(classId, nation, 5, { [ability]: 16 })
        const sheet = computeSheet(character, realContent)
        expect(sheet.bending?.ability).toBe(ability)
        expect(sheet.bending?.saveDc).toBe(8 + sheet.proficiencyBonus + 3)
        expect(sheet.bending?.attackModifier).toBe(sheet.proficiencyBonus + 3)
    })

    it.each(CASES)('$classId has the Benders technique slots and full ASI grants', ({ classId, nation }) => {
        const cls = realContent.classes.find((item) => item.id === classId)
        expect(cls?.techniqueSlots).toHaveLength(20)
        const asi = cls?.featureGrants.filter((grant) => grant.featureId.endsWith('ability-score-improvement')).map((grant) => grant.level)
        expect(asi).toEqual([4, 9, 12, 16, 19])
        expect(computeSheet(build(classId, nation, 20), realContent).resources.some((r) => r.kind === 'slot')).toBe(true)
    })

    it('Airbending has no subclass and no Extra Attack, as the source gives none', () => {
        const air = realContent.classes.find((item) => item.id === 'airbending')
        expect(realContent.subclasses.filter((item) => item.classId === 'airbending')).toEqual([])
        expect(air?.featureGrants.some((grant) => grant.featureId.includes('extra-attack'))).toBe(false)
    })

    it('Quick Reflexes adds the Wisdom modifier to an Airbender’s initiative from level 10', () => {
        const before = computeSheet(build('airbending', 'Air Nomads', 9, { wisdom: 16, dexterity: 10 }), realContent)
        const after = computeSheet(build('airbending', 'Air Nomads', 10, { wisdom: 16, dexterity: 10 }), realContent)
        expect(after.initiative.total - before.initiative.total).toBe(3)
        expect(after.initiative.breakdown.some((part) => part.label === 'Quick Reflexes')).toBe(true)
    })
})

describe('sub-bending disciplines', () => {
    const bloodTechnique = realContent.techniques.find((item) => item.discipline === 'Bloodbending')!
    const combustion = realContent.techniques.find((item) => item.discipline === 'Combustionbending')!
    const water = realContent.classes.find((item) => item.id === 'waterbending')
    const fire = realContent.classes.find((item) => item.id === 'firebending')

    it('Bloodbending techniques need the Path of the Bloodbender', () => {
        const plain = build('waterbending', 'Water Tribe', 5, { subclassId: 'path-of-the-waterbender' })
        const blood = build('waterbending', 'Water Tribe', 5, { subclassId: 'path-of-the-bloodbender' })
        const learnable = (c: Character) =>
            learnBlocker(c, { ...bloodTechnique, rare: false, prerequisite: undefined }, water, realContent.techniques, disciplinesOf(c, realContent.subclasses))
        expect(learnable(plain)).toMatch(/Bloodbending/)
        expect(learnable(blood)).toBeNull()
    })

    it('the gate only opens once the subclass is unlocked', () => {
        const early = build('firebending', 'Fire Nation', 2, { subclassId: 'principles-of-the-combustionbender' })
        expect(disciplinesOf(early, realContent.subclasses)).toEqual([])
        expect(learnBlocker(early, { ...combustion, rare: false, prerequisite: undefined }, fire, realContent.techniques, [])).toMatch(/Combustionbending/)
    })

    it('a prerequisite written with two names still finds its technique (Water Whip / Water Rope)', () => {
        const wall = realContent.techniques.find((item) => item.prerequisite?.includes('Water Whip'))
        if (!wall) return
        const character = build('waterbending', 'Water Tribe', 9)
        expect(learnBlocker(character, wall, water, realContent.techniques)).toMatch(/Requires .*Water Whip/)
    })
})

describe('technique content', () => {
    it('every hand-authored mechanic belongs to a real technique', () => {
        const ids = new Set(realContent.techniques.map((item) => item.id))
        for (const id of [...Object.keys(waterMechanics), ...Object.keys(fireMechanics), ...Object.keys(airMechanics)]) {
            expect(ids.has(id), id).toBe(true)
        }
    })

    it('technique ids are unique across every element', () => {
        const ids = realContent.techniques.map((item) => item.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it('every element has a technique list and a class that draws from it', () => {
        for (const { classId } of CASES) {
            const cls = realContent.classes.find((item) => item.id === classId)!
            const own = realContent.techniques.filter((item) => item.element === cls.element)
            expect(own.length, classId).toBeGreaterThan(10)
        }
    })
})
