import { getAbilityModifier } from './abilities'
import { SKILL_ABILITIES } from './abilities'
import type { ArmorPiece } from '../data/armor'
import type { GrantedFeature } from './features'
import type {
    AbilityName,
    BonusValue,
    Character,
    EffectTarget,
    FeatureEffect,
    Lineage,
    SkillName,
} from '../types/schema'

/**
 * Effects are the single way a bonus, base value, advantage or disadvantage reaches the sheet.
 * Every effect carries a `source` label so the UI can always say why.
 */
export type Effect = FeatureEffect & { source: string }

export interface EffectContext {
    armor: ArmorPiece | null
    abilityScores: Record<AbilityName, number>
    proficiencyBonus: number
}

export interface RollModifiers {
    advantage: string[]
    disadvantage: string[]
    /** 5e: advantage and disadvantage cancel to a normal roll no matter how many of each. */
    net: 'advantage' | 'disadvantage' | 'normal'
}

export function collectFeatureEffects(granted: GrantedFeature[]): Effect[] {
    return granted.flatMap(({ feature }) =>
        (feature.effects ?? []).map((effect) => ({ ...effect, source: feature.name })),
    )
}

const STRENGTH_DEXTERITY_SKILLS = (Object.keys(SKILL_ABILITIES) as SkillName[]).filter(
    (skill) => SKILL_ABILITIES[skill] === 'strength' || SKILL_ABILITIES[skill] === 'dexterity',
)

function armorIsProficient(category: string, proficiencies: string[] | undefined): boolean | null {
    if (!proficiencies) return null // unknown (custom lineage): don't guess
    return proficiencies.some((entry) => entry.toLowerCase().startsWith(category.toLowerCase()))
}

/** Baseline 5e effects of what the character wears. */
export function armorEffects(
    armor: ArmorPiece | null,
    hasShield: boolean,
    lineage: Lineage | null,
): Effect[] {
    const effects: Effect[] = []

    if (armor?.stealthDisadvantage) {
        effects.push({
            kind: 'disadvantage',
            target: 'skill:Stealth',
            tag: 'armor-stealth',
            source: `${armor.name} armor (Baseline 5e)`,
        })
    }

    const untrained: string[] = []
    if (armor && armorIsProficient(armor.category, lineage?.armorProficiencies) === false) {
        untrained.push(`${armor.category} armor`)
    }
    if (hasShield && armorIsProficient('shield', lineage?.armorProficiencies) === false) {
        untrained.push('shields')
    }

    if (untrained.length > 0) {
        const source = `Not proficient with ${untrained.join(' and ')} (Baseline 5e)`
        const targets: EffectTarget[] = [
            'save:strength',
            'save:dexterity',
            'attack',
            ...STRENGTH_DEXTERITY_SKILLS.map((skill): EffectTarget => `skill:${skill}`),
        ]
        for (const target of targets) effects.push({ kind: 'disadvantage', target, source })
    }

    return effects
}

/**
 * Baseline 5e exhaustion: level 1+ disadvantage on ability checks (skills and initiative);
 * level 3+ disadvantage on attack rolls and saving throws.
 */
export function exhaustionEffects(level: number): Effect[] {
    const effects: Effect[] = []
    if (level >= 1) {
        const source = `Exhaustion ${level} (Baseline 5e)`
        effects.push({ kind: 'disadvantage', target: 'skills', source })
        effects.push({ kind: 'disadvantage', target: 'initiative', source })
        if (level >= 3) {
            effects.push({ kind: 'disadvantage', target: 'saves', source })
            effects.push({ kind: 'disadvantage', target: 'attack', source })
        }
    }
    return effects
}

export function isActive(effect: Effect, context: EffectContext): boolean {
    if (effect.requires === 'no-armor') return context.armor === null
    return true
}

function resolveValue(value: BonusValue, context: EffectContext): number {
    if (typeof value === 'number') return value
    if (value === 'proficiency') return context.proficiencyBonus
    return getAbilityModifier(context.abilityScores[value.ability])
}

export function bonusesFor(
    effects: Effect[],
    targets: EffectTarget[],
    context: EffectContext,
): Array<{ label: string; value: number }> {
    return effects
        .filter((effect) => effect.kind === 'bonus' && targets.includes(effect.target) && isActive(effect, context))
        .map((effect) => ({
            label: effect.source,
            value: effect.kind === 'bonus' ? resolveValue(effect.value, context) : 0,
        }))
}

export function rollModifiersFor(
    effects: Effect[],
    targets: EffectTarget[],
    context: EffectContext,
): RollModifiers {
    const active = effects.filter((effect) => targets.includes(effect.target) && isActive(effect, context))
    const suppressed = new Set(
        active.flatMap((effect) => (effect.kind === 'suppressDisadvantage' ? [effect.tag] : [])),
    )

    const advantage = active.filter((effect) => effect.kind === 'advantage').map((effect) => effect.source)
    const disadvantage = active
        .filter(
            (effect) =>
                effect.kind === 'disadvantage' && !(effect.tag && suppressed.has(effect.tag)),
        )
        .map((effect) => effect.source)

    const net =
        advantage.length > 0 && disadvantage.length === 0
            ? 'advantage'
            : disadvantage.length > 0 && advantage.length === 0
              ? 'disadvantage'
              : 'normal'

    return { advantage, disadvantage, net }
}

export function armorClassFor(
    effects: Effect[],
    context: EffectContext,
    hasShield: boolean,
    shieldBonus: number,
): { total: number; breakdown: Array<{ label: string; value: number }> } {
    const dex = getAbilityModifier(context.abilityScores.dexterity)
    const breakdown: Array<{ label: string; value: number }> = []

    // Candidate base values; the best one wins.
    let best: { total: number; parts: Array<{ label: string; value: number }> }

    if (context.armor) {
        const cap = context.armor.dexCap
        const dexPart = cap === null ? dex : Math.min(dex, cap)
        best = {
            total: context.armor.baseAc + dexPart,
            parts: [
                { label: `${context.armor.name} armor (Baseline 5e)`, value: context.armor.baseAc },
                ...(dexPart !== 0 ? [{ label: 'Dexterity', value: dexPart }] : []),
            ],
        }
    } else {
        best = {
            total: 10 + dex,
            parts: [
                { label: 'Unarmored (Baseline 5e)', value: 10 },
                ...(dex !== 0 ? [{ label: 'Dexterity', value: dex }] : []),
            ],
        }
    }

    for (const effect of effects) {
        if (effect.kind !== 'setBase' || effect.target !== 'ac' || !isActive(effect, context)) continue

        const parts = [
            { label: effect.source, value: effect.base },
            ...effect.abilities.map((ability) => ({
                label: ability[0].toUpperCase() + ability.slice(1),
                value: getAbilityModifier(context.abilityScores[ability]),
            })),
        ].filter((part, index) => index === 0 || part.value !== 0)
        const total = parts.reduce((sum, part) => sum + part.value, 0)

        if (total > best.total) best = { total, parts }
    }

    breakdown.push(...best.parts)
    if (hasShield) breakdown.push({ label: 'Shield (Baseline 5e)', value: shieldBonus })
    breakdown.push(...bonusesFor(effects, ['ac'], context))

    return { total: breakdown.reduce((sum, part) => sum + part.value, 0), breakdown }
}

export function abilityScoresOf(character: Character): Record<AbilityName, number> {
    return {
        strength: character.strength,
        dexterity: character.dexterity,
        constitution: character.constitution,
        intelligence: character.intelligence,
        wisdom: character.wisdom,
        charisma: character.charisma,
    }
}
