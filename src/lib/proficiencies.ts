import type {
    AbilityName,
    Background,
    Character,
    CharacterClass,
    ChoiceSet,
    Lineage,
    SkillName,
} from '../types/schema'

export interface ProficiencySourceContext {
    classRecord: CharacterClass | null
    lineageRecord: Lineage | null
    backgroundRecord: Background | null
}

export function resolveProficiencyContext(
    character: Character,
    classes: CharacterClass[],
    lineages: Lineage[],
    backgrounds: Background[],
): ProficiencySourceContext {
    return {
        classRecord: classes.find((item) => item.id === character.classId) ?? null,
        lineageRecord: lineages.find((item) => item.id === character.lineageId) ?? null,
        backgroundRecord:
            backgrounds.find((item) => item.id === character.backgroundId) ?? null,
    }
}

export function uniqueUnion<T>(groups: Array<ReadonlyArray<T>>): T[] {
    const result: T[] = []

    for (const group of groups) {
        for (const item of group) {
            if (!result.includes(item)) {
                result.push(item)
            }
        }
    }

    return result
}

export function difference<T>(
    from: ReadonlyArray<T>,
    remove: ReadonlyArray<T>,
): T[] {
    return from.filter((item) => !remove.includes(item))
}

export function toggleMember<T>(list: ReadonlyArray<T>, item: T): T[] {
    if (list.includes(item)) {
        return list.filter((entry) => entry !== item)
    }

    return [...list, item]
}

export function isSameSequence<T>(a: ReadonlyArray<T>, b: ReadonlyArray<T>): boolean {
    if (a.length !== b.length) {
        return false
    }

    return a.every((item, index) => item === b[index])
}

export function applyChoiceLimit<T>(
    selected: ReadonlyArray<T> | undefined,
    choiceSet: ChoiceSet<T> | undefined,
): T[] {
    if (!choiceSet) {
        return []
    }

    const result: T[] = []

    for (const item of selected ?? []) {
        if (choiceSet.options.includes(item) && !result.includes(item)) {
            result.push(item)
        }
    }

    const cap = Math.max(0, choiceSet.choose)

    return result.slice(0, cap)
}

export function resolveClassSavingThrows(ctx: ProficiencySourceContext): AbilityName[] {
    return ctx.classRecord?.savingThrows ?? []
}

export function resolveLineageGrantedSavingThrows(
    ctx: ProficiencySourceContext,
): AbilityName[] {
    return ctx.lineageRecord?.savingThrows ?? []
}

export function resolveLineageChosenSavingThrows(
    character: Character,
    ctx: ProficiencySourceContext,
): AbilityName[] {
    return applyChoiceLimit(
        character.lineageSavingThrowChoices,
        ctx.lineageRecord?.savingThrowChoices,
    )
}

export function resolveGrantedSavingThrows(
    character: Character,
    ctx: ProficiencySourceContext,
): AbilityName[] {
    return uniqueUnion([
        resolveClassSavingThrows(ctx),
        resolveLineageGrantedSavingThrows(ctx),
        resolveLineageChosenSavingThrows(character, ctx),
    ])
}

export function resolveValidClassSkillChoices(
    character: Character,
    ctx: ProficiencySourceContext,
): SkillName[] {
    return applyChoiceLimit(character.classSkillChoices, ctx.classRecord?.skillChoices)
}

export function resolveLineageSkillChoices(
    character: Character,
    ctx: ProficiencySourceContext,
): SkillName[] {
    return applyChoiceLimit(character.lineageSkillChoices, ctx.lineageRecord?.skillChoices)
}

export function resolveBackgroundSkills(ctx: ProficiencySourceContext): SkillName[] {
    return ctx.backgroundRecord?.skillProficiencies ?? []
}

export function resolveGrantedSkills(
    character: Character,
    ctx: ProficiencySourceContext,
): SkillName[] {
    return uniqueUnion([
        resolveValidClassSkillChoices(character, ctx),
        resolveLineageSkillChoices(character, ctx),
        resolveBackgroundSkills(ctx),
    ])
}

export function deriveLegacySavingThrows(ctx: ProficiencySourceContext): AbilityName[] {
    return resolveClassSavingThrows(ctx)
}

export function deriveLegacySkills(
    character: Character,
    ctx: ProficiencySourceContext,
): SkillName[] {
    return uniqueUnion([
        resolveValidClassSkillChoices(character, ctx),
        resolveBackgroundSkills(ctx),
    ])
}

export function deriveMigratedSavingThrows(
    character: Character,
    ctx: ProficiencySourceContext,
): AbilityName[] {
    return uniqueUnion([
        resolveClassSavingThrows(ctx),
        resolveLineageGrantedSavingThrows(ctx),
        resolveLineageChosenSavingThrows(character, ctx),
        character.manualSavingThrows ?? [],
    ])
}

export function deriveMigratedSkills(
    character: Character,
    ctx: ProficiencySourceContext,
): SkillName[] {
    return uniqueUnion([
        resolveValidClassSkillChoices(character, ctx),
        resolveLineageSkillChoices(character, ctx),
        resolveBackgroundSkills(ctx),
        character.manualSkills ?? [],
    ])
}

export function isSavesMigrated(character: Character): boolean {
    return character.manualSavingThrows !== undefined
}

export function isSkillsMigrated(character: Character): boolean {
    return character.manualSkills !== undefined
}

export function deriveSavingThrowProficiencies(
    character: Character,
    ctx: ProficiencySourceContext,
): AbilityName[] {
    return isSavesMigrated(character)
        ? deriveMigratedSavingThrows(character, ctx)
        : deriveLegacySavingThrows(ctx)
}

export function deriveSkillProficiencies(
    character: Character,
    ctx: ProficiencySourceContext,
): SkillName[] {
    return isSkillsMigrated(character)
        ? deriveMigratedSkills(character, ctx)
        : deriveLegacySkills(character, ctx)
}

export function migrateSavingThrowsOnToggle(
    character: Character,
    ctx: ProficiencySourceContext,
    ability: AbilityName,
): AbilityName[] {
    const currentDisplay = character.savingThrowProficiencies ?? []
    const granted = resolveGrantedSavingThrows(character, ctx)
    const baselineManual = difference(currentDisplay, granted)

    const isChecked = currentDisplay.includes(ability)
    const isGranted = granted.includes(ability)

    if (isChecked && isGranted && !baselineManual.includes(ability)) {
        return baselineManual
    }

    return toggleMember(baselineManual, ability)
}

export function migrateSkillsOnToggle(
    character: Character,
    ctx: ProficiencySourceContext,
    skill: SkillName,
): SkillName[] {
    const currentDisplay = character.skillProficiencies ?? []
    const granted = resolveGrantedSkills(character, ctx)
    const baselineManual = difference(currentDisplay, granted)

    const isChecked = currentDisplay.includes(skill)
    const isGranted = granted.includes(skill)

    if (isChecked && isGranted && !baselineManual.includes(skill)) {
        return baselineManual
    }

    return toggleMember(baselineManual, skill)
}