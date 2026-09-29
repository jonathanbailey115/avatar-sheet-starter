import { describe, expect, it } from 'vitest'
import { techniques } from '../data'
import { createBlankCharacter } from '../lib/character'
import { realContent } from '../lib/testFixtures'
import { applyCast, describePlan, planCast } from './casting'
import { getResources, remainingOf, remainingSlots } from './resources'

const byId = (id: string) => techniques.find((technique) => technique.id === id)!
const earthbender = (level: number) => ({ ...createBlankCharacter(), classId: 'earthbending', level })
const weaponsmaster = (level: number) => ({ ...createBlankCharacter(), classId: 'weaponsmaster', level })

describe('casting as a bender (technique slots)', () => {
    it('casting at the known level spends one slot of that level', () => {
        const c = earthbender(5) // 4 / 2 / 1
        const resources = getResources(c, realContent)
        const plan = planCast(c, resources, byId('earth-tremors'), 'Trained')!
        expect(plan.kind).toBe('slots')
        expect(describePlan(plan)).toBe('1 Trained')
        expect(remainingSlots(applyCast(c, resources, plan, 'Trained'), resources)).toEqual({ Practiced: 4, Trained: 1, Mastered: 1 })
    })

    it('down-casts with two slots of the level below when the exact slot is gone', () => {
        const c = earthbender(3) // 4 Practiced, 1 Trained
        const resources = getResources(c, realContent)
        const spent = applyCast(c, resources, planCast(c, resources, byId('earth-tremors'), 'Trained')!, 'Trained')
        const plan = planCast(spent, resources, byId('earth-tremors'), 'Trained')
        expect(describePlan(plan)).toBe('2 Practiced')
    })

    it('upcasts a Practiced technique by paying a higher level', () => {
        const c = earthbender(5)
        const resources = getResources(c, realContent)
        expect(describePlan(planCast(c, resources, byId('earth-tremors'), 'Mastered'))).toBe('1 Mastered')
    })

    it('cannot cast without slots', () => {
        const c = earthbender(1) // 3 Practiced only
        const resources = getResources(c, realContent)
        expect(planCast(c, resources, byId('earth-tremors'), 'Trained')).not.toBeNull() // 2 Practiced
        expect(planCast(c, resources, byId('earth-tremors'), 'Mastered')).toBeNull()
        expect(describePlan(null)).toBe('Not enough slots')
    })

    it('Universal techniques use the bender\'s slots too', () => {
        const c = earthbender(2)
        const resources = getResources(c, realContent)
        expect(planCast(c, resources, byId('universal-fear'), 'Practiced')?.kind).toBe('slots')
    })
})

describe('casting as a Weaponsmaster (Universal Technique Slots)', () => {
    it('a Universal technique costs one Universal Technique Slot', () => {
        const c = weaponsmaster(1)
        const resources = getResources(c, realContent)
        const plan = planCast(c, resources, byId('universal-fear'), 'Practiced')!
        expect(plan.kind).toBe('pool')

        const pool = resources.find((r) => r.id.endsWith(':universal-slots'))!
        expect(remainingOf(applyCast(c, resources, plan, 'Practiced'), pool)).toBe(2)
    })

    it('runs out after 3 at level 1', () => {
        let c = weaponsmaster(1)
        const resources = getResources(c, realContent)
        for (let i = 0; i < 3; i += 1) {
            const plan = planCast(c, resources, byId('universal-fear'), 'Practiced')!
            c = applyCast(c, resources, plan, 'Practiced')
        }
        expect(planCast(c, resources, byId('universal-fear'), 'Practiced')).toBeNull()
    })

    it('an Earth technique is not something a Weaponsmaster can cast', () => {
        const c = weaponsmaster(5)
        expect(planCast(c, getResources(c, realContent), byId('earth-tremors'), 'Practiced')).toBeNull()
    })

    it('Fighting techniques need no slots', () => {
        const c = weaponsmaster(1)
        expect(planCast(c, getResources(c, realContent), byId('fighting-archer'), 'Practiced')).toEqual({ kind: 'free' })
    })
})
