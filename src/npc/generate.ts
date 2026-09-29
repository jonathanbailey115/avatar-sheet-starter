import { NATION_ELEMENT } from '../engine/bending'
import { createBlankCharacter } from '../lib/character'
import { normalizeCharacter } from '../lib/normalize'
import { pickMany, pickOne, weightedPick } from '../lib/random'
import type { Rng } from '../lib/random'
import { nations } from '../types/schema'
import type { AbilityName, Character, CharacterClass, ChoiceSet, Lineage, Nation, SkillName } from '../types/schema'
import { assignAbilities } from './abilities'
import { equip } from './gear'
import { BONDS, FLAWS, IDEALS, PERSONALITY, generateName } from './names'
import { learnTechniques } from './techniques'
import { DEFAULT_COMBAT } from './types'
import type { NpcContext, NpcPart, NpcResult, NpcSpec } from './types'

const clampLevel = (level: number) => Math.min(20, Math.max(1, Math.round(level) || 1))
const combatOf = (ctx: NpcContext) => ctx.template.combat ?? DEFAULT_COMBAT

function choose<T>(set: ChoiceSet<T> | undefined, rng: Rng): T[] {
    return set ? pickMany(set.options, set.choose, rng) : []
}

function pickNation(ctx: NpcContext, rng: Rng, avoid?: Nation): Nation {
    const entries = nations
        .filter((nation) => nation !== avoid)
        .map((nation) => ({ item: nation, weight: ctx.template.nationWeights[nation] ?? 0 }))
    return weightedPick(entries, rng) ?? pickOne(nations.filter((n) => n !== avoid), rng) ?? 'Earth Kingdom'
}

/** A class fits a nation when it is not a bender, or bends that nation's element (gmbinder, Benders). */
function classFits(characterClass: CharacterClass, nation: Nation): boolean {
    return !characterClass.element || characterClass.element === NATION_ELEMENT[nation]
}

function pickClass(ctx: NpcContext, nation: Nation, rng: Rng, avoid?: string): CharacterClass | null {
    const weights = ctx.template.bendingWeights
    const fitting = ctx.content.classes.filter((item) => classFits(item, nation))
    const options = fitting.filter((item) => item.id !== avoid)
    const entries = (options.length > 0 ? options : fitting).map((item) => ({
        item,
        weight: weights[item.element ?? 'Non-Bender'] ?? 0,
    }))
    return weightedPick(entries, rng) ?? pickOne(fitting, rng)
}

function withLineage(character: Character, nation: Nation, ctx: NpcContext, rng: Rng): Character {
    const lineage: Lineage | undefined = pickOne(
        ctx.content.lineages.filter((item) => item.nation === nation || item.nation === 'Any'),
        rng,
    ) ?? undefined
    const skills = choose<SkillName>(lineage?.skillChoices, rng)
    const saves = choose<AbilityName>(lineage?.savingThrowChoices, rng)
    return {
        ...character,
        nation,
        lineageId: lineage?.id ?? '',
        lineageSkillChoices: skills,
        lineageSavingThrowChoices: saves,
        lineageToolChoices: choose<string>(lineage?.toolChoices, rng),
        lineageFavoredTerrains: [],
    }
}

function withClass(character: Character, characterClass: CharacterClass | null, ctx: NpcContext, rng: Rng): Character {
    const subclasses = ctx.content.subclasses.filter((item) => item.classId === characterClass?.id && item.unlockLevel <= character.level)
    return {
        ...character,
        classId: characterClass?.id ?? '',
        subclassId: pickOne(subclasses, rng)?.id,
        classSkillChoices: choose<SkillName>(characterClass?.skillChoices, rng),
        selectedFeatureIds: [],
    }
}

function withAbilities(character: Character, ctx: NpcContext, rng: Rng): Character {
    const characterClass = ctx.content.classes.find((item) => item.id === character.classId)
    return { ...character, ...assignAbilities(characterClass, character.level, combatOf(ctx) < 0.3, rng) }
}

function withPersona(character: Character, ctx: NpcContext, rng: Rng): Character {
    return {
        ...character,
        backgroundId: pickOne(ctx.content.backgrounds, rng)?.id,
        customBackground: null,
        personality: pickOne(PERSONALITY, rng) ?? '',
        ideals: pickOne(IDEALS, rng) ?? '',
        bonds: pickOne(BONDS, rng) ?? '',
        flaws: pickOne(FLAWS, rng) ?? '',
        backgroundNotes: ctx.template.role,
    }
}

/** Work out what the GM should know about this NPC. */
function warningsFor(character: Character, ctx: NpcContext, requested: NpcSpec | null): string[] {
    const warnings: string[] = []
    const element = NATION_ELEMENT[character.nation]
    const weights = ctx.template.bendingWeights
    const hasBenderClass = ctx.content.classes.some((item) => item.element === element)
    if (!hasBenderClass && (weights[element] ?? 0) > 0) {
        warnings.push(`${element}bending classes are not in the app yet, so this ${character.nation} NPC is a non-bender.`)
    }
    if (requested?.nation && character.nation !== requested.nation) {
        warnings.push('That class bends an element the chosen nation does not, so the nation was changed to match.')
    }
    return warnings
}

const rebuild = (character: Character, ctx: NpcContext, rng: Rng): Character =>
    normalizeCharacter(character, ctx.content)

/** Quick-create: a complete NPC from a template and an optional nation, class and level. */
export function generateNpc(spec: NpcSpec, ctx: NpcContext, rng: Rng = Math.random): NpcResult {
    const level = clampLevel(spec.level)
    const requested = spec.classId ? ctx.content.classes.find((item) => item.id === spec.classId) ?? null : null

    // A bender class fixes the nation's element, so the class wins over a conflicting nation.
    const nation: Nation =
        requested?.element && spec.nation && !classFits(requested, spec.nation)
            ? (nations.find((item) => NATION_ELEMENT[item] === requested.element) as Nation)
            : spec.nation ?? (requested?.element ? (nations.find((item) => NATION_ELEMENT[item] === requested.element) as Nation) : pickNation(ctx, rng))

    let character: Character = { ...createBlankCharacter('NPC'), level, name: generateName(nation, rng) }
    character = withLineage(character, nation, ctx, rng)
    character = withClass(character, requested ?? pickClass(ctx, nation, rng), ctx, rng)
    character = withAbilities(character, ctx, rng)
    character = withPersona(character, ctx, rng)
    character = rebuild(character, ctx, rng)
    character = learnTechniques(character, ctx.content, rng)
    character = equip(rebuild(character, ctx, rng), ctx.content, combatOf(ctx), rng)

    return { character: rebuild(character, ctx, rng), warnings: warningsFor(character, ctx, spec) }
}

/**
 * Reroll one part. Parts that depend on it are redone only when they must be:
 * a new nation keeps the class unless it no longer fits; a new class redoes abilities,
 * techniques and gear; nothing else disturbs the rest of the NPC.
 */
export function rerollPart(character: Character, part: NpcPart, ctx: NpcContext, rng: Rng = Math.random): NpcResult {
    let next = character
    const currentClass = ctx.content.classes.find((item) => item.id === character.classId) ?? null
    const redoFromClass = (base: Character, characterClass: CharacterClass | null) => {
        let result = withClass(base, characterClass, ctx, rng)
        result = rebuild(withAbilities(result, ctx, rng), ctx, rng)
        result = learnTechniques(result, ctx.content, rng)
        return equip(rebuild(result, ctx, rng), ctx.content, combatOf(ctx), rng)
    }

    if (part === 'name') next = { ...next, name: generateName(next.nation, rng) }
    else if (part === 'nation') {
        next = withLineage(next, pickNation(ctx, rng, next.nation), ctx, rng)
        next = rebuild(next, ctx, rng)
        next = currentClass && classFits(currentClass, next.nation)
            ? equip(next, ctx.content, combatOf(ctx), rng)
            : redoFromClass(next, pickClass(ctx, next.nation, rng))
    } else if (part === 'class') next = redoFromClass(next, pickClass(ctx, next.nation, rng, next.classId))
    else if (part === 'abilities') next = withAbilities(next, ctx, rng)
    else if (part === 'techniques') next = learnTechniques(rebuild(next, ctx, rng), ctx.content, rng)
    else if (part === 'gear') next = equip(rebuild(next, ctx, rng), ctx.content, combatOf(ctx), rng)
    else next = withPersona(next, ctx, rng)

    return { character: rebuild(next, ctx, rng), warnings: warningsFor(next, ctx, null) }
}
