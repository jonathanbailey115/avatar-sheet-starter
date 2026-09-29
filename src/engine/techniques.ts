import type {
    AbilityName,
    Character,
    CharacterClass,
    Element,
    Technique,
    TechniqueDamage,
    TechniqueElement,
    TechniqueLevel,
} from '../types/schema'
import { TECHNIQUE_LEVELS } from '../types/schema'

/** The save a benders' own element uses (Elemental Affinity Saving Throw, gmbinder). */
export const ELEMENT_ABILITY: Record<Element, AbilityName> = {
    Water: 'charisma',
    Earth: 'constitution',
    Fire: 'strength',
    Air: 'wisdom',
}

/** Levels above Practiced: Practiced 0, Trained 1, Mastered 2. */
export const levelSteps = (level: TechniqueLevel): number => TECHNIQUE_LEVELS.indexOf(level)

/** Levels a technique known at `known` can be cast at: its own level or higher (upcasting house rule). */
export function castLevels(known: TechniqueLevel): TechniqueLevel[] {
    return TECHNIQUE_LEVELS.slice(levelSteps(known))
}

const DICE = /^(\d+)d(\d+)$/

/** Add "1d8" to "3d8" -> "4d8". Different die sizes are joined with "+". */
export function addDice(total: string, extra: string, times: number): string {
    let result = total
    for (let i = 0; i < times; i += 1) {
        const a = DICE.exec(result)
        const b = DICE.exec(extra)
        if (a && b && a[2] === b[2]) result = `${Number(a[1]) + Number(b[1])}d${a[2]}`
        else result = result ? `${result}+${extra}` : extra
    }
    return result
}

/** Dice this damage entry deals when cast at `level`, or null if it does not apply at that level. */
export function damageDiceAt(damage: TechniqueDamage, level: TechniqueLevel): string | null {
    if (damage.byLevel) return damage.byLevel[level] ?? null
    if (!damage.base) return null
    return damage.perLevel ? addDice(damage.base, damage.perLevel, levelSteps(level)) : damage.base
}

export interface DamageOption {
    label: string
    /** Full roll text, e.g. "5d8+2". */
    formula: string
    type: string
    onSave: TechniqueDamage['onSave']
}

export function damageOptions(
    technique: Technique,
    level: TechniqueLevel,
    bendingModifier: number,
): DamageOption[] {
    return (technique.damage ?? []).flatMap((damage) => {
        const dice = damageDiceAt(damage, level)
        if (!dice) return []
        const flat = damage.addModifier ? bendingModifier : 0
        const formula = flat === 0 ? dice : `${dice}${flat > 0 ? '+' : '-'}${Math.abs(flat)}`
        return [{ label: damage.label ?? 'Damage', formula, type: damage.type, onSave: damage.onSave }]
    })
}

const ABILITY_NAME = (ability: AbilityName) => ability[0].toUpperCase() + ability.slice(1)

/** Plain-language save line, e.g. "Constitution (earthbenders), Strength (others)". */
export function saveSummary(technique: Technique): string | null {
    const save = technique.save
    if (!save) return null
    if (save.ability !== 'affinity') return ABILITY_NAME(save.ability)

    const own = technique.element in ELEMENT_ABILITY ? ELEMENT_ABILITY[technique.element as Element] : null
    const first = own ? `${ABILITY_NAME(own)} (${technique.element.toLowerCase()}benders)` : 'Own element'
    return save.fallback
        ? `${first}, ${ABILITY_NAME(save.fallback)} (others)`
        : `${first}; others roll their own element's save (GM decides)`
}

/** The rules text to show at a level (Fighting techniques have separate text per level). */
export function textAtLevel(technique: Technique, level: TechniqueLevel): string {
    return technique.levelText?.[level] || technique.description
}

export interface Prerequisite {
    techniqueId: string
    minLevel: TechniqueLevel
}

/** "Trained Tremors" -> Tremors at Trained or better; "Air Shield" -> any level. */
export function parsePrerequisite(technique: Technique, all: Technique[]): Prerequisite | null {
    if (!technique.prerequisite) return null
    const match = /^(Practiced|Trained|Mastered)?\s*(.+)$/i.exec(technique.prerequisite.trim())
    if (!match) return null

    const name = match[2].trim().toLowerCase()
    const target = all.find((item) => item.name.toLowerCase() === name)
    if (!target) return null

    const level = TECHNIQUE_LEVELS.find((item) => item.toLowerCase() === match[1]?.toLowerCase())
    return { techniqueId: target.id, minLevel: level ?? 'Practiced' }
}

/** Why a technique cannot be learned right now, or null if it can. */
export function learnBlocker(
    character: Pick<Character, 'level' | 'knownTechniques'>,
    technique: Technique,
    characterClass: CharacterClass | undefined,
    all: Technique[],
): string | null {
    if (character.knownTechniques.some((known) => known.techniqueId === technique.id)) return 'Already known'

    if (technique.rare && character.level < 8) return 'Rare techniques unlock at level 8'

    const prerequisite = parsePrerequisite(technique, all)
    if (prerequisite) {
        const owned = character.knownTechniques.find((known) => known.techniqueId === prerequisite.techniqueId)
        const enough = owned && levelSteps(owned.level) >= levelSteps(prerequisite.minLevel)
        if (!enough) {
            const name = all.find((item) => item.id === prerequisite.techniqueId)?.name
            return `Requires ${prerequisite.minLevel === 'Practiced' ? '' : `${prerequisite.minLevel} `}${name}`
        }
    }

    const status = limitStatus(character, characterClass, all).find((entry) =>
        entry.limit.kinds.includes(technique.element),
    )
    if (status && status.used >= status.max) return `${status.limit.label} full (${status.used}/${status.max})`

    return null
}

export interface LimitStatus {
    limit: NonNullable<CharacterClass['techniqueLimits']>[number]
    used: number
    max: number
}

/** How many techniques of each counted kind the character knows versus the class allows. */
export function limitStatus(
    character: Pick<Character, 'level' | 'knownTechniques'>,
    characterClass: CharacterClass | undefined,
    all: Technique[],
): LimitStatus[] {
    const levelIndex = Math.min(20, Math.max(1, character.level)) - 1
    const kindOf = (techniqueId: string): TechniqueElement | undefined =>
        all.find((technique) => technique.id === techniqueId)?.element

    return (characterClass?.techniqueLimits ?? []).map((limit) => ({
        limit,
        max: limit.maxByLevel[levelIndex] ?? 0,
        used: character.knownTechniques.filter((known) => {
            const kind = kindOf(known.techniqueId)
            return kind !== undefined && limit.kinds.includes(kind)
        }).length,
    }))
}
