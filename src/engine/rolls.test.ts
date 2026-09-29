import { describe, expect, it } from 'vitest'
import {
    combineModes,
    deathSaveOutcome,
    formatExpression,
    parseExpression,
    rollD20,
    rollExpression,
} from './rolls'

/** rng that returns the given faces of a die with `sides` sides, in order. */
const faces = (sides: number, ...values: number[]) => {
    let index = 0
    return () => (values[index++] - 0.5) / sides
}

describe('rollD20', () => {
    it('normal: one die plus the modifier', () => {
        const result = rollD20({ modifier: 5, rng: faces(20, 12) })
        expect(result).toMatchObject({ natural: 12, total: 17, dice: [12], discarded: [] })
    })

    it('advantage keeps the higher die and shows the dropped one', () => {
        const result = rollD20({ modifier: 2, mode: 'advantage', rng: faces(20, 4, 15) })
        expect(result).toMatchObject({ natural: 15, discarded: [4], total: 17, mode: 'advantage' })
    })

    it('disadvantage keeps the lower die', () => {
        const result = rollD20({ modifier: 2, mode: 'disadvantage', rng: faces(20, 4, 15) })
        expect(result).toMatchObject({ natural: 4, discarded: [15], total: 6 })
    })

    it('a natural 20 is a critical, a natural 1 is a fumble', () => {
        expect(rollD20({ modifier: 0, rng: faces(20, 20) })).toMatchObject({ critical: true, fumble: false })
        expect(rollD20({ modifier: 0, rng: faces(20, 1) })).toMatchObject({ critical: false, fumble: true })
    })

    it('an extended crit range (Superior Critical: 18-20) counts', () => {
        expect(rollD20({ modifier: 0, critMin: 18, rng: faces(20, 18) }).critical).toBe(true)
        expect(rollD20({ modifier: 0, critMin: 18, rng: faces(20, 17) }).critical).toBe(false)
    })

    it('the crit check uses the kept die, not the dropped one', () => {
        const result = rollD20({ modifier: 0, mode: 'disadvantage', rng: faces(20, 20, 3) })
        expect(result.natural).toBe(3)
        expect(result.critical).toBe(false)
    })

    it('with real randomness the natural roll is always 1-20', () => {
        for (let i = 0; i < 300; i += 1) {
            const { natural } = rollD20({ modifier: 0, mode: i % 2 ? 'advantage' : 'normal' })
            expect(natural).toBeGreaterThanOrEqual(1)
            expect(natural).toBeLessThanOrEqual(20)
        }
    })
})

describe('combineModes (5e cancelling)', () => {
    it('cancels no matter how many of each', () => {
        expect(combineModes('advantage', 'advantage', 'disadvantage')).toBe('normal')
        expect(combineModes('advantage')).toBe('advantage')
        expect(combineModes('disadvantage', 'normal')).toBe('disadvantage')
        expect(combineModes()).toBe('normal')
    })
})

describe('parseExpression', () => {
    it('parses dice, flat amounts and mixed expressions', () => {
        expect(parseExpression('2d6+3')).toEqual({ terms: [{ count: 2, sides: 6, sign: 1 }], flat: 3 })
        expect(parseExpression('d20')).toEqual({ terms: [{ count: 1, sides: 20, sign: 1 }], flat: 0 })
        expect(parseExpression('1d8 + 1d4 - 1')).toEqual({
            terms: [{ count: 1, sides: 8, sign: 1 }, { count: 1, sides: 4, sign: 1 }],
            flat: -1,
        })
        expect(parseExpression('5')).toEqual({ terms: [], flat: 5 })
    })

    it('rejects nonsense and absurd sizes', () => {
        for (const bad of ['', 'abc', '2d', 'd0', '0d6', '101d6', '1d1001', '1d6++2', '2x6']) {
            expect(parseExpression(bad)).toBeNull()
        }
    })

    it('round-trips through formatExpression', () => {
        expect(formatExpression(parseExpression('2d6+3')!)).toBe('2d6+3')
        expect(formatExpression(parseExpression('1d8-2')!)).toBe('1d8-2')
        expect(formatExpression(parseExpression('4')!)).toBe('4')
    })
})

describe('rollExpression', () => {
    it('adds dice and the flat amount', () => {
        const result = rollExpression('2d6+3', { rng: faces(6, 4, 5) })!
        expect(result).toMatchObject({ dice: [4, 5], total: 12, formula: '2d6+3', critical: false })
    })

    it('a critical doubles the dice but adds the modifier once', () => {
        const result = rollExpression('1d8+3', { critical: true, rng: faces(8, 6, 2) })!
        expect(result.dice).toEqual([6, 2])
        expect(result.total).toBe(6 + 2 + 3)
        expect(result.formula).toBe('2d8+3')
        expect(result.critical).toBe(true)
    })

    it('a flat-only expression (unarmed strike) is unchanged by a critical', () => {
        expect(rollExpression('4', { critical: true })!.total).toBe(4)
    })

    it('subtracts negative dice and does not double them', () => {
        const result = rollExpression('1d6-1d4', { critical: true, rng: faces(6, 5, 3) })
        expect(result?.dice).toHaveLength(3) // 2d6 (doubled) minus 1d4
    })

    it('returns null for bad input', () => {
        expect(rollExpression('hello')).toBeNull()
    })
})

describe('death saves (Baseline 5e)', () => {
    it('20 revives, 10+ succeeds, under 10 fails, 1 is a critical failure', () => {
        expect(deathSaveOutcome(20)).toBe('revive')
        expect(deathSaveOutcome(10)).toBe('success')
        expect(deathSaveOutcome(9)).toBe('failure')
        expect(deathSaveOutcome(2)).toBe('failure')
        expect(deathSaveOutcome(1)).toBe('critical-failure')
    })
})
