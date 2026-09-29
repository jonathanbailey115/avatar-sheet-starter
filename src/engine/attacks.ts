import { findWeapon } from '../data/weapons'
import type { Weapon } from '../data/weapons'
import { getAbilityModifier } from './abilities'
import { bonusesFor, critMinFor, rollModifiersFor } from './effects'
import type { Effect, EffectContext } from './effects'
import type { StatLine } from './statLine'
import type { AbilityName, AttackKind, Character, CharacterClass, Lineage } from '../types/schema'

/**
 * What a character can attack with, and how each attack rolls.
 * Attack roll = d20 + ability modifier + proficiency (if proficient) + bonuses.
 * Damage = weapon or basic-attack dice + ability modifier (+ weapon bonus).
 * Bending Save DC = 8 + proficiency + bending ability modifier (gmbinder).
 */

export interface AttackOption {
    id: string
    name: string
    kind: AttackKind
    source: string
    attack: StatLine
    /** Dice part of the damage, e.g. "1d8". Empty for a flat amount (unarmed strike). */
    damageDice: string
    /** Flat damage added to the dice. */
    damageFlat: number
    damageBreakdown: Array<{ label: string; value: number }>
    damageType: string
    /** Damage dice when a Versatile weapon is held in two hands. */
    versatileDice?: string
    /** Natural roll needed for a critical hit. */
    critMin: number
    range?: string
    properties: string[]
    proficient: boolean
}

export interface BendingSummary {
    ability: AbilityName
    modifier: number
    /** Bending Attack Modifier = proficiency + ability modifier. */
    attackModifier: number
    /** Bending Save DC = 8 + proficiency + ability modifier. */
    saveDc: number
}

export interface AttackBasis {
    character: Character
    characterClass: CharacterClass | undefined
    lineage: Lineage | null
    effects: Effect[]
    context: EffectContext
}

const normalize = (text: string) =>
    text
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/[^a-z]/g, '')
        .replace(/s$/, '')

/** Does a lineage's proficiency list cover this weapon? Matches "Simple Weapons", groups like "Longswords". */
export function weaponProficient(weapon: Weapon, proficiencies: string[] | undefined): boolean {
    if (!proficiencies) return false
    const known = new Set(proficiencies.map(normalize))
    if (known.has(normalize(`${weapon.category} weapons`))) return true
    return weapon.groups.some((group) => known.has(normalize(group)))
}

function weaponAbility(weapon: Weapon, scores: Record<AbilityName, number>): AbilityName {
    const strength = getAbilityModifier(scores.strength)
    const dexterity = getAbilityModifier(scores.dexterity)

    if (weapon.properties.includes('finesse')) return dexterity > strength ? 'dexterity' : 'strength'
    return weapon.kind === 'ranged' ? 'dexterity' : 'strength'
}

const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1)

function attackLine(
    basis: AttackBasis,
    ability: AbilityName,
    proficient: boolean,
    extra: Array<{ label: string; value: number }>,
): StatLine {
    const { effects, context } = basis
    const breakdown = [
        { label: capitalize(ability), value: getAbilityModifier(context.abilityScores[ability]) },
        ...(proficient ? [{ label: 'Proficiency', value: context.proficiencyBonus }] : []),
        ...extra,
        ...bonusesFor(effects, ['attack'], context),
    ]
    return {
        total: breakdown.reduce((sum, part) => sum + part.value, 0),
        breakdown,
        roll: rollModifiersFor(effects, ['attack'], context),
    }
}

export function getBendingSummary(basis: AttackBasis): BendingSummary | null {
    const ability = basis.characterClass?.bendingAbility
    if (!ability) return null

    const modifier = getAbilityModifier(basis.context.abilityScores[ability])
    const proficiency = basis.context.proficiencyBonus
    return {
        ability,
        modifier,
        attackModifier: proficiency + modifier,
        saveDc: 8 + proficiency + modifier,
    }
}

export function getAttacks(basis: AttackBasis): AttackOption[] {
    const { character, characterClass, lineage, effects, context } = basis
    const scores = context.abilityScores
    const attacks: AttackOption[] = []

    // Basic bending attack (no technique), for benders. Proficient in their own bending.
    if (characterClass?.basicAttack && characterClass.bendingAbility) {
        const ability = characterClass.bendingAbility
        const modifier = getAbilityModifier(scores[ability])
        attacks.push({
            id: 'basic-bending',
            name: `${characterClass.element ?? ''} bending attack`.trim(),
            kind: 'bending',
            source: characterClass.name,
            attack: attackLine(basis, ability, true, []),
            damageDice: characterClass.basicAttack.dice,
            damageFlat: modifier,
            damageBreakdown: [{ label: capitalize(ability), value: modifier }],
            damageType: characterClass.basicAttack.damageType ?? '',
            critMin: critMinFor(effects, 'bending', context),
            properties: [],
            proficient: true,
        })
    }

    for (const equipped of character.weapons) {
        const weapon = findWeapon(equipped.weaponId)
        if (!weapon) continue

        const ability = weaponAbility(weapon, scores)
        const modifier = getAbilityModifier(scores[ability])
        const proficient = weaponProficient(weapon, lineage?.weaponProficiencies)
        const bonus = equipped.bonus

        attacks.push({
            id: `weapon:${equipped.id}`,
            name: weapon.name,
            kind: 'weapon',
            source: weapon.source === 'gmbinder' ? 'gmbinder' : 'Baseline 5e',
            attack: attackLine(basis, ability, proficient, bonus ? [{ label: 'Weapon bonus', value: bonus }] : []),
            damageDice: weapon.damage,
            damageFlat: modifier + bonus,
            damageBreakdown: [
                { label: capitalize(ability), value: modifier },
                ...(bonus ? [{ label: 'Weapon bonus', value: bonus }] : []),
            ],
            damageType: weapon.damageType,
            versatileDice: weapon.versatileDamage,
            critMin: critMinFor(effects, 'weapon', context),
            range: weapon.range,
            properties: weapon.properties,
            proficient,
        })
    }

    // Everyone can punch: 1 + Strength bludgeoning (Baseline 5e).
    const strength = getAbilityModifier(scores.strength)
    attacks.push({
        id: 'unarmed',
        name: 'Unarmed strike',
        kind: 'unarmed',
        source: 'Baseline 5e',
        attack: attackLine(basis, 'strength', true, []),
        damageDice: '',
        damageFlat: 1 + strength,
        damageBreakdown: [
            { label: 'Base', value: 1 },
            { label: 'Strength', value: strength },
        ],
        damageType: 'bludgeoning',
        critMin: critMinFor(effects, 'unarmed', context),
        properties: [],
        proficient: true,
    })

    return attacks
}

/** "1d8+3" style text for an attack's damage. */
export function damageFormula(attack: AttackOption, twoHanded = false): string {
    const dice = twoHanded && attack.versatileDice ? attack.versatileDice : attack.damageDice
    if (!dice) return String(Math.max(0, attack.damageFlat))
    if (attack.damageFlat === 0) return dice
    return `${dice}${attack.damageFlat > 0 ? '+' : '-'}${Math.abs(attack.damageFlat)}`
}
