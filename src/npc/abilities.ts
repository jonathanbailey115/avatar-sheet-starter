import { pickOne, shuffle } from '../lib/random'
import type { Rng } from '../lib/random'
import type { AbilityName, CharacterClass } from '../types/schema'

const ORDER: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

/** Ability Score Improvement grants in a class table that the NPC has reached. */
export function asiCount(characterClass: CharacterClass | undefined, level: number): number {
    return (characterClass?.featureGrants ?? []).filter(
        (grant) => grant.featureId.endsWith('ability-score-improvement') && grant.level <= level,
    ).length
}

/** The ability a class leans on most. Weaponsmasters use Strength or Dexterity (gmbinder). */
export function primaryAbility(characterClass: CharacterClass | undefined, rng: Rng): AbilityName | null {
    if (!characterClass) return null
    if (characterClass.element && characterClass.bendingAbility) return characterClass.bendingAbility
    return pickOne<AbilityName>(['strength', 'dexterity'], rng)
}

/**
 * Standard array by priority: the class's key ability, then Constitution and Dexterity, then the
 * rest in a random order (thinkers put Intelligence and Wisdom first). Then each Ability Score
 * Improvement the class table has granted by this level adds +2 to the highest score still under 20.
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
    for (const ability of [...(key ? [key] : []), ...support, ...shuffle(ORDER, rng)]) {
        if (!priority.includes(ability)) priority.push(ability)
    }

    const scores = Object.fromEntries(
        priority.map((ability, index) => [ability, STANDARD_ARRAY[index]]),
    ) as Record<AbilityName, number>

    let improvements = asiCount(characterClass, level) * 2
    for (const ability of priority) {
        while (improvements > 0 && scores[ability] < 20) {
            scores[ability] += 2
            improvements -= 2
        }
    }
    return scores
}
