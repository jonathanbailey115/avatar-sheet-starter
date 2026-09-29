import { describe, expect, it } from 'vitest'
import { rollDice, rollDie, secureRandom } from './dice'

describe('rollDie', () => {
    it('maps the rng range onto 1..sides inclusive', () => {
        expect(rollDie(20, () => 0)).toBe(1)
        expect(rollDie(20, () => 0.9999999)).toBe(20)
        expect(rollDie(6, () => 0.5)).toBe(4)
    })

    it('never exceeds the die even if the rng returns exactly 1', () => {
        expect(rollDie(8, () => 1)).toBe(8)
    })

    it('rejects nonsense dice', () => {
        expect(() => rollDie(0)).toThrow()
        expect(() => rollDie(2.5)).toThrow()
    })

    it('secure rolls stay in range and hit every face of a d6', () => {
        const seen = new Set<number>()
        for (let i = 0; i < 600; i += 1) {
            const roll = rollDie(6)
            expect(roll).toBeGreaterThanOrEqual(1)
            expect(roll).toBeLessThanOrEqual(6)
            seen.add(roll)
        }
        expect(seen.size).toBe(6)
    })
})

describe('rollDice / secureRandom', () => {
    it('rolls the requested count', () => {
        expect(rollDice(3, 4, () => 0)).toEqual([1, 1, 1])
        expect(rollDice(0, 4)).toEqual([])
    })

    it('secureRandom is in [0, 1)', () => {
        for (let i = 0; i < 100; i += 1) {
            const value = secureRandom()
            expect(value).toBeGreaterThanOrEqual(0)
            expect(value).toBeLessThan(1)
        }
    })
})
