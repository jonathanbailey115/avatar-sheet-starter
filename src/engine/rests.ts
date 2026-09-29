import { getAbilityModifier } from './abilities'
import { abilityScoresOf } from './abilityScores'
import { rollDie, secureRandom } from './dice'
import type { Rng } from './dice'
import { applyHealing, getHitDie, computeMaxHp, getLifeState } from './hitPoints'
import { getResources } from './resources'
import type { RulesContent } from '../lib/normalize'
import type { Character } from '../types/schema'

/**
 * Rests. What recharges on which rest comes from gmbinder (each resource's recharge).
 * Hit dice spending and recovery, and reducing exhaustion, are Baseline 5e.
 */

export function hitDiceRemaining(character: Pick<Character, 'level' | 'hitDiceUsed'>): number {
    return Math.max(0, character.level - character.hitDiceUsed)
}

export interface ShortRestResult {
    character: Character
    /** Each hit die rolled, before adding Constitution. */
    rolls: number[]
    healed: number
}

export function shortRest(
    character: Character,
    content: RulesContent,
    options: { spendHitDice: number; rng?: Rng },
): ShortRestResult {
    const rng = options.rng ?? secureRandom
    const hitDie = getHitDie(character, content.lineages)
    const maxHp = computeMaxHp(character, hitDie)
    const con = getAbilityModifier(abilityScoresOf(character).constitution)
    const alive = getLifeState(character, maxHp) !== 'dead'

    const toSpend =
        hitDie && alive
            ? Math.min(Math.max(0, Math.floor(options.spendHitDice)), hitDiceRemaining(character))
            : 0

    let next = character
    const rolls: number[] = []
    let healed = 0

    for (let i = 0; i < toSpend && hitDie; i += 1) {
        const roll = rollDie(hitDie, rng)
        const amount = Math.max(0, roll + con)
        rolls.push(roll)
        healed += amount
        next = applyHealing(next, amount, maxHp)
    }

    next = { ...next, hitDiceUsed: character.hitDiceUsed + rolls.length }

    // Anything that recharges on a short rest (or "short or long") is restored.
    const used = { ...next.resourcesUsed }
    for (const def of getResources(next, content)) {
        if (def.recharge === 'Short Rest') delete used[def.id]
    }
    next = { ...next, resourcesUsed: used }

    return { character: next, rolls, healed }
}

export function longRest(character: Character, content: RulesContent): Character {
    const maxHp = computeMaxHp(character, getHitDie(character, content.lineages))
    if (getLifeState(character, maxHp) === 'dead') return character

    const used = { ...character.resourcesUsed }
    for (const def of getResources(character, content)) {
        if (def.recharge === 'Short Rest' || def.recharge === 'Long Rest') delete used[def.id]
    }

    return {
        ...character,
        hpLost: 0,
        tempHp: 0,
        hitDiceUsed: Math.max(0, character.hitDiceUsed - Math.max(1, Math.floor(character.level / 2))),
        deathSaves: { successes: 0, failures: 0 },
        exhaustion: Math.max(0, character.exhaustion - 1),
        resourcesUsed: used,
    }
}
