import { describe, expect, it } from 'vitest'
import { createBlankCharacter } from '../lib/character'
import { realContent } from '../lib/testFixtures'
import type { Feature } from '../types/schema'
import {
    getResources,
    planSlotPayment,
    remainingOf,
    remainingSlots,
    restoreResource,
    spendResource,
    spendSlotsForCast,
} from './resources'

const weaponsmaster = (level: number) => ({
    ...createBlankCharacter(),
    classId: 'weaponsmaster',
    level,
})
const earthbender = (level: number) => ({ ...createBlankCharacter(), classId: 'earthbending', level })

const byName = (character: ReturnType<typeof weaponsmaster>) =>
    Object.fromEntries(getResources(character, realContent).map((def) => [def.name, def]))

describe('Weaponsmaster resources (gmbinder class table)', () => {
    it('1st level: 1 Combat Expertise Point, 3 Universal Technique Slots, no Action Surge', () => {
        const r = byName(weaponsmaster(1))
        expect(r['Combat Expertise Points'].max).toBe(1)
        expect(r['Universal Technique Slots'].max).toBe(3)
        expect(r['Action Surge']).toBeUndefined()
    })

    it('Combat Expertise Points climb 1,2,3,4,5,6,7,8 at 1,3,6,9,12,15,18,20', () => {
        const at = (level: number) => byName(weaponsmaster(level))['Combat Expertise Points'].max
        expect([1, 3, 6, 9, 12, 15, 18, 20].map(at)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    })

    it('Universal Technique Slots are 3, 4, 5, 6, 7 at 1, 5, 9, 13, 17', () => {
        const at = (level: number) => byName(weaponsmaster(level))['Universal Technique Slots'].max
        expect([1, 5, 9, 13, 17].map(at)).toEqual([3, 4, 5, 6, 7])
    })

    it('Action Surge: once from 3rd, twice from 17th, back on a short rest', () => {
        expect(byName(weaponsmaster(3))['Action Surge'].max).toBe(1)
        expect(byName(weaponsmaster(16))['Action Surge'].max).toBe(1)
        expect(byName(weaponsmaster(17))['Action Surge'].max).toBe(2)
        expect(byName(weaponsmaster(3))['Action Surge'].recharge).toBe('Short Rest')
        expect(byName(weaponsmaster(3))['Combat Expertise Points'].recharge).toBe('Long Rest')
    })
})

describe('bender technique slots (gmbinder Benders table)', () => {
    const slots = (level: number) =>
        getResources(earthbender(level), realContent)
            .filter((def) => def.kind === 'slot')
            .map((def) => [def.slotLevel, def.max])

    it('1st level: 3 Practiced only', () => {
        expect(slots(1)).toEqual([['Practiced', 3]])
    })

    it('5th level: 4 Practiced, 2 Trained, 1 Mastered', () => {
        expect(slots(5)).toEqual([['Practiced', 4], ['Trained', 2], ['Mastered', 1]])
    })

    it('20th level: 12 / 8 / 6 (six Mastered, the mastery cap)', () => {
        expect(slots(20)).toEqual([['Practiced', 12], ['Trained', 8], ['Mastered', 6]])
    })

    it('non-benders have no technique slots', () => {
        expect(getResources(weaponsmaster(5), realContent).some((def) => def.kind === 'slot')).toBe(false)
    })
})

describe('limited-use features', () => {
    it('a granted feature with uses becomes a tracked resource', () => {
        const feature: Feature = {
            id: 'custom-trick',
            name: 'Custom Trick',
            description: '',
            source: 'Custom',
            featureType: 'Limited Use',
            levelRequirement: 1,
            isActiveByDefault: true,
            uses: 2,
            recharge: 'Long Rest',
        }
        const content = { ...realContent, features: [...realContent.features, feature] }
        const c = { ...createBlankCharacter(), selectedFeatureIds: ['custom-trick'] }
        const def = getResources(c, content).find((item) => item.id === 'feature:custom-trick')
        expect(def).toMatchObject({ max: 2, kind: 'feature' })
    })
})

describe('spending and restoring', () => {
    const c = weaponsmaster(1)
    const def = getResources(c, realContent).find((item) => item.name === 'Universal Technique Slots')!

    it('spends and restores within 0..max', () => {
        const spent = spendResource(c, def, 2)
        expect(remainingOf(spent, def)).toBe(1)
        expect(remainingOf(spendResource(spent, def, 99), def)).toBe(0)
        expect(remainingOf(restoreResource(spent, def, 99), def)).toBe(3)
    })
})

describe('slot payment (down-casting and the upcasting house rule)', () => {
    const slots = (practiced: number, trained: number, mastered: number) => ({
        Practiced: practiced,
        Trained: trained,
        Mastered: mastered,
    })

    it('pays with a slot of the same level when possible', () => {
        expect(planSlotPayment(slots(3, 2, 1), 'Trained')).toEqual(slots(0, 1, 0))
        expect(planSlotPayment(slots(3, 2, 1), 'Mastered')).toEqual(slots(0, 0, 1))
        expect(planSlotPayment(slots(3, 2, 1), 'Practiced')).toEqual(slots(1, 0, 0))
    })

    it('down-casts: a Trained technique costs 2 Practiced slots', () => {
        expect(planSlotPayment(slots(3, 0, 0), 'Trained')).toEqual(slots(2, 0, 0))
    })

    it('down-casts: a Mastered technique costs 2 Trained slots, or 4 Practiced', () => {
        expect(planSlotPayment(slots(0, 2, 0), 'Mastered')).toEqual(slots(0, 2, 0))
        expect(planSlotPayment(slots(4, 0, 0), 'Mastered')).toEqual(slots(4, 0, 0))
        expect(planSlotPayment(slots(2, 1, 0), 'Mastered')).toEqual(slots(2, 1, 0))
    })

    it('refuses when you cannot afford it', () => {
        expect(planSlotPayment(slots(1, 0, 0), 'Trained')).toBeNull()
        expect(planSlotPayment(slots(3, 0, 0), 'Mastered')).toBeNull()
        expect(planSlotPayment(slots(0, 0, 0), 'Practiced')).toBeNull()
    })

    it('never spends a higher slot than the level being cast', () => {
        expect(planSlotPayment(slots(0, 5, 5), 'Practiced')).toBeNull()
    })

    it('spends the slots on the character', () => {
        const c = earthbender(5) // 4 / 2 / 1
        const resources = getResources(c, realContent)
        const result = spendSlotsForCast(c, resources, 'Trained')!
        expect(remainingSlots(result.character, resources)).toEqual(slots(4, 1, 1))
        expect(spendSlotsForCast(c, resources, 'Mastered')).not.toBeNull()
    })

    it('leaves the character alone when the cast is unaffordable', () => {
        const c = earthbender(1) // 3 Practiced
        expect(spendSlotsForCast(c, getResources(c, realContent), 'Mastered')).toBeNull()
    })
})
