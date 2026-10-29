import { bendingClassOf, classEntries, classLevelsOf } from './classLevels'
import { getGrantedFeatures } from './features'
import type { RulesContent } from '../lib/normalize'
import type { Character, Recharge, TechniqueLevel } from '../types/schema'
import { TECHNIQUE_LEVELS } from '../types/schema'

/**
 * Tracked resources: technique slots, class pools, and limited-use features.
 * Each has a stable id; spent uses are stored on the character as `resourcesUsed[id]`.
 */

export type ResourceKind = 'slot' | 'pool' | 'feature'

export interface ResourceDef {
    id: string
    name: string
    kind: ResourceKind
    max: number
    /** "Short Rest" refreshes on a short OR long rest; "Long Rest" on a long rest only. */
    recharge: Recharge
    origin: string
    description?: string
    slotLevel?: TechniqueLevel
}

export type SlotCounts = Record<TechniqueLevel, number>

export const slotResourceId = (level: TechniqueLevel) => `slots:${level}`

/** Practiced-slot value of one slot: 1 Trained = 2 Practiced, 1 Mastered = 2 Trained = 4 Practiced. */
const SLOT_VALUE: SlotCounts = { Practiced: 1, Trained: 2, Mastered: 4 }
const LEVEL_ORDER: TechniqueLevel[] = ['Mastered', 'Trained', 'Practiced']

export function getResources(
    character: Pick<Character, 'level' | 'classId' | 'subclassId' | 'extraClasses' | 'lineageId' | 'backgroundId' | 'selectedFeatureIds'>,
    content: Pick<RulesContent, 'classes' | 'subclasses' | 'lineages' | 'backgrounds' | 'features'>,
    granted = getGrantedFeatures(character, content),
): ResourceDef[] {
    const resources: ResourceDef[] = []
    const classLevels = classLevelsOf(character, content.classes)
    // Technique slots come from the one bending class; every class's own pools come from its own level.
    const bending = bendingClassOf(classLevels)
    const characterClass = bending?.characterClass
    const slotRow = characterClass?.techniqueSlots?.[Math.min(20, Math.max(1, bending?.level ?? 1)) - 1]
    const counts: SlotCounts = {
        Practiced: slotRow?.practiced ?? 0,
        Trained: slotRow?.trained ?? 0,
        Mastered: slotRow?.mastered ?? 0,
    }
    const origins: string[] = slotRow && characterClass ? [characterClass.name] : []
    // A subclass can add slots of its own (Dragon Mage), added to the bending class's.
    for (const entry of classEntries(character)) {
        const subclass = content.subclasses.find((item) => item.id === entry.subclassId && item.classId === entry.classId)
        const row = subclass?.techniqueSlots?.[Math.min(20, Math.max(1, entry.level)) - 1]
        if (!subclass || !row) continue
        counts.Practiced += row.practiced
        counts.Trained += row.trained
        counts.Mastered += row.mastered
        if (row.practiced + row.trained + row.mastered > 0) origins.push(subclass.name)
    }
    {
        for (const level of TECHNIQUE_LEVELS) {
            if (counts[level] > 0) {
                resources.push({
                    id: slotResourceId(level),
                    name: `${level} technique slots`,
                    kind: 'slot',
                    max: counts[level],
                    recharge: 'Long Rest',
                    origin: origins.join(' + '),
                    slotLevel: level,
                })
            }
        }
    }

    for (const { characterClass: owner, level } of classLevels) {
        for (const pool of owner.resources ?? []) {
            const max = pool.maxByLevel[Math.min(20, Math.max(1, level)) - 1] ?? 0
            if (max > 0) {
                resources.push({
                    id: `${owner.id}:${pool.id}`,
                    name: pool.name,
                    kind: 'pool',
                    max,
                    recharge: pool.recharge,
                    origin: owner.name,
                    description: pool.description,
                })
            }
        }
    }

    for (const { feature, origin } of granted) {
        if (feature.uses && feature.uses > 0 && feature.recharge) {
            resources.push({
                id: `feature:${feature.id}`,
                name: feature.name,
                kind: 'feature',
                max: feature.uses,
                recharge: feature.recharge,
                origin,
                description: feature.description,
            })
        }
    }

    return resources
}

export function usedOf(character: Pick<Character, 'resourcesUsed'>, def: ResourceDef): number {
    return Math.min(def.max, Math.max(0, character.resourcesUsed[def.id] ?? 0))
}

export function remainingOf(character: Pick<Character, 'resourcesUsed'>, def: ResourceDef): number {
    return def.max - usedOf(character, def)
}

export function spendResource<T extends Pick<Character, 'resourcesUsed'>>(
    character: T,
    def: ResourceDef,
    amount = 1,
): T {
    const used = Math.min(def.max, usedOf(character, def) + Math.max(0, amount))
    return { ...character, resourcesUsed: { ...character.resourcesUsed, [def.id]: used } }
}

export function restoreResource<T extends Pick<Character, 'resourcesUsed'>>(
    character: T,
    def: ResourceDef,
    amount = 1,
): T {
    const used = Math.max(0, usedOf(character, def) - Math.max(0, amount))
    return { ...character, resourcesUsed: { ...character.resourcesUsed, [def.id]: used } }
}

export function remainingSlots(
    character: Pick<Character, 'resourcesUsed'>,
    resources: ResourceDef[],
): SlotCounts {
    const counts: SlotCounts = { Practiced: 0, Trained: 0, Mastered: 0 }
    for (const def of resources) {
        if (def.kind === 'slot' && def.slotLevel) counts[def.slotLevel] = remainingOf(character, def)
    }
    return counts
}

/**
 * Work out which slots pay for casting at `castLevel`. Returns how many slots of each level
 * to spend, or null if you cannot afford it.
 *
 * gmbinder: spend one slot of the technique's level, or two slots of the level below
 * (a Mastered technique can be paid with 4 Practiced slots). House rule (upcasting): a
 * technique you know at a lower level can be cast at a higher level by paying that level.
 * Slots above `castLevel` are never used.
 */
export function planSlotPayment(available: SlotCounts, castLevel: TechniqueLevel): SlotCounts | null {
    let remaining = SLOT_VALUE[castLevel]
    const spend: SlotCounts = { Practiced: 0, Trained: 0, Mastered: 0 }

    for (const level of LEVEL_ORDER) {
        if (SLOT_VALUE[level] > SLOT_VALUE[castLevel]) continue
        const count = Math.min(available[level], Math.floor(remaining / SLOT_VALUE[level]))
        spend[level] = count
        remaining -= count * SLOT_VALUE[level]
    }

    return remaining === 0 ? spend : null
}

export function spendSlotsForCast<T extends Pick<Character, 'resourcesUsed'>>(
    character: T,
    resources: ResourceDef[],
    castLevel: TechniqueLevel,
): { character: T; payment: SlotCounts } | null {
    const payment = planSlotPayment(remainingSlots(character, resources), castLevel)
    if (!payment) return null

    let next = character
    for (const def of resources) {
        if (def.kind === 'slot' && def.slotLevel && payment[def.slotLevel] > 0) {
            next = spendResource(next, def, payment[def.slotLevel])
        }
    }
    return { character: next, payment }
}
