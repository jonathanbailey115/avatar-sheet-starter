import { planSlotPayment, remainingOf, remainingSlots, spendResource, spendSlotsForCast } from './resources'
import type { ResourceDef, SlotCounts } from './resources'
import type { Character, Technique, TechniqueLevel } from '../types/schema'

/**
 * What it costs to use a technique.
 * - Benders spend technique slots: one slot of the level cast, or two of the level below.
 *   Casting above the level you know is allowed (house rule, docs/RULES_QUESTIONS.md A7).
 * - Weaponsmasters and Tech-Engineers spend one Universal Technique Slot, a separate pool that has
 *   no levels and no down-casting.
 * - Fighting techniques cost nothing here; some spend Combat Expertise Points, tracked on the sheet.
 */
export type CastPlan =
    | { kind: 'free' }
    | { kind: 'slots'; payment: SlotCounts }
    | { kind: 'pool'; resource: ResourceDef }

export function planCast(
    character: Pick<Character, 'resourcesUsed'>,
    resources: ResourceDef[],
    technique: Technique,
    castLevel: TechniqueLevel,
): CastPlan | null {
    if (technique.element === 'Fighting') return { kind: 'free' }

    const hasSlots = resources.some((resource) => resource.kind === 'slot')
    if (hasSlots) {
        const payment = planSlotPayment(remainingSlots(character, resources), castLevel)
        return payment ? { kind: 'slots', payment } : null
    }

    const pool = resources.find((resource) => resource.id.endsWith(':universal-slots'))
    if (pool && technique.element === 'Universal') {
        return remainingOf(character, pool) > 0 ? { kind: 'pool', resource: pool } : null
    }

    return null
}

export function applyCast<T extends Pick<Character, 'resourcesUsed'>>(
    character: T,
    resources: ResourceDef[],
    plan: CastPlan,
    castLevel: TechniqueLevel,
): T {
    if (plan.kind === 'slots') return spendSlotsForCast(character, resources, castLevel)?.character ?? character
    if (plan.kind === 'pool') return spendResource(character, plan.resource)
    return character
}

export function describePlan(plan: CastPlan | null): string {
    if (!plan) return 'Not enough slots'
    if (plan.kind === 'free') return 'No slots'
    if (plan.kind === 'pool') return '1 Universal Technique Slot'
    return (['Practiced', 'Trained', 'Mastered'] as const)
        .filter((level) => plan.payment[level] > 0)
        .map((level) => `${plan.payment[level]} ${level}`)
        .join(' + ')
}
