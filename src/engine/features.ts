import type { Character, Feature } from '../types/schema'
import type { RulesContent } from '../lib/normalize'
import { findBoon } from '../data/epicBoons'
import { classEntries, classLevelsOf } from './classLevels'

export interface GrantedFeature {
    feature: Feature
    /** Where it comes from, e.g. "Weaponsmaster 7" or "Earth Kingdom lineage". */
    origin: string
}

/** Every feature the character has right now, with its origin. First origin wins on duplicates. */
export function getGrantedFeatures(
    character: Pick<
        Character,
        'level' | 'classId' | 'subclassId' | 'extraClasses' | 'lineageId' | 'backgroundId' | 'selectedFeatureIds'
    > &
        Partial<Pick<Character, 'epicBoons'>>,
    content: Pick<
        RulesContent,
        'classes' | 'subclasses' | 'lineages' | 'backgrounds' | 'features'
    >,
): GrantedFeature[] {
    const byId = new Map(content.features.map((feature) => [feature.id, feature]))
    const granted = new Map<string, GrantedFeature>()

    /** `available` is the level that counts: a class's own level for its features, the total level otherwise. */
    const add = (featureId: string, origin: string, minLevel = 1, available = character.level) => {
        const feature = byId.get(featureId)
        if (!feature || granted.has(featureId)) return
        if (minLevel > available || feature.levelRequirement > available) return
        granted.set(featureId, { feature, origin })
    }

    // Each class gives its features up to its effective level; each subclass up to the levels put into it.
    for (const { characterClass, level } of classLevelsOf(character, content.classes)) {
        for (const grant of characterClass.featureGrants) {
            add(grant.featureId, `${characterClass.name} ${grant.level}`, grant.level, level)
        }
    }
    for (const entry of classEntries(character)) {
        const subclass = content.subclasses.find((item) => item.id === entry.subclassId && item.classId === entry.classId)
        for (const grant of subclass?.featureGrants ?? []) {
            add(grant.featureId, `${subclass?.name} ${grant.level}`, grant.level, entry.level)
        }
    }

    const lineage = content.lineages.find((item) => item.id === character.lineageId)
    for (const featureId of lineage?.featureIds ?? []) {
        add(featureId, `${lineage?.name} lineage`)
    }

    const background = content.backgrounds.find((item) => item.id === character.backgroundId)
    for (const featureId of background?.featureIds ?? []) {
        add(featureId, `${background?.name} background`)
    }

    for (const pick of character.epicBoons ?? []) {
        if (findBoon(pick.boonId)) add(pick.boonId, 'Epic Boon')
    }

    for (const featureId of character.selectedFeatureIds) {
        add(featureId, 'Chosen')
    }

    return [...granted.values()]
}
