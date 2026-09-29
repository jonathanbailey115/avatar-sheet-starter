import type { Character, Feature } from '../types/schema'
import type { RulesContent } from '../lib/normalize'

export interface GrantedFeature {
    feature: Feature
    /** Where it comes from, e.g. "Weaponsmaster 7" or "Earth Kingdom lineage". */
    origin: string
}

/** Every feature the character has right now, with its origin. First origin wins on duplicates. */
export function getGrantedFeatures(
    character: Pick<
        Character,
        'level' | 'classId' | 'subclassId' | 'lineageId' | 'backgroundId' | 'selectedFeatureIds'
    >,
    content: Pick<
        RulesContent,
        'classes' | 'subclasses' | 'lineages' | 'backgrounds' | 'features'
    >,
): GrantedFeature[] {
    const byId = new Map(content.features.map((feature) => [feature.id, feature]))
    const granted = new Map<string, GrantedFeature>()

    const add = (featureId: string, origin: string, minLevel = 1) => {
        const feature = byId.get(featureId)
        if (!feature || granted.has(featureId)) return
        if (minLevel > character.level || feature.levelRequirement > character.level) return
        granted.set(featureId, { feature, origin })
    }

    const characterClass = content.classes.find((item) => item.id === character.classId)
    for (const grant of characterClass?.featureGrants ?? []) {
        add(grant.featureId, `${characterClass?.name} ${grant.level}`, grant.level)
    }

    const subclass = content.subclasses.find((item) => item.id === character.subclassId)
    for (const grant of subclass?.featureGrants ?? []) {
        add(grant.featureId, `${subclass?.name} ${grant.level}`, grant.level)
    }

    const lineage = content.lineages.find((item) => item.id === character.lineageId)
    for (const featureId of lineage?.featureIds ?? []) {
        add(featureId, `${lineage?.name} lineage`)
    }

    const background = content.backgrounds.find((item) => item.id === character.backgroundId)
    for (const featureId of background?.featureIds ?? []) {
        add(featureId, `${background?.name} background`)
    }

    for (const featureId of character.selectedFeatureIds) {
        add(featureId, 'Chosen')
    }

    return [...granted.values()]
}
