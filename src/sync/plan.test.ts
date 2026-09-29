import { describe, expect, it } from 'vitest'
import { planSync } from './plan'
import type { LocalItem, RemoteItem } from './plan'

const plan = (local: LocalItem[], remote: RemoteItem[], tombstones: Record<string, number> = {}) =>
    planSync({ local, remote, tombstones })
const row = (id: string, updatedAt: number, deleted = false): RemoteItem => ({ id, updatedAt, deleted })

describe('syncing with an account', () => {
    it('does nothing when both sides agree', () => {
        const result = plan([{ id: 'a', modifiedAt: 100 }], [row('a', 100)])
        expect(result).toEqual({ download: [], removeLocal: [], upload: [], uploadDeletes: [], forgetTombstones: [] })
    })

    it('a new device gets everything the account has', () => {
        expect(plan([], [row('a', 5), row('b', 6)]).download).toEqual(['a', 'b'])
    })

    it('never downloads something the account marks deleted', () => {
        expect(plan([], [row('a', 5, true)]).download).toEqual([])
    })

    it('the newer side wins: an edit here goes up, an edit elsewhere comes down', () => {
        expect(plan([{ id: 'a', modifiedAt: 200 }], [row('a', 100)]).upload).toEqual(['a'])
        expect(plan([{ id: 'a', modifiedAt: 100 }], [row('a', 200)]).download).toEqual(['a'])
    })

    it('a character made here that the account has never seen is uploaded', () => {
        expect(plan([{ id: 'new', modifiedAt: 50 }], []).upload).toEqual(['new'])
    })

    it('characters on this device that are not in the account are left alone', () => {
        const result = plan([{ id: 'mine-only', modifiedAt: null }], [])
        expect(result.upload).toEqual([])
        expect(result.removeLocal).toEqual([])
    })

    it('a deletion elsewhere removes the local copy only if it is newer than our last change', () => {
        expect(plan([{ id: 'a', modifiedAt: 100 }], [row('a', 200, true)]).removeLocal).toEqual(['a'])
        // We changed it after the other device deleted it: our edit is kept and sent up.
        const kept = plan([{ id: 'a', modifiedAt: 300 }], [row('a', 200, true)])
        expect(kept.removeLocal).toEqual([])
        expect(kept.upload).toEqual(['a'])
    })

    it('a deletion made here is sent to the account instead of the item coming back', () => {
        const result = plan([], [row('a', 100)], { a: 150 })
        expect(result.download).toEqual([])
        expect(result.uploadDeletes).toEqual([{ id: 'a', deletedAt: 150 }])
    })

    it('something edited elsewhere after we deleted it here comes back', () => {
        const result = plan([], [row('a', 300)], { a: 150 })
        expect(result.download).toEqual(['a'])
        expect(result.forgetTombstones).toEqual(['a'])
    })

    it('forgets a tombstone once the account also records the deletion', () => {
        expect(plan([], [row('a', 100, true)], { a: 150 }).forgetTombstones).toEqual(['a'])
    })

    it('forgets a tombstone for something the account never had', () => {
        expect(plan([], [], { ghost: 10 }).forgetTombstones).toEqual(['ghost'])
    })

    it('an unowned local copy of something the account has is replaced by the account copy', () => {
        expect(plan([{ id: 'a', modifiedAt: null }], [row('a', 100)]).download).toEqual(['a'])
    })

    it('handles a mix in one pass', () => {
        const result = plan(
            [
                { id: 'same', modifiedAt: 10 },
                { id: 'edited-here', modifiedAt: 90 },
                { id: 'edited-there', modifiedAt: 10 },
                { id: 'brand-new', modifiedAt: 5 },
            ],
            [row('same', 10), row('edited-here', 20), row('edited-there', 80), row('only-there', 1)],
            { 'was-deleted': 40 },
        )
        expect(result.upload.sort()).toEqual(['brand-new', 'edited-here'])
        expect(result.download.sort()).toEqual(['edited-there', 'only-there'])
        expect(result.forgetTombstones).toEqual(['was-deleted'])
    })
})
