import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runAs, selectRows, signUp, startDb } from '../campaign/pgHarness'

const ALICE = '00000000-0000-0000-0000-00000000000a'
const BOB = '00000000-0000-0000-0000-00000000000b'

let db: PGlite

beforeAll(async () => {
    db = await startDb()
    await signUp(db, ALICE, 'alice@example.com', 'Alice')
    await signUp(db, BOB, 'bob@example.com', 'Bob')
}, 60_000)

afterAll(async () => {
    await db.close()
})

const save = (userId: string, rows: unknown[]) =>
    runAs(db, userId, () => db.query('select public.save_synced_characters($1::jsonb)', [JSON.stringify(rows)]))
const mine = (userId: string) =>
    runAs(db, userId, () =>
        selectRows<{ id: string; kind: string; deleted: boolean; data: { name?: string } | null; ms: string }>(
            db,
            `select id, kind, deleted, data, (extract(epoch from updated_at) * 1000)::bigint::text as ms from user_characters order by kind, id`,
        ),
    )
const row = (id: string, updatedAt: number, name = id, extra: Record<string, unknown> = {}) => ({
    kind: 'character',
    id,
    data: { name },
    updated_at: updatedAt,
    ...extra,
})

describe('saved characters', () => {
    it('stores a character and returns it to its owner', async () => {
        await save(ALICE, [row('c1', 1_000, 'Ling')])
        const rows = await mine(ALICE)
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({ id: 'c1', kind: 'character', deleted: false, data: { name: 'Ling' } })
    })

    it('keeps accounts apart: nobody else can read, change or remove a row', async () => {
        expect(await mine(BOB)).toEqual([])
        await runAs(db, BOB, () => db.query(`update user_characters set data = '{"name":"hacked"}'::jsonb`))
        await runAs(db, BOB, () => db.query(`delete from user_characters`))
        expect((await mine(ALICE))[0].data).toEqual({ name: 'Ling' })
    })

    it('cannot write a row for someone else, even directly', async () => {
        await expect(
            runAs(db, BOB, () =>
                db.query(`insert into user_characters (owner_id, kind, id, data, updated_at) values ($1, 'character', 'x', '{}'::jsonb, now())`, [ALICE]),
            ),
        ).rejects.toThrow(/row-level security/)
    })

    it('signed-out visitors cannot use it at all', async () => {
        await expect(runAs(db, null, () => db.query('select * from user_characters'))).rejects.toThrow()
        await expect(save(null as unknown as string, [row('z', 1)])).rejects.toThrow()
    })

    it('the same character id can belong to two accounts', async () => {
        await save(BOB, [row('c1', 5_000, 'Bob’s copy')])
        expect((await mine(BOB))[0].data).toEqual({ name: 'Bob’s copy' })
        expect((await mine(ALICE))[0].data).toEqual({ name: 'Ling' })
    })

    it('a newer save replaces the stored one, an older one does not', async () => {
        await save(ALICE, [row('c2', 2_000, 'v2')])
        await save(ALICE, [row('c2', 1_000, 'stale v1')])
        expect((await mine(ALICE)).find((r) => r.id === 'c2')?.data).toEqual({ name: 'v2' })
        await save(ALICE, [row('c2', 3_000, 'v3')])
        const c2 = (await mine(ALICE)).find((r) => r.id === 'c2')
        expect(c2?.data).toEqual({ name: 'v3' })
        expect(c2?.ms).toBe('3000')
    })

    it('a deletion is kept as a tombstone with no data, and a stale copy cannot revive it', async () => {
        await save(ALICE, [{ kind: 'character', id: 'c2', deleted: true, updated_at: 4_000 }])
        const tomb = (await mine(ALICE)).find((r) => r.id === 'c2')
        expect(tomb).toMatchObject({ deleted: true, data: null })
        await save(ALICE, [row('c2', 3_500, 'old copy')])
        expect((await mine(ALICE)).find((r) => r.id === 'c2')?.deleted).toBe(true)
    })

    it('holds characters and NPCs side by side under the same id', async () => {
        await save(ALICE, [{ kind: 'npc', id: 'c1', data: { name: 'Guard' }, updated_at: 1_000 }])
        expect((await mine(ALICE)).filter((r) => r.id === 'c1').map((r) => r.kind).sort()).toEqual(['character', 'npc'])
    })

    it('rejects nonsense: unknown kind, live rows without data, oversized batches', async () => {
        await expect(save(ALICE, [{ kind: 'wizard', id: 'q', data: {}, updated_at: 1 }])).rejects.toThrow()
        await expect(save(ALICE, [{ kind: 'character', id: 'q', updated_at: 1 }])).rejects.toThrow()
        await expect(save(ALICE, Array.from({ length: 201 }, (_, i) => row(`b${i}`, 1)))).rejects.toThrow(/at most 200/)
    })

    it('deleting an account removes its saved characters', async () => {
        await db.query(`delete from auth.users where id = $1`, [BOB])
        const left = await selectRows(db, `select 1 from user_characters where owner_id = $1`, [BOB])
        expect(left).toEqual([])
    })
})
