import { describe, expect, it } from 'vitest'
import {
    POINT_BUY_BUDGET,
    STANDARD_ARRAY,
    abilityScoresOf,
    canStep,
    pointBuyTotal,
    pointCost,
    rollScore,
    rollScoreSet,
    speciesBonuses,
    unassigned,
} from './abilityScores'

const scores = { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }
const who = (species: 'none' | 'human' | 'variant-human', choices: Array<'strength' | 'wisdom' | 'charisma'> = []) => ({
    ...scores,
    species,
    speciesAbilityChoices: choices,
})

describe('species bonuses', () => {
    it('Human adds 1 to every ability', () => {
        expect(abilityScoresOf(who('human'))).toEqual({ strength: 11, dexterity: 11, constitution: 11, intelligence: 11, wisdom: 11, charisma: 11 })
    })

    it('Variant Human adds 1 to the two chosen abilities only', () => {
        const result = abilityScoresOf(who('variant-human', ['strength', 'wisdom']))
        expect(result.strength).toBe(11)
        expect(result.wisdom).toBe(11)
        expect(result.charisma).toBe(10)
    })

    it('counts a repeated choice once', () => {
        expect(speciesBonuses(who('variant-human', ['strength', 'strength'])).strength).toBe(1)
    })

    it('"none" leaves the typed scores as they are', () => {
        expect(abilityScoresOf(who('none'))).toEqual(scores)
    })

    it('never lifts a score past 20, and never lowers one that is already higher', () => {
        expect(abilityScoresOf({ ...who('human'), strength: 20 }).strength).toBe(20)
        expect(abilityScoresOf({ ...who('human'), strength: 19 }).strength).toBe(20)
        expect(abilityScoresOf({ ...who('human'), strength: 22 }).strength).toBe(22)
    })
})

describe('standard array and point buy', () => {
    it('the standard array is 15, 14, 13, 12, 10, 8', () => {
        expect(STANDARD_ARRAY).toEqual([15, 14, 13, 12, 10, 8])
    })

    it('costs follow the 5e table', () => {
        expect([8, 9, 10, 11, 12, 13, 14, 15].map(pointCost)).toEqual([0, 1, 2, 3, 4, 5, 7, 9])
        expect(pointCost(16)).toBeNull()
    })

    it('the classic 15/15/15/8/8/8 spends exactly 27 points', () => {
        expect(pointBuyTotal({ strength: 15, dexterity: 15, constitution: 15, intelligence: 8, wisdom: 8, charisma: 8 })).toBe(27)
    })

    it('the standard array itself costs 27 points', () => {
        const [a, b, c, d, e, f] = STANDARD_ARRAY
        expect(pointBuyTotal({ strength: a, dexterity: b, constitution: c, intelligence: d, wisdom: e, charisma: f })).toBe(POINT_BUY_BUDGET)
    })

    it('rejects scores outside 8-15', () => {
        expect(pointBuyTotal({ ...scores, strength: 16 })).toBeNull()
        expect(pointBuyTotal({ ...scores, strength: 7 })).toBeNull()
    })

    it('stops stepping at the range and at the budget', () => {
        const start = { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 }
        expect(canStep(start, 'strength', -1)).toBe(false)
        expect(canStep(start, 'strength', 1)).toBe(true)
        const full = { strength: 15, dexterity: 15, constitution: 15, intelligence: 8, wisdom: 8, charisma: 8 }
        expect(canStep(full, 'intelligence', 1)).toBe(false)
        expect(canStep(full, 'strength', 1)).toBe(false)
        expect(canStep(full, 'strength', -1)).toBe(true)
    })
})

describe('rolling 4d6 and dropping the lowest', () => {
    const sequence = (values: number[]) => {
        let i = 0
        // rng values that map to the given die faces (1-6)
        return () => (values[i++ % values.length] - 0.5) / 6
    }

    it('adds the three highest dice', () => {
        expect(rollScore(sequence([6, 5, 4, 1]))).toBe(15)
        expect(rollScore(sequence([1, 1, 1, 1]))).toBe(3)
        expect(rollScore(sequence([6, 6, 6, 6]))).toBe(18)
    })

    it('always lands between 3 and 18', () => {
        for (let i = 0; i < 500; i += 1) {
            const value = rollScore()
            expect(value).toBeGreaterThanOrEqual(3)
            expect(value).toBeLessThanOrEqual(18)
        }
    })

    it('a set is six scores, highest first', () => {
        const set = rollScoreSet()
        expect(set).toHaveLength(6)
        expect([...set].sort((a, b) => b - a)).toEqual(set)
    })
})

describe('assigning a pool', () => {
    it('shows which values are still free, counting repeats', () => {
        expect(unassigned([15, 14, 13, 12, 10, 8], [15, null, 13, null, null, null])).toEqual([14, 12, 10, 8])
        expect(unassigned([14, 14, 10], [14, null])).toEqual([14, 10])
    })
})

describe('species on the finished sheet', async () => {
    const { computeSheet } = await import('./sheet')
    const { createBlankCharacter } = await import('../lib/character')
    const { normalizeCharacter } = await import('../lib/normalize')
    const { realContent } = await import('../lib/testFixtures')

    const make = (patch: Record<string, unknown>) =>
        normalizeCharacter(
            {
                ...createBlankCharacter(),
                nation: 'Earth Kingdom',
                lineageId: 'earth-kingdom-human',
                classId: 'earthbending',
                constitution: 15,
                dexterity: 13,
                ...patch,
            } as never,
            realContent,
        )

    it('Human raises modifiers, hit points and the Earth Unarmored Defense armor class', () => {
        const none = computeSheet(make({ species: 'none' }), realContent)
        const human = computeSheet(make({ species: 'human' }), realContent)
        const mod = (sheet: typeof none, key: string) => sheet.abilities.find((a) => a.key === key)!
        expect(mod(none, 'constitution').score).toBe(15)
        expect(mod(human, 'constitution').score).toBe(16)
        expect(mod(human, 'constitution').modifier).toBe(3)
        expect(human.maxHp).toBe(none.maxHp + 1)
        // Unarmored Defense: 10 + Dex + Con. 13 -> 14 Dex (+2), 15 -> 16 Con (+3).
        expect(none.armorClass.total).toBe(10 + 1 + 2)
        expect(human.armorClass.total).toBe(10 + 2 + 3)
        expect(human.bending?.saveDc).toBe(none.bending!.saveDc + 1)
    })

    it('Variant Human adds its skill, and drops the choices if the species changes', () => {
        const variant = make({ species: 'variant-human', speciesAbilityChoices: ['wisdom', 'charisma'], speciesSkill: 'Insight' })
        expect(variant.skillProficiencies).toContain('Insight')
        expect(computeSheet(variant, realContent).skills.Insight.proficient).toBe(true)

        const switched = normalizeCharacter({ ...variant, species: 'human' }, realContent)
        expect(switched.speciesSkill).toBeNull()
        expect(switched.speciesAbilityChoices).toEqual([])
        expect(switched.skillProficiencies).not.toContain('Insight')
    })

    it('keeps at most two different Variant Human ability picks', () => {
        const tidy = make({ species: 'variant-human', speciesAbilityChoices: ['wisdom', 'wisdom', 'charisma'] })
        expect(tidy.speciesAbilityChoices).toEqual(['wisdom', 'charisma'])
    })
})
