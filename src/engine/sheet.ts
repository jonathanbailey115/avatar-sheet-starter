import { SHIELD_AC_BONUS, findArmor } from '../data/armor'
import type { ArmorPiece } from '../data/armor'
import { ABILITIES, SKILLS, SKILL_ABILITIES, getAbilityModifier, getProficiencyBonus } from './abilities'
import {
    abilityScoresOf,
    armorClassFor,
    armorEffects,
    bonusesFor,
    collectFeatureEffects,
    exhaustionEffects,
    rollModifiersFor,
} from './effects'
import type { EffectContext } from './effects'
import type { StatLine } from './statLine'

export type { StatLine }
import { getGrantedFeatures } from './features'
import type { GrantedFeature } from './features'
import { getAttacks, getBendingSummary } from './attacks'
import type { AttackOption, BendingSummary } from './attacks'
import { computeMaxHp, getCurrentHp, getHitDie, getLifeState } from './hitPoints'
import type { LifeState } from './hitPoints'
import { hitDiceRemaining } from './rests'
import { getResources, remainingOf, usedOf } from './resources'
import type { ResourceDef } from './resources'
import { withCustomBackground } from '../lib/customBackground'
import type { RulesContent } from '../lib/normalize'
import type { AbilityName, Character, HitDie, SkillName } from '../types/schema'

/**
 * The computed play sheet. Pure: everything the UI shows comes from here, with the
 * reason for every number in `breakdown` and every advantage/disadvantage in `roll`.
 */

export interface ResourceView extends ResourceDef {
    used: number
    remaining: number
}

export interface Sheet {
    proficiencyBonus: number
    maxHp: number
    currentHp: number
    lifeState: LifeState
    hitDie: HitDie | null
    hitDiceTotal: number
    hitDiceRemaining: number
    abilities: Array<{ key: AbilityName; score: number; modifier: number }>
    saves: Record<AbilityName, StatLine & { proficient: boolean }>
    /** Plain ability checks (no skill). */
    checks: Record<AbilityName, StatLine>
    skills: Record<SkillName, StatLine & { proficient: boolean; ability: AbilityName }>
    passives: { perception: number; insight: number; investigation: number }
    initiative: StatLine
    armorClass: StatLine
    armor: ArmorPiece | null
    resources: ResourceView[]
    features: GrantedFeature[]
    attacks: AttackOption[]
    bending: BendingSummary | null
}

function passive(line: StatLine): number {
    const shift = line.roll.net === 'advantage' ? 5 : line.roll.net === 'disadvantage' ? -5 : 0
    return 10 + line.total + shift
}

export function computeSheet(character: Character, baseContent: RulesContent): Sheet {
    const content = withCustomBackground(character, baseContent)
    const proficiencyBonus = getProficiencyBonus(character.level)
    const abilityScores = abilityScoresOf(character)
    const armor = findArmor(character.armorId)
    const lineage = content.lineages.find((item) => item.id === character.lineageId) ?? null

    const features = getGrantedFeatures(character, content)
    const effects = [
        ...collectFeatureEffects(features),
        ...armorEffects(armor, character.hasShield, lineage),
        ...exhaustionEffects(character.exhaustion),
    ]
    const context: EffectContext = { armor, abilityScores, proficiencyBonus }

    const hitDie = getHitDie(character, content.lineages)
    const maxHp = computeMaxHp(character, hitDie)

    const modifierOf = (ability: AbilityName) => getAbilityModifier(abilityScores[ability])

    const abilityLine = (
        ability: AbilityName,
        proficient: boolean,
        targets: Parameters<typeof bonusesFor>[1],
    ): StatLine => {
        const breakdown = [{ label: `${ability[0].toUpperCase()}${ability.slice(1)}`, value: modifierOf(ability) }]
        if (proficient) breakdown.push({ label: 'Proficiency', value: proficiencyBonus })
        breakdown.push(...bonusesFor(effects, targets, context))
        return {
            total: breakdown.reduce((sum, part) => sum + part.value, 0),
            breakdown,
            roll: rollModifiersFor(effects, targets, context),
        }
    }

    const saves = Object.fromEntries(
        ABILITIES.map((ability) => {
            const proficient = character.savingThrowProficiencies.includes(ability)
            return [ability, { ...abilityLine(ability, proficient, ['saves', `save:${ability}`]), proficient }]
        }),
    ) as Sheet['saves']

    const checks = Object.fromEntries(
        ABILITIES.map((ability) => [ability, abilityLine(ability, false, ['skills', `check:${ability}`])]),
    ) as Sheet['checks']

    const skills = Object.fromEntries(
        SKILLS.map((skill) => {
            const ability = SKILL_ABILITIES[skill]
            const proficient = character.skillProficiencies.includes(skill)
            return [skill, { ...abilityLine(ability, proficient, ['skills', `skill:${skill}`]), proficient, ability }]
        }),
    ) as Sheet['skills']

    const initiativeBreakdown = [
        { label: 'Dexterity', value: modifierOf('dexterity') },
        ...bonusesFor(effects, ['initiative'], context),
    ]
    const initiative: StatLine = {
        total: initiativeBreakdown.reduce((sum, part) => sum + part.value, 0),
        breakdown: initiativeBreakdown,
        roll: rollModifiersFor(effects, ['initiative'], context),
    }

    const ac = armorClassFor(effects, context, character.hasShield, SHIELD_AC_BONUS)
    const armorClass: StatLine = {
        ...ac,
        roll: rollModifiersFor(effects, ['ac'], context),
    }

    const resources: ResourceView[] = getResources(character, content).map((def) => ({
        ...def,
        used: usedOf(character, def),
        remaining: remainingOf(character, def),
    }))

    const attackBasis = {
        character,
        characterClass: content.classes.find((item) => item.id === character.classId),
        lineage,
        effects,
        context,
    }

    return {
        proficiencyBonus,
        maxHp,
        currentHp: getCurrentHp(character, maxHp),
        lifeState: getLifeState(character, maxHp),
        hitDie,
        hitDiceTotal: character.level,
        hitDiceRemaining: hitDiceRemaining(character),
        abilities: ABILITIES.map((key) => ({ key, score: abilityScores[key], modifier: modifierOf(key) })),
        saves,
        checks,
        skills,
        passives: {
            perception: passive(skills.Perception),
            insight: passive(skills.Insight),
            investigation: passive(skills.Investigation),
        },
        initiative,
        armorClass,
        armor,
        resources,
        features,
        attacks: getAttacks(attackBasis),
        bending: getBendingSummary(attackBasis),
    }
}
