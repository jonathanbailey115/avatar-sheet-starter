import { describe, expect, it } from 'vitest'
import { applyEdits, diffEdits, emptyEdits } from './contentEdits'

interface Item {
    id: string
    name: string
}

const keyOf = (item: Item) => item.id
const seed: Item[] = [
    { id: 'a', name: 'Alpha' },
    { id: 'b', name: 'Beta' },
]

describe('content edits layer', () => {
    it('with no edits, content is the seed', () => {
        expect(applyEdits(seed, emptyEdits(), keyOf)).toEqual(seed)
    })

    it('an unchanged list produces no edits', () => {
        expect(diffEdits(seed, structuredClone(seed), keyOf)).toEqual(emptyEdits())
    })

    it('round-trips an edit, a deletion and an addition', () => {
        const next: Item[] = [{ id: 'a', name: 'Alpha (edited)' }, { id: 'c', name: 'Gamma' }]
        const edits = diffEdits(seed, next, keyOf)

        expect(edits.removed).toEqual(['b'])
        expect(edits.upserts.map(keyOf).sort()).toEqual(['a', 'c'])
        expect(applyEdits(seed, edits, keyOf)).toEqual(next)
    })

    it('app updates to the seed still reach users who have edits', () => {
        const edits = diffEdits(seed, [{ id: 'a', name: 'Mine' }, seed[1]], keyOf)
        const newSeed: Item[] = [...seed, { id: 'd', name: 'New rule content' }]

        const result = applyEdits(newSeed, edits, keyOf)
        expect(result.find((item) => item.id === 'a')?.name).toBe('Mine')
        expect(result.find((item) => item.id === 'd')?.name).toBe('New rule content')
    })

    it('a deleted item stays deleted after a seed update', () => {
        const edits = diffEdits(seed, [seed[0]], keyOf)
        expect(applyEdits([...seed, { id: 'z', name: 'Z' }], edits, keyOf).map(keyOf)).toEqual(['a', 'z'])
    })
})
