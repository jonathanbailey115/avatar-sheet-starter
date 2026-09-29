import { ABILITIES } from './abilities'
import type { AbilityName, Character } from '../types/schema'

/**
 * Ability scores: what a character has, and the ways to make them.
 *
 * Species (gmbinder, Species): Human adds 1 to every ability score. Variant Human adds 1 to two
 * different abilities of the player's choice. Increases stop at 20. "None" means the typed scores
 * are already final (characters made before the species step, and NPCs).
 */

export const SCORE_CAP = 20

type Scores = Record<AbilityName, number>

/** How much the species adds to each ability. */
type SpeciesFields = Partial<Pick<Character, 'species' | 'speciesAbilityChoices'>>

export function speciesBonuses(
    character: SpeciesFields,
): Record<AbilityName, number> {
    const bonuses = Object.fromEntries(ABILITIES.map((ability) => [ability, 0])) as Record<AbilityName, number>
    if (character.species === 'human') {
        for (const ability of ABILITIES) bonuses[ability] = 1
    } else if (character.species === 'variant-human') {
        for (const ability of new Set(character.speciesAbilityChoices ?? []).values()) bonuses[ability] = 1
    }
    return bonuses
}

/** The six typed scores, before the species. */
export function baseScoresOf(character: Pick<Character, AbilityName>): Scores {
    return {
        strength: character.strength,
        dexterity: character.dexterity,
        constitution: character.constitution,
        intelligence: character.intelligence,
        wisdom: character.wisdom,
        charisma: character.charisma,
    }
}

/** One score as the sheet uses it: typed score plus the species bonus. */
export function abilityScore<K extends AbilityName>(character: Pick<Character, K> & SpeciesFields, ability: K): number {
    const base = character[ability] as number
    const bonus = speciesBonuses(character)[ability]
    // A bonus cannot lift a score past 20, but it never lowers a score that is already higher.
    return bonus > 0 ? Math.max(base, Math.min(SCORE_CAP, base + bonus)) : base
}

/** What the sheet uses: typed scores plus the species bonus. */
export function abilityScoresOf(character: Pick<Character, AbilityName> & SpeciesFields): Scores {
    return Object.fromEntries(ABILITIES.map((ability) => [ability, abilityScore(character, ability)])) as Scores
}

// ---- Ways to make the scores (owner decision: standard array, point buy, 4d6 drop lowest, manual) ----

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

export const POINT_BUY_BUDGET = 27
export const POINT_BUY_MIN = 8
export const POINT_BUY_MAX = 15
/** Point cost of each score (5e). */
const POINT_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }

export function pointCost(score: number): number | null {
    return POINT_COST[score] ?? null
}

/** Total points a set of scores costs, or null if any score is outside 8-15. */
export function pointBuyTotal(scores: Scores): number | null {
    let total = 0
    for (const ability of ABILITIES) {
        const cost = pointCost(scores[ability])
        if (cost === null) return null
        total += cost
    }
    return total
}

/** Can this ability go up or down one step and stay within the range and the budget? */
export function canStep(scores: Scores, ability: AbilityName, direction: 1 | -1): boolean {
    const next = scores[ability] + direction
    if (next < POINT_BUY_MIN || next > POINT_BUY_MAX) return false
    const total = pointBuyTotal({ ...scores, [ability]: next })
    return total !== null && total <= POINT_BUY_BUDGET
}

/** Roll 4d6 and drop the lowest die. `rng` returns [0, 1) so tests can be exact. */
export function rollScore(rng: () => number = Math.random): number {
    const dice = Array.from({ length: 4 }, () => 1 + Math.min(5, Math.floor(rng() * 6)))
    return dice.reduce((sum, die) => sum + die, 0) - Math.min(...dice)
}

export function rollScoreSet(rng: () => number = Math.random): number[] {
    return Array.from({ length: 6 }, () => rollScore(rng)).sort((a, b) => b - a)
}

/** Which values of a pool are still unassigned, given what each ability currently holds. */
export function unassigned(pool: number[], assigned: Array<number | null>): number[] {
    const left = [...pool]
    for (const value of assigned) {
        if (value === null) continue
        const index = left.indexOf(value)
        if (index >= 0) left.splice(index, 1)
    }
    return left
}
