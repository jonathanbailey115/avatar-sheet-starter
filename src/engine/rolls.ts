import { rollDie, secureRandom } from './dice'
import type { Rng } from './dice'

/**
 * Rolling. All dice go through `Rng`, so tests are deterministic and play uses crypto randomness.
 * Advantage/disadvantage, critical hits (natural 20 or an extended range), and damage dice
 * doubling on a critical are 5e rules; gmbinder only changes them through features.
 */

export type RollMode = 'normal' | 'advantage' | 'disadvantage'

export interface D20Result {
    /** The dice that count first, then any that were dropped, in roll order. */
    dice: number[]
    natural: number
    discarded: number[]
    mode: RollMode
    modifier: number
    total: number
    /** Natural roll at or above the critical threshold (natural 20 by default). */
    critical: boolean
    /** Natural 1 on the kept die. */
    fumble: boolean
}

export function rollD20(options: {
    modifier: number
    mode?: RollMode
    critMin?: number
    rng?: Rng
}): D20Result {
    const { modifier, mode = 'normal', critMin = 20, rng = secureRandom } = options

    const first = rollDie(20, rng)
    const second = mode === 'normal' ? null : rollDie(20, rng)

    let natural = first
    let discarded: number[] = []
    if (second !== null) {
        const keep = mode === 'advantage' ? Math.max(first, second) : Math.min(first, second)
        natural = keep
        discarded = [keep === first ? second : first]
    }

    return {
        dice: [natural, ...discarded],
        natural,
        discarded,
        mode,
        modifier,
        total: natural + modifier,
        critical: natural >= critMin,
        fumble: natural === 1,
    }
}

/** Advantage and disadvantage cancel to a normal roll (5e), however many sources there are. */
export function combineModes(...modes: RollMode[]): RollMode {
    const adv = modes.includes('advantage')
    const dis = modes.includes('disadvantage')
    if (adv && !dis) return 'advantage'
    if (dis && !adv) return 'disadvantage'
    return 'normal'
}

export interface DiceTerm {
    count: number
    sides: number
    sign: 1 | -1
}

export interface ParsedExpression {
    terms: DiceTerm[]
    flat: number
}

const MAX_DICE = 100
const MAX_SIDES = 1000

/** Parse "2d6+3", "d20", "1d8 + 1d4 - 1", "5". Returns null if it is not a dice expression. */
export function parseExpression(text: string): ParsedExpression | null {
    const source = text.replace(/\s+/g, '').toLowerCase()
    if (source === '') return null

    const parts = source.match(/[+-]?[^+-]+/g)
    if (!parts || parts.join('') !== source) return null

    const terms: DiceTerm[] = []
    let flat = 0

    for (const part of parts) {
        const sign: 1 | -1 = part.startsWith('-') ? -1 : 1
        const body = part.replace(/^[+-]/, '')
        const dice = body.match(/^(\d*)d(\d+)$/)

        if (dice) {
            const count = dice[1] === '' ? 1 : Number(dice[1])
            const sides = Number(dice[2])
            if (count < 1 || count > MAX_DICE || sides < 1 || sides > MAX_SIDES) return null
            terms.push({ count, sides, sign })
        } else if (/^\d+$/.test(body)) {
            flat += sign * Number(body)
        } else {
            return null
        }
    }

    return { terms, flat }
}

export function formatExpression(expression: ParsedExpression): string {
    const pieces = expression.terms.map(
        (term, index) => `${term.sign < 0 ? '-' : index > 0 ? '+' : ''}${term.count}d${term.sides}`,
    )
    let text = pieces.join('')
    if (expression.flat !== 0) {
        text += `${expression.flat > 0 ? (text ? '+' : '') : '-'}${Math.abs(expression.flat)}`
    }
    return text || '0'
}

export interface ExpressionResult {
    /** Every die rolled, in order. */
    dice: number[]
    flat: number
    total: number
    critical: boolean
    formula: string
}

/**
 * Roll dice plus a flat amount. On a critical hit the dice are rolled twice (the count
 * doubles) and the flat amount is added once. Negative terms are subtracted.
 */
export function rollExpression(
    input: string | ParsedExpression,
    options: { critical?: boolean; extraFlat?: number; rng?: Rng } = {},
): ExpressionResult | null {
    const expression = typeof input === 'string' ? parseExpression(input) : input
    if (!expression) return null

    const { critical = false, extraFlat = 0, rng = secureRandom } = options
    const dice: number[] = []
    let total = expression.flat + extraFlat

    const rolled: ParsedExpression = {
        terms: expression.terms.map((term) => ({
            ...term,
            count: critical && term.sign > 0 ? term.count * 2 : term.count,
        })),
        flat: expression.flat + extraFlat,
    }

    for (const term of rolled.terms) {
        for (let i = 0; i < term.count; i += 1) {
            const roll = rollDie(term.sides, rng)
            dice.push(roll)
            total += term.sign * roll
        }
    }

    return { dice, flat: rolled.flat, total, critical, formula: formatExpression(rolled) }
}

/** Death saving throw outcome (Baseline 5e): 20 revives, 10+ succeeds, below 10 fails, 1 fails twice. */
export type DeathSaveOutcome = 'revive' | 'success' | 'failure' | 'critical-failure'

export function deathSaveOutcome(natural: number): DeathSaveOutcome {
    if (natural === 20) return 'revive'
    if (natural === 1) return 'critical-failure'
    return natural >= 10 ? 'success' : 'failure'
}

export type RollKind =
    | 'check'
    | 'save'
    | 'initiative'
    | 'attack'
    | 'damage'
    | 'death-save'
    | 'hit-die'
    | 'technique'
    | 'custom'

/** One line in the roll log. Everything the log and the campaign feed need to display a roll. */
export interface RollEntry {
    id: string
    at: number
    characterId: string | null
    characterName: string
    kind: RollKind
    label: string
    /** e.g. "1d20+5" or "2d8+3" */
    formula: string
    dice: number[]
    discarded: number[]
    modifier: number
    total: number
    mode: RollMode
    natural?: number
    /** d20 rolls: natural crit / natural 1. */
    crit?: boolean
    fumble?: boolean
    /** Damage rolled as a critical hit (dice doubled). */
    critical?: boolean
    damageType?: string
    /** Damage entries point back at the attack they follow. */
    attackId?: string
    /** Why the roll was made the way it was: advantage/disadvantage sources, bonuses. */
    notes: string[]
}

export function newRollId(): string {
    return globalThis.crypto.randomUUID()
}
