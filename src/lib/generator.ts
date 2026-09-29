import { NATION_ELEMENT } from '../engine/bending'
import { nations } from '../types/schema'
import type {
    BendingType,
    Character,
    CharacterClass,
    Lineage,
    Nation,
    NpcTemplate,
} from '../types/schema'
import { createBlankCharacter } from './character'
import { pickOne, weightedPick } from './random'
import type { Rng } from './random'

const NAMES = ['Rin', 'Kano', 'Sela', 'Toma', 'Yori', 'Nalin', 'Haru', 'Mei']

export interface GeneratorContent {
    lineages: Lineage[]
    classes: CharacterClass[]
}

function pickNation(template: NpcTemplate, rng: Rng): Nation {
    const picked = weightedPick(
        nations.map((nation) => ({ item: nation, weight: template.nationWeights[nation] ?? 0 })),
        rng,
    )
    // A template with no positive weights is allowed; fall back to an even spread.
    return picked ?? pickOne(nations, rng) ?? 'Earth Kingdom'
}

/**
 * A bender bends only their lineage's element, so only that element and "Non-Bender"
 * are real options. Other element weights on a template cannot apply to this nation.
 */
function pickBending(template: NpcTemplate, nation: Nation, rng: Rng): BendingType {
    const element = NATION_ELEMENT[nation]
    const picked = weightedPick<BendingType>(
        [
            { item: element, weight: template.bendingWeights[element] ?? 0 },
            { item: 'Non-Bender', weight: template.bendingWeights['Non-Bender'] ?? 0 },
        ],
        rng,
    )
    return picked ?? 'Non-Bender'
}

function pickLineage(lineages: Lineage[], nation: Nation, bending: BendingType, rng: Rng) {
    const ofNation = lineages.filter(
        (lineage) => lineage.nation === nation || lineage.nation === 'Any',
    )
    const allowed = ofNation.filter(
        (lineage) =>
            bending === 'Non-Bender' ||
            !lineage.allowedBendingTypes ||
            lineage.allowedBendingTypes.includes(bending),
    )
    return pickOne(allowed, rng)
}

function pickClass(classes: CharacterClass[], bending: BendingType, rng: Rng) {
    const matching = classes.filter((item) =>
        bending === 'Non-Bender' ? !item.element : item.element === bending,
    )
    return pickOne(matching, rng)
}

/** Placeholder NPC. The full stat-block generator arrives with the NPC Studio phase. */
export function generateNpc(
    template: NpcTemplate,
    content: GeneratorContent,
    rng: Rng = Math.random,
): Character {
    const nation = pickNation(template, rng)
    const bending = pickBending(template, nation, rng)
    const lineage = pickLineage(content.lineages, nation, bending, rng)
    const characterClass = pickClass(content.classes, bending, rng)

    return {
        ...createBlankCharacter('NPC'),
        name: pickOne(NAMES, rng) ?? 'NPC',
        nation,
        lineageId: lineage?.id ?? '',
        classId: characterClass?.id ?? '',
        hp: 8 + Math.floor(rng() * 8),
        backgroundNotes: `${template.role} generated from weighted tables.`,
        notes: 'Use this as a draft NPC and expand it in the NPC studio.',
    }
}
