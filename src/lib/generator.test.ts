import { describe, expect, it } from 'vitest'
import { generateNpc } from './generator'
import { pickOne, weightedPick } from './random'
import { realContent } from './testFixtures'
import type { NpcTemplate } from '../types/schema'

const content = { lineages: realContent.lineages, classes: realContent.classes }

function seeded(values: number[]) {
    let index = 0
    return () => values[index++ % values.length]
}

describe('weightedPick', () => {
    it('returns null instead of throwing when every weight is 0', () => {
        expect(weightedPick([{ item: 'a', weight: 0 }, { item: 'b', weight: 0 }])).toBeNull()
        expect(weightedPick([])).toBeNull()
    })

    it('ignores zero, negative and NaN weights', () => {
        const entries = [
            { item: 'a', weight: 0 },
            { item: 'b', weight: -3 },
            { item: 'c', weight: Number.NaN },
            { item: 'd', weight: 2 },
        ]
        for (const roll of [0, 0.5, 0.999]) expect(weightedPick(entries, () => roll)).toBe('d')
    })

    it('respects weights at the boundaries', () => {
        const entries = [{ item: 'a', weight: 1 }, { item: 'b', weight: 3 }]
        expect(weightedPick(entries, () => 0)).toBe('a')
        expect(weightedPick(entries, () => 0.24)).toBe('a')
        expect(weightedPick(entries, () => 0.25)).toBe('b')
        expect(weightedPick(entries, () => 0.999)).toBe('b')
    })
})

describe('pickOne', () => {
    it('handles empty lists and rng = 0.9999', () => {
        expect(pickOne([])).toBeNull()
        expect(pickOne(['a', 'b'], () => 0.9999)).toBe('b')
    })
})

describe('generateNpc', () => {
    const empty: NpcTemplate = { role: 'Blank', nationWeights: {}, bendingWeights: {} }

    it('does not crash on a brand-new template with no weights', () => {
        const npc = generateNpc(empty, content)
        expect(npc.role).toBe('NPC')
        expect(npc.nation).toBeTruthy()
    })

    it('uses the template: a Fire Nation-only template only makes Fire Nation NPCs', () => {
        const template: NpcTemplate = {
            role: 'Fire guard',
            nationWeights: { 'Fire Nation': 5 },
            bendingWeights: { 'Non-Bender': 1 },
        }
        for (let i = 0; i < 20; i += 1) {
            expect(generateNpc(template, content).nation).toBe('Fire Nation')
        }
    })

    it('picks a lineage that belongs to the NPC nation', () => {
        const template: NpcTemplate = {
            role: 'Earth',
            nationWeights: { 'Earth Kingdom': 1 },
            bendingWeights: { 'Non-Bender': 1 },
        }
        const npc = generateNpc(template, content)
        expect(npc.lineageId).toBe('earth-kingdom-human')
    })

    it('never gives a bender an element from a different nation', () => {
        const template: NpcTemplate = {
            role: 'Odd',
            nationWeights: { 'Earth Kingdom': 1 },
            bendingWeights: { Fire: 100, Water: 100 },
        }
        // Fire/Water weights cannot apply to an Earth Kingdom NPC, so the result is a non-bender.
        const npc = generateNpc(template, content, seeded([0.1, 0.5, 0.3]))
        const npcClass = content.classes.find((item) => item.id === npc.classId)
        expect(npcClass?.element).toBeUndefined()
    })

    it('gives non-benders a non-bending class', () => {
        const template: NpcTemplate = {
            role: 'Soldier',
            nationWeights: { 'Earth Kingdom': 1 },
            bendingWeights: { 'Non-Bender': 1 },
        }
        expect(generateNpc(template, content).classId).toBe('weaponsmaster')
    })
})
