import { describe, expect, it } from 'vitest'
import { backgrounds, characterClasses, characterSubclasses, features, lineages, techniques } from './index'
import { techniqueMechanics } from './techniques'

describe('built-in content is self-consistent', () => {
    const featureIds = new Set(features.map((feature) => feature.id))

    it('ids are unique everywhere', () => {
        for (const [name, list] of Object.entries({ features, techniques, characterClasses, characterSubclasses, lineages, backgrounds })) {
            const ids = list.map((item) => item.id)
            expect(new Set(ids).size, name).toBe(ids.length)
        }
    })

    it('every feature a class, subclass or lineage grants exists', () => {
        for (const c of characterClasses) for (const g of c.featureGrants) expect(featureIds.has(g.featureId), `${c.id}:${g.featureId}`).toBe(true)
        for (const s of characterSubclasses) for (const g of s.featureGrants) expect(featureIds.has(g.featureId), `${s.id}:${g.featureId}`).toBe(true)
        for (const l of lineages) for (const id of l.featureIds ?? []) expect(featureIds.has(id), `${l.id}:${id}`).toBe(true)
    })

    it('every subclass belongs to a real class', () => {
        for (const s of characterSubclasses) expect(characterClasses.some((c) => c.id === s.classId), s.id).toBe(true)
    })

    it('class feature grants are in level order and within 1-20', () => {
        for (const c of characterClasses) {
            const levels = c.featureGrants.map((g) => g.level)
            expect(levels, c.id).toEqual([...levels].sort((a, b) => a - b))
            for (const level of levels) {
                expect(level).toBeGreaterThanOrEqual(1)
                expect(level).toBeLessThanOrEqual(20)
            }
        }
    })

    it('every hand-authored mechanic points at a real technique', () => {
        const ids = new Set(techniques.map((t) => t.id))
        for (const id of Object.keys(techniqueMechanics)) expect(ids.has(id), id).toBe(true)
    })

    it('technique counts match the extracted gmbinder sections', () => {
        const count = (element: string) => techniques.filter((t) => t.element === element).length
        expect({ universal: count('Universal'), earth: count('Earth'), fighting: count('Fighting') }).toEqual({
            universal: 8,
            earth: 37,
            fighting: 19,
        })
    })

    it('every technique has text; every spell-like one has a casting time', () => {
        for (const t of techniques) {
            expect(t.description.length, t.id).toBeGreaterThan(10)
            if (t.element !== 'Fighting') expect(t.castingTime, t.id).toBeTruthy()
        }
    })

    it('every Fighting technique has text for all three levels', () => {
        for (const t of techniques.filter((item) => item.element === 'Fighting')) {
            for (const level of ['Practiced', 'Trained', 'Mastered'] as const) {
                expect(t.levelText?.[level]?.length ?? 0, `${t.id} ${level}`).toBeGreaterThan(10)
            }
        }
    })

    it('rare Earth techniques are flagged (14 of 37)', () => {
        expect(techniques.filter((t) => t.element === 'Earth' && t.rare)).toHaveLength(14)
    })

    it('Earthbending gets its class features at the gmbinder levels', () => {
        const earth = characterClasses.find((c) => c.id === 'earthbending')!
        const level = (id: string) => earth.featureGrants.find((g) => g.featureId === id)?.level
        expect(level('class-earthbending-grounded')).toBe(1)
        expect(level('class-earthbending-neutral-jing')).toBe(5)
        expect(level('class-earthbending-rare-techniques')).toBe(8)
        expect(level('class-earthbending-resilient')).toBe(11)
        // Ability Score Improvement follows the Benders table: 4, 9, 12, 16, 19
        expect(level('class-earthbending-ability-score-improvement')).toBe(4)
    })
})
