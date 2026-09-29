import type { AbilityName, SkillName } from '../types/schema'

export const ABILITIES: AbilityName[] = [
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
]

export const ABILITY_ABBREVIATIONS: Record<AbilityName, string> = {
    strength: 'STR',
    dexterity: 'DEX',
    constitution: 'CON',
    intelligence: 'INT',
    wisdom: 'WIS',
    charisma: 'CHA',
}

/**
 * Skill to ability map. Religion uses Wisdom, not Intelligence (gmbinder, Skill Checks).
 */
export const SKILL_ABILITIES: Record<SkillName, AbilityName> = {
    Acrobatics: 'dexterity',
    'Animal Handling': 'wisdom',
    Arcana: 'intelligence',
    Athletics: 'strength',
    Deception: 'charisma',
    History: 'intelligence',
    Insight: 'wisdom',
    Intimidation: 'charisma',
    Investigation: 'intelligence',
    Medicine: 'wisdom',
    Nature: 'intelligence',
    Perception: 'wisdom',
    Performance: 'charisma',
    Persuasion: 'charisma',
    Religion: 'wisdom',
    'Sleight of Hand': 'dexterity',
    Stealth: 'dexterity',
    Survival: 'wisdom',
}

export const SKILLS = Object.keys(SKILL_ABILITIES) as SkillName[]

export function getAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2)
}

/** Proficiency bonus by total level: +2 (1-4), +3 (5-8), +4 (9-12), +5 (13-16), +6 (17-20). */
export function getProficiencyBonus(level: number): number {
    if (level >= 17) return 6
    if (level >= 13) return 5
    if (level >= 9) return 4
    if (level >= 5) return 3
    return 2
}

export function formatModifier(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`
}
