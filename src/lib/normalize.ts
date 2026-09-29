import {
    deriveMigratedLanguages,
    deriveMigratedTools,
    deriveSavingThrowProficiencies,
    deriveSkillProficiencies,
    resolveProficiencyContext,
} from './proficiencies'
import type {
    Background,
    Character,
    CharacterClass,
    CharacterSubclass,
    Feature,
    Lineage,
    Technique,
} from '../types/schema'

export interface RulesContent {
    classes: CharacterClass[]
    subclasses: CharacterSubclass[]
    lineages: Lineage[]
    backgrounds: Background[]
    features: Feature[]
    techniques: Technique[]
}

export interface NormalizeOptions {
    /** Add a migration note when a class or lineage no longer exists (used on load and import). */
    reportRemovals?: boolean
}

function addNote(notes: string[], note: string): void {
    if (!notes.includes(note)) notes.push(note)
}

/**
 * Make a character consistent with the current rules content: drop references that no
 * longer exist and recompute derived proficiency lists. Pure. Returns the same object
 * when nothing changed so callers can skip re-rendering.
 */
export function normalizeCharacter(
    input: Character,
    content: RulesContent,
    options: NormalizeOptions = {},
): Character {
    const next: Character = { ...input }
    const notes = [...input.migrationNotes]

    if (next.lineageId) {
        const lineage = content.lineages.find((item) => item.id === next.lineageId)
        const valid = lineage && (lineage.nation === 'Any' || lineage.nation === next.nation)

        if (!valid) {
            if (!lineage && options.reportRemovals) {
                addNote(notes, `The lineage "${next.lineageId}" no longer exists. Choose a lineage again.`)
            }
            next.lineageId = ''
            next.lineageSavingThrowChoices = []
            next.lineageSkillChoices = []
            next.lineageToolChoices = []
            next.lineageFavoredTerrains = []
        }
    }

    if (next.classId && !content.classes.some((item) => item.id === next.classId)) {
        if (options.reportRemovals) {
            addNote(notes, `The class "${next.classId}" is not part of the rules. Choose a class again.`)
        }
        next.classId = ''
        next.classSkillChoices = []
        next.subclassId = undefined
    }

    if (next.subclassId) {
        const subclass = content.subclasses.find((item) => item.id === next.subclassId)
        if (!subclass || subclass.classId !== next.classId) next.subclassId = undefined
    }

    next.selectedFeatureIds = next.selectedFeatureIds.filter((id) =>
        content.features.some((feature) => feature.id === id),
    )

    const seenTechniques = new Set<string>()
    next.knownTechniques = next.knownTechniques.filter((known) => {
        if (seenTechniques.has(known.techniqueId)) return false
        seenTechniques.add(known.techniqueId)

        const exists = content.techniques.some((technique) => technique.id === known.techniqueId)
        if (!exists && options.reportRemovals) {
            addNote(notes, `The technique "${known.techniqueId}" no longer exists and was removed.`)
        }
        return exists
    })

    const ctx = resolveProficiencyContext(
        next,
        content.classes,
        content.lineages,
        content.backgrounds,
    )
    next.savingThrowProficiencies = deriveSavingThrowProficiencies(next, ctx)
    next.skillProficiencies = deriveSkillProficiencies(next, ctx)
    next.toolProficiencies = deriveMigratedTools(next, ctx)
    next.languages = deriveMigratedLanguages(next, ctx)
    next.migrationNotes = notes

    return JSON.stringify(next) === JSON.stringify(input) ? input : next
}
