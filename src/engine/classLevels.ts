import { abilityScoresOf } from './abilityScores'
import { ABILITY_NAMES } from './abilities'
import type { AbilityName, Character, CharacterClass, CharacterSubclass } from '../types/schema'

/**
 * Multiclassing (gmbinder, Character Progression; owner decisions MC1-MC3 and LC1 in docs/RULES_QUESTIONS.md).
 *
 * A character has a first class and any number of extra classes, each with its own level. Total level
 * (`character.level`) is the sum. A second subclass of a class you already have is an extra class too.
 * For features and technique slots a class counts at its *effective level*: the most levels in any one
 * entry of that class (gmbinder: 5 levels in one Tradition and 3 in another is a 5th level Earthbender).
 */

export const MAX_CLASS_LEVEL = 20

export interface ClassEntry {
    /** 'primary' or the extra class id. */
    key: string
    classId: string
    subclassId?: string
    level: number
    primary: boolean
}

type LevelFields = Pick<Character, 'classId'> & Partial<Pick<Character, 'level' | 'subclassId' | 'extraClasses'>>

export const totalExtraLevels = (character: Partial<Pick<Character, 'extraClasses'>>): number =>
    (character.extraClasses ?? []).reduce((sum, extra) => sum + extra.level, 0)

/** Levels in the first class: whatever the extra classes do not use. */
export const primaryLevelOf = (character: Partial<Pick<Character, 'level' | 'extraClasses'>>): number =>
    Math.max(0, (character.level ?? MAX_CLASS_LEVEL) - totalExtraLevels(character))

/** Every class entry, the first class first. */
export function classEntries(character: LevelFields): ClassEntry[] {
    const entries: ClassEntry[] = []
    if (character.classId) {
        entries.push({
            key: 'primary',
            classId: character.classId,
            subclassId: character.subclassId,
            level: Math.min(MAX_CLASS_LEVEL, primaryLevelOf(character)),
            primary: true,
        })
    }
    for (const extra of character.extraClasses ?? []) {
        entries.push({
            key: extra.id,
            classId: extra.classId,
            subclassId: extra.subclassId,
            level: Math.min(MAX_CLASS_LEVEL, extra.level),
            primary: false,
        })
    }
    return entries
}

export interface ClassLevel {
    characterClass: CharacterClass
    /** Effective level: the most levels in any one entry of this class. */
    level: number
}

/** Each class the character has once, with its effective level. Unknown class ids are skipped. */
export function classLevelsOf(character: LevelFields, classes: CharacterClass[]): ClassLevel[] {
    const result: ClassLevel[] = []
    for (const entry of classEntries(character)) {
        const characterClass = classes.find((item) => item.id === entry.classId)
        if (!characterClass) continue
        const existing = result.find((item) => item.characterClass.id === characterClass.id)
        if (existing) existing.level = Math.max(existing.level, entry.level)
        else result.push({ characterClass, level: entry.level })
    }
    return result
}

/** The effective level of one class, or 0 if the character does not have it. */
export const levelInClass = (levels: ClassLevel[], classId: string): number =>
    levels.find((item) => item.characterClass.id === classId)?.level ?? 0

/** The class that makes the character a bender (the first one with an element), if any. */
export const bendingClassOf = (levels: ClassLevel[]): ClassLevel | null =>
    levels.find((item) => item.characterClass.element) ?? null

/** Highest total level: 20, or 20 in every class entry when the GM has lifted the cap. */
export function maxTotalLevel(character: Pick<Character, 'levelCapLifted' | 'extraClasses'>): number {
    return character.levelCapLifted ? MAX_CLASS_LEVEL * (1 + character.extraClasses.length) : MAX_CLASS_LEVEL
}

/** One Epic Boon for each class taken to level 20 (owner decision LC3). */
export function boonSlots(character: LevelFields, classes: CharacterClass[]): number {
    return classLevelsOf(character, classes).filter((item) => item.level >= MAX_CLASS_LEVEL).length
}

/** "Airbending 3 / Dragon Trainer 2" for several classes, just the name for one, or "No class". */
export function classSummary(character: LevelFields, classes: CharacterClass[]): string {
    const entries = classEntries(character)
    const nameOf = (classId: string) => classes.find((item) => item.id === classId)?.name ?? classId
    if (entries.length === 0) return 'No class'
    if (entries.length === 1) return nameOf(entries[0].classId)
    return entries.map((entry) => `${nameOf(entry.classId)} ${entry.level}`).join(' / ')
}

/** The levels and extra classes made legal: each class 1-20, total 20 unless the GM lifted the cap, first class at least 1. */
export function fitLevels(
    character: Pick<Character, 'classId' | 'level' | 'extraClasses' | 'levelCapLifted'>,
): Pick<Character, 'level' | 'extraClasses'> {
    const extras = character.classId
        ? character.extraClasses.map((extra) => ({ ...extra, level: Math.min(MAX_CLASS_LEVEL, Math.max(1, Math.round(extra.level))) }))
        : []
    const sum = () => extras.reduce((total, extra) => total + extra.level, 0)

    if (character.levelCapLifted) {
        // The first class gets whatever the extras leave, between 1 and 20 levels.
        const level = Math.min(sum() + MAX_CLASS_LEVEL, Math.max(sum() + 1, Math.round(character.level) || 1))
        return { level, extraClasses: extras }
    }

    const level = Math.min(MAX_CLASS_LEVEL, Math.max(1, Math.round(character.level) || 1))
    // Total level cannot pass 20 here: take levels back from the last extra class first, keeping one for the first class.
    while (extras.length > 0 && sum() > level - 1) {
        const last = extras[extras.length - 1]
        const over = sum() - (level - 1)
        if (last.level > over) last.level -= over
        else extras.pop()
    }
    return { level, extraClasses: extras }
}

/** Abilities, any one of which must be 13 or more to multiclass into this class. */
export function multiclassAbilities(characterClass: CharacterClass): AbilityName[] {
    if (characterClass.multiclassAbilities) return characterClass.multiclassAbilities
    if (characterClass.bendingAbility) return [characterClass.bendingAbility]
    return characterClass.keyAbilities ?? []
}

export const MULTICLASS_MINIMUM = 13

/**
 * Notes about multiclass choices that break gmbinder's rules or still need the GM. These never block
 * anything: the GM decides in play (owner decision MC3).
 */
export function multiclassWarnings(
    character: Pick<Character, AbilityName | 'level' | 'classId' | 'subclassId' | 'extraClasses' | 'species' | 'speciesAbilityChoices'>,
    classes: CharacterClass[],
    subclasses: CharacterSubclass[],
): string[] {
    const warnings: string[] = []
    const scores = abilityScoresOf(character)
    const seen: Array<{ classId: string; subclassId?: string }> = []
    if (character.classId) seen.push({ classId: character.classId, subclassId: character.subclassId })

    for (const extra of character.extraClasses) {
        const characterClass = classes.find((item) => item.id === extra.classId)
        if (!characterClass) continue
        const label = characterClass.name
        const ownClass = seen.some((entry) => entry.classId === extra.classId)
        const havingBending = seen.some((entry) => classes.find((item) => item.id === entry.classId)?.element)

        if (ownClass) {
            if (seen.some((entry) => entry.classId === extra.classId && entry.subclassId === extra.subclassId)) {
                warnings.push(`${label}: pick a different ${characterClass.subclassName ?? 'subclass'} than the one you already have.`)
            }
            if (!extra.master.trim()) warnings.push(`${label}: a second ${characterClass.subclassName ?? 'subclass'} needs a master who taught it (GM rule).`)
            if (!extra.gmApproved) warnings.push(`${label}: waiting for the GM to approve this extra ${characterClass.subclassName ?? 'subclass'}.`)
        } else if (!extra.gmApproved) {
            if (characterClass.element && !havingBending) {
                warnings.push(`${label}: non-benders can't take bending classes (gmbinder). Needs GM approval.`)
            } else if (characterClass.element && havingBending) {
                warnings.push(`${label}: a bender taking a different element's class needs GM approval.`)
            }
        }

        const abilities = multiclassAbilities(characterClass)
        if (abilities.length > 0 && !abilities.some((ability) => scores[ability] >= MULTICLASS_MINIMUM)) {
            warnings.push(`${label}: needs ${abilities.map((ability) => ABILITY_NAMES[ability]).join(' or ')} ${MULTICLASS_MINIMUM} or more.`)
        }

        const subclass = subclasses.find((item) => item.id === extra.subclassId)
        if (subclass && subclass.classId !== extra.classId) warnings.push(`${label}: the chosen subclass belongs to another class.`)
        seen.push({ classId: extra.classId, subclassId: extra.subclassId })
    }
    return warnings
}
