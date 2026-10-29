import { ABILITIES } from '../engine/abilities'
import { SCORE_CAP } from '../engine/abilityScores'
import { pickOne, shuffle } from '../lib/random'
import type { Rng } from '../lib/random'
import type { AbilityName, CharacterClass } from '../types/schema'

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

/** Ability Score Improvement grants in a class table that the NPC has reached. */
export function asiCount(characterClass: CharacterClass | undefined, level: number): number {
    return (characterClass?.featureGrants ?? []).filter(
        (grant) => grant.featureId.endsWith('ability-score-improvement') && grant.level <= level,
    ).length
}

/** The ability a class leans on most: its key abilities (one is picked if there are two), else its bending ability. */
export function primaryAbility(characterClass: CharacterClass | undefined, rng: Rng): AbilityName | null {
    const named = characterClass?.keyAbilities ?? (characterClass?.bendingAbility ? [characterClass.bendingAbility] : [])
    return pickOne(named, rng)
}

/**
 * Standard array by priority: the class's key ability, then Constitution and Dexterity, then the
 * rest in a random order (thinkers put Intelligence and Wisdom first). Then each Ability Score
 * Improvement the class table has granted by this level adds 2 points (each score tops out at the cap).
 */
export function assignAbilities(
    characterClass: CharacterClass | undefined,
    level: number,
    thinker: boolean,
    rng: Rng,
): Record<AbilityName, number> {
    const key = primaryAbility(characterClass, rng)
    const support: AbilityName[] = thinker
        ? ['intelligence', 'wisdom', 'constitution', 'dexterity']
        : ['constitution', 'dexterity', 'wisdom']

    const priority: AbilityName[] = []
    for (const ability of [...(key ? [key] : []), ...support, ...shuffle(ABILITIES, rng)]) {
        if (!priority.includes(ability)) priority.push(ability)
    }

    const scores = Object.fromEntries(
        priority.map((ability, index) => [ability, STANDARD_ARRAY[index]]),
    ) as Record<AbilityName, number>

    let improvements = asiCount(characterClass, level) * 2
    for (const ability of priority) {
        // Whatever is left, up to this ability's room under 20.
        const gain = Math.min(improvements, SCORE_CAP - scores[ability])
        if (gain > 0) {
            scores[ability] += gain
            improvements -= gain
        }
    }
    return scores
}
