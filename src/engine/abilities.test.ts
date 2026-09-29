import { describe, expect, it } from 'vitest'
import {
    SKILL_ABILITIES,
    formatModifier,
    getAbilityModifier,
    getProficiencyBonus,
} from './abilities'

describe('getAbilityModifier', () => {
    it('follows floor((score - 10) / 2)', () => {
        expect(getAbilityModifier(1)).toBe(-5)
        expect(getAbilityModifier(8)).toBe(-1)
        expect(getAbilityModifier(9)).toBe(-1)
        expect(getAbilityModifier(10)).toBe(0)
        expect(getAbilityModifier(11)).toBe(0)
        expect(getAbilityModifier(20)).toBe(5)
    })
})

describe('getProficiencyBonus', () => {
    it('matches the gmbinder class tables', () => {
        const expected: Record<number, number> = {
            1: 2, 4: 2, 5: 3, 8: 3, 9: 4, 12: 4, 13: 5, 16: 5, 17: 6, 20: 6,
        }
        for (const [level, bonus] of Object.entries(expected)) {
            expect(getProficiencyBonus(Number(level))).toBe(bonus)
        }
    })
})

describe('formatModifier', () => {
    it('adds a plus sign to non-negative values', () => {
        expect(formatModifier(0)).toBe('+0')
        expect(formatModifier(3)).toBe('+3')
        expect(formatModifier(-2)).toBe('-2')
    })
})

describe('SKILL_ABILITIES', () => {
    it('uses Wisdom for Religion (gmbinder Skill Checks)', () => {
        expect(SKILL_ABILITIES.Religion).toBe('wisdom')
    })
})
