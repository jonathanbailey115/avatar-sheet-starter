import { getAbilityModifier } from './abilities'
import { abilityScore } from './abilityScores'
import type { Character, HitDie, Lineage } from '../types/schema'

/**
 * Hit points. Hit die, level-1 HP and per-level HP come from the lineage (gmbinder).
 * Temp HP, damage at 0, massive damage, healing and death saves are Baseline 5e.
 */

type HpFields = Pick<
    Character,
    'hpLost' | 'tempHp' | 'deathSaves' | 'maxHpOverride' | 'maxHpAdjustment' | 'hpRolls' | 'level' | 'constitution'
> &
    Partial<Pick<Character, 'species' | 'speciesAbilityChoices'>>

export type LifeState = 'conscious' | 'dying' | 'stable' | 'dead'

export function averageHitDieRoll(die: HitDie): number {
    return Math.floor(die / 2) + 1
}

export function getHitDie(
    character: Pick<Character, 'lineageId'>,
    lineages: Lineage[],
): HitDie | null {
    return lineages.find((lineage) => lineage.id === character.lineageId)?.hitDie ?? null
}

/** The value used for a given level: the recorded roll, or the average if none. */
export function hitPointGainForLevel(
    character: Pick<Character, 'hpRolls'>,
    level: number,
    die: HitDie,
): number {
    return character.hpRolls[level - 2] ?? averageHitDieRoll(die)
}

/**
 * Max HP: level 1 is a full hit die + Con; each later level adds a roll (or the average) + Con.
 * A level never adds less than 1 HP. An override, when set, replaces the calculation.
 */
export function computeMaxHp(character: HpFields, hitDie: HitDie | null): number {
    if (character.maxHpOverride !== null) return character.maxHpOverride
    if (hitDie === null) return 0

    const con = getAbilityModifier(abilityScore(character, 'constitution'))
    let total = Math.max(1, hitDie + con)

    for (let level = 2; level <= character.level; level += 1) {
        total += Math.max(1, hitPointGainForLevel(character, level, hitDie) + con)
    }

    return Math.max(1, total + character.maxHpAdjustment)
}

export function getCurrentHp(character: Pick<Character, 'hpLost'>, maxHp: number): number {
    return Math.max(0, maxHp - Math.min(character.hpLost, maxHp))
}

export function getLifeState(
    character: Pick<Character, 'hpLost' | 'deathSaves'>,
    maxHp: number,
): LifeState {
    if (character.deathSaves.failures >= 3) return 'dead'
    if (getCurrentHp(character, maxHp) > 0) return 'conscious'
    if (character.deathSaves.successes >= 3) return 'stable'
    return 'dying'
}

const FRESH_DEATH_SAVES = { successes: 0, failures: 0 }

export function applyDamage<T extends HpFields>(
    character: T,
    amount: number,
    maxHp: number,
    options: { critical?: boolean } = {},
): T {
    const damage = Math.floor(amount)
    if (damage <= 0 || getLifeState(character, maxHp) === 'dead') return character

    const absorbed = Math.min(character.tempHp, damage)
    const tempHp = character.tempHp - absorbed
    const remaining = damage - absorbed

    if (remaining === 0) return { ...character, tempHp }

    const current = getCurrentHp(character, maxHp)

    if (current > 0) {
        if (remaining < current) {
            return { ...character, tempHp, hpLost: character.hpLost + remaining }
        }

        // Dropped to 0. Damage left over that equals or exceeds max HP kills outright.
        const overflow = remaining - current
        return {
            ...character,
            tempHp,
            hpLost: maxHp,
            deathSaves: overflow >= maxHp ? { successes: 0, failures: 3 } : FRESH_DEATH_SAVES,
        }
    }

    // Already at 0: each hit is a death save failure (a critical hit counts as two).
    const failures =
        remaining >= maxHp ? 3 : Math.min(3, character.deathSaves.failures + (options.critical ? 2 : 1))

    return { ...character, tempHp, deathSaves: { successes: 0, failures } }
}

export function applyHealing<T extends HpFields>(character: T, amount: number, maxHp: number): T {
    const healing = Math.floor(amount)
    if (healing <= 0 || getLifeState(character, maxHp) === 'dead') return character

    const wasDown = getCurrentHp(character, maxHp) === 0
    const hpLost = Math.max(0, Math.min(character.hpLost, maxHp) - healing)
    const standingNow = maxHp - hpLost > 0

    return {
        ...character,
        hpLost,
        deathSaves: wasDown && standingNow ? FRESH_DEATH_SAVES : character.deathSaves,
    }
}

/**
 * Temp HP does not stack: a new amount only replaces the old one if it is higher,
 * unless `replace` is chosen.
 */
export function setTempHp<T extends Pick<Character, 'tempHp'>>(
    character: T,
    amount: number,
    mode: 'keepHigher' | 'replace' = 'keepHigher',
): T {
    const value = Math.max(0, Math.floor(amount))
    const tempHp = mode === 'replace' ? value : Math.max(character.tempHp, value)
    return { ...character, tempHp }
}

export function recordDeathSave<T extends HpFields>(
    character: T,
    result: 'success' | 'failure',
    maxHp: number,
    options: { critical?: boolean } = {},
): T {
    if (getLifeState(character, maxHp) !== 'dying') return character

    const { successes, failures } = character.deathSaves
    return {
        ...character,
        deathSaves:
            result === 'success'
                ? { successes: Math.min(3, successes + 1), failures }
                : { successes, failures: Math.min(3, failures + (options.critical ? 2 : 1)) },
    }
}

export function resetDeathSaves<T extends Pick<Character, 'deathSaves'>>(character: T): T {
    return { ...character, deathSaves: FRESH_DEATH_SAVES }
}

/** A natural 20 on a death save: regain 1 HP and get back up. */
export function reviveWithOneHp<T extends HpFields>(character: T, maxHp: number): T {
    if (getLifeState(character, maxHp) !== 'dying') return character
    return { ...character, hpLost: Math.max(0, maxHp - 1), deathSaves: FRESH_DEATH_SAVES }
}
