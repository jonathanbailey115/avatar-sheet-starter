import { DRAGON_BREATH_USES, DRAGON_TRAINING_DICE, trainingDieSize } from '../data/dragonTrainer'
import { findAncestry } from '../data/dragonAncestry'
import type { DragonAncestry } from '../data/dragonAncestry'
import type { AbilityName, Character } from '../types/schema'
import { ABILITIES, getAbilityModifier } from './abilities'

/**
 * The Dragon Trainer's dragon companion (Gamingbrew Dragon Trainer, condensed; owner decisions DT1-DT5).
 * Everything scales from the trainer: level in the class, Wisdom modifier and proficiency bonus.
 */

export interface DragonAttack {
    name: string
    toHit: number
    reach: string
    /** Damage dice with the Wisdom modifier already added, e.g. "1d8+3". */
    formula: string
    damageType: string
    /** More damage that goes with a hit, e.g. the ancestry die from Dragon Growth I. */
    extra?: { formula: string; damageType: string }
    note?: string
}

export interface DragonBreath {
    dc: number
    cone: number
    /** e.g. "3d8" */
    formula: string
    damageType: string
    uses: number
}

export interface DragonSheet {
    ancestry: DragonAncestry | null
    trainerLevel: number
    stage: string
    size: string
    armorClass: number
    maxHp: number
    currentHp: number
    tempHp: number
    dead: boolean
    unconscious: boolean
    initiative: number
    speed: number
    flySpeed: number
    abilities: Array<{ key: AbilityName; score: number; modifier: number; save: number }>
    attacks: DragonAttack[]
    breath: DragonBreath | null
    trainingDie: 8 | 10 | 12
    trainingDiceMax: number
    techniqueDc: number
    proficiencyBonus: number
    wisdomModifier: number
}

const BASE_SCORES: Record<AbilityName, number> = { strength: 14, dexterity: 14, constitution: 16, intelligence: 8, wisdom: 12, charisma: 10 }

const strengthAt = (level: number) => (level >= 20 ? 20 : level >= 14 ? 18 : level >= 5 ? 16 : 14)
const sizeAt = (level: number) => (level >= 20 ? 'Huge' : level >= 14 ? 'Large' : level >= 5 ? 'Medium' : 'Small')
const stageAt = (level: number) =>
    level >= 20 ? 'Adult dragon' : level >= 14 ? 'Young dragon' : level >= 5 ? 'Very young dragon' : 'Wyrmling'
const breathDiceAt = (level: number) => (level >= 11 ? 4 : level >= 5 ? 3 : 2)
const coneAt = (level: number) => (level >= 17 ? 60 : level >= 5 ? 30 : 15)

const withModifier = (dice: string, modifier: number) => (modifier === 0 ? dice : `${dice}${modifier > 0 ? '+' : ''}${modifier}`)

type DragonFields = Pick<Character, 'dragonAncestry' | 'dragonHpLost' | 'dragonTempHp' | 'dragonDead'>

/** The companion's maximum Hit Points: 6 plus six times the trainer's level. */
export const dragonMaxHp = (trainerLevel: number): number => 6 + 6 * trainerLevel

export function computeDragon(
    character: DragonFields,
    trainerLevel: number,
    wisdomScore: number,
    proficiencyBonus: number,
): DragonSheet | null {
    if (trainerLevel < 1) return null
    const level = Math.min(20, trainerLevel)
    const ancestry = findAncestry(character.dragonAncestry) ?? null
    const wisdom = getAbilityModifier(wisdomScore)
    const maxHp = dragonMaxHp(level)
    const currentHp = Math.max(0, maxHp - Math.min(character.dragonHpLost, maxHp))
    const damageType = ancestry?.damageType ?? 'ancestry'
    const toHit = wisdom + proficiencyBonus

    const abilities = ABILITIES.map((key) => {
        const score = key === 'strength' ? strengthAt(level) : BASE_SCORES[key]
        const modifier = getAbilityModifier(score)
        // Lifelong Bond: the dragon adds your proficiency bonus to its checks and saves.
        return { key, score, modifier, save: modifier + proficiencyBonus }
    })

    const attacks: DragonAttack[] = [
        {
            name: 'Rend',
            toHit,
            reach: '5 ft.',
            formula: withModifier('1d8', wisdom),
            damageType: 'slashing',
            extra: level >= 5 ? { formula: '1d6', damageType } : undefined,
            note: level >= 7 ? `Empowered Strikes: it can deal ${damageType} instead of slashing.` : undefined,
        },
    ]
    if (level >= 14) {
        attacks.push({
            name: 'Tail',
            toHit,
            reach: '10 ft.',
            formula: withModifier('1d8', wisdom),
            damageType: 'bludgeoning',
            note: 'A Large or smaller target is pushed 15 feet straight away.',
        })
    }

    const die = trainingDieSize(level)
    const techniqueDc = 8 + wisdom + proficiencyBonus
    return {
        ancestry,
        trainerLevel: level,
        stage: stageAt(level),
        size: sizeAt(level),
        armorClass: 14 + wisdom,
        maxHp,
        currentHp,
        tempHp: character.dragonTempHp,
        dead: character.dragonDead,
        unconscious: !character.dragonDead && currentHp === 0,
        initiative: getAbilityModifier(BASE_SCORES.dexterity),
        speed: level >= 14 ? 40 : 30,
        flySpeed: level >= 14 ? 40 : 30,
        abilities,
        attacks,
        breath:
            level >= 2
                ? {
                      dc: techniqueDc,
                      cone: coneAt(level),
                      formula: `${breathDiceAt(level)}d${die}`,
                      damageType,
                      uses: DRAGON_BREATH_USES[level - 1],
                  }
                : null,
        trainingDie: die,
        trainingDiceMax: DRAGON_TRAINING_DICE[level - 1],
        techniqueDc,
        proficiencyBonus,
        wisdomModifier: wisdom,
    }
}

// ---- Hit points of the companion ----

type DragonHp = Pick<Character, 'dragonHpLost' | 'dragonTempHp' | 'dragonDead'>

export function damageDragon<T extends DragonHp>(character: T, amount: number, maxHp: number): T {
    const damage = Math.floor(amount)
    if (damage <= 0 || character.dragonDead) return character
    const absorbed = Math.min(character.dragonTempHp, damage)
    const remaining = damage - absorbed
    return {
        ...character,
        dragonTempHp: character.dragonTempHp - absorbed,
        dragonHpLost: Math.min(maxHp, character.dragonHpLost + remaining),
    }
}

export function healDragon<T extends DragonHp>(character: T, amount: number): T {
    const heal = Math.floor(amount)
    if (heal <= 0 || character.dragonDead) return character
    return { ...character, dragonHpLost: Math.max(0, character.dragonHpLost - heal) }
}

export function setDragonTempHp<T extends DragonHp>(character: T, amount: number): T {
    return { ...character, dragonTempHp: Math.max(character.dragonTempHp, Math.max(0, Math.floor(amount))) }
}

/** Dragon's Defiance: from 0 HP to 1 HP, with temporary Hit Points equal to the trainer's level. */
export function dragonDefiance<T extends DragonHp>(character: T, maxHp: number, trainerLevel: number): T {
    return { ...character, dragonHpLost: Math.max(0, maxHp - 1), dragonTempHp: Math.max(character.dragonTempHp, trainerLevel) }
}

export const killDragon = <T extends DragonHp>(character: T): T => ({ ...character, dragonDead: true })

/** Within 24 hours of its death, 10 minutes of tending restores it to half its Hit Points (rounded down). */
export const reviveDragon = <T extends DragonHp>(character: T, maxHp: number): T => ({
    ...character,
    dragonDead: false,
    dragonHpLost: maxHp - Math.floor(maxHp / 2),
    dragonTempHp: 0,
})

/** A new dragon after 8 hours of bonding: full Hit Points, ancestry chosen again. */
export const newDragon = <T extends DragonHp & { dragonAncestry: string }>(character: T): T => ({
    ...character,
    dragonDead: false,
    dragonHpLost: 0,
    dragonTempHp: 0,
    dragonAncestry: '',
})
