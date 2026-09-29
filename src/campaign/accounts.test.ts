import type { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runAs, selectRows, signUp, startDb } from './pgHarness'

/** Accounts and usernames (supabase/schema.sql), checked on a real Postgres. */

const FRAN = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const GUS = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const HANA = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
const IVY = 'dddddddd-dddd-dddd-dddd-dddddddddddd'

let db: PGlite
const as = <T>(userId: string | null, run: () => Promise<T>) => runAs(db, userId, run)
const rows = <T = Record<string, unknown>>(sql: string, params: unknown[] = []) => selectRows<T>(db, sql, params)

beforeAll(async () => {
    db = await startDb()
    await signUp(db, FRAN, 'fran@example.com', 'Fran_the_Bold')
    await signUp(db, GUS, 'gus@example.com', 'fran_the_bold') // same name, different case
    await signUp(db, HANA, 'hana@example.com', 'x') // too short
})

afterAll(async () => {
    await db.close()
})

describe('usernames at sign-up', () => {
    it('signing up with a username creates the profile', async () => {
        expect(await as(FRAN, () => rows(`select username from profiles`))).toEqual([{ username: 'Fran_the_Bold' }])
    })

    it('a taken username (any capitals) does not block the account, it just leaves no profile', async () => {
        expect(await as(GUS, () => rows(`select username from profiles`))).toEqual([])
    })

    it('an invalid username does not block the account either', async () => {
        expect(await as(HANA, () => rows(`select username from profiles`))).toEqual([])
    })
})

describe('checking and claiming usernames', () => {
    const available = (name: string) =>
        as(null, () => rows<{ username_available: boolean }>(`select username_available('${name}')`)).then((r) => r[0].username_available)

    it('anyone can ask if a name is free, even before signing up', async () => {
        expect(await available('FRAN_THE_BOLD')).toBe(false)
        expect(await available('Somebody Else')).toBe(true)
    })

    it('you can read your own profile and nobody else\'s', async () => {
        expect(await as(GUS, () => rows(`select username from profiles`))).toEqual([])
        expect(await as(FRAN, () => rows(`select username from profiles`))).toHaveLength(1)
        await expect(as(null, () => rows(`select * from profiles`))).rejects.toThrow(/permission denied/)
    })

    it('nobody can write profiles directly', async () => {
        await expect(as(GUS, () => db.query(`insert into profiles (user_id, username) values ('${GUS}', 'Sneaky')`))).rejects.toThrow(/permission denied/)
        await expect(as(FRAN, () => db.query(`update profiles set username = 'Renamed'`))).rejects.toThrow(/permission denied/)
    })

    it('claim_username rejects bad and taken names', async () => {
        await expect(as(GUS, () => rows(`select claim_username('ab')`))).rejects.toThrow(/3-20 characters/)
        await expect(as(GUS, () => rows(`select claim_username('-bad-')`))).rejects.toThrow(/3-20 characters/)
        await expect(as(GUS, () => rows(`select claim_username('FRAN_THE_BOLD')`))).rejects.toThrow(/taken/)
        await expect(as(null, () => rows(`select claim_username('Anon Name')`))).rejects.toThrow(/permission denied/)
    })

    it('claim_username trims and saves a valid name', async () => {
        const result = await as(GUS, () => rows<{ claim_username: string }>(`select claim_username('  Gus the Grey  ')`))
        expect(result[0].claim_username).toBe('Gus the Grey')
    })

    it('you can re-claim your own name with different capitals', async () => {
        await expect(as(FRAN, () => rows(`select claim_username('FRAN_THE_BOLD')`))).resolves.toBeDefined()
        await as(FRAN, () => rows(`select claim_username('Fran_the_Bold')`))
    })
})

describe('names at the table', () => {
    let campaignId: string
    let joinCode: string

    it('your username is what the table sees, whatever name the client sends', async () => {
        const created = await as(FRAN, () =>
            rows<{ out_id: string; out_code: string }>(`select * from create_campaign('Account Game', 'Pretend To Be Someone Else')`),
        )
        campaignId = created[0].out_id
        joinCode = created[0].out_code
        await as(GUS, () => rows(`select join_campaign('${joinCode}', 'The Real Alice')`))

        const names = await as(FRAN, () =>
            rows<{ display_name: string; role: string }>(`select display_name, role from campaign_members order by role`),
        )
        expect(names).toEqual([
            { display_name: 'Fran_the_Bold', role: 'gm' },
            { display_name: 'Gus the Grey', role: 'player' },
        ])
    })

    it('a roll carries the roller\'s real name, not a forged one', async () => {
        await as(GUS, () =>
            db.query(
                `insert into campaign_rolls (campaign_id, user_id, display_name, entry) values ($1, $2, 'Fran_the_Bold', '{"label":"forged name"}')`,
                [campaignId, GUS],
            ),
        )
        const seen = await as(FRAN, () => rows<{ display_name: string }>(`select display_name from campaign_rolls`))
        expect(seen).toEqual([{ display_name: 'Gus the Grey' }])
    })

    it('players cannot rename themselves at the table', async () => {
        await expect(as(GUS, () => db.query(`update campaign_members set display_name = 'Fran_the_Bold'`))).rejects.toThrow(/permission denied/)
    })

    it('changing your username renames you in every campaign', async () => {
        await as(GUS, () => rows(`select claim_username('Gus the Green')`))
        const names = await as(FRAN, () => rows<{ display_name: string }>(`select display_name from campaign_members where role = 'player'`))
        expect(names).toEqual([{ display_name: 'Gus the Green' }])
    })

    it('the account finds its campaigns again on any device: membership follows the account, not the browser', async () => {
        const list = await as(GUS, () => rows<{ name: string }>(`select name from campaigns`))
        expect(list.map((c) => c.name)).toEqual(['Account Game'])
    })

    it('separate accounts are separate members, however they connect', async () => {
        await signUp(db, IVY, 'ivy@example.com', 'Ivy Two')
        await as(IVY, () => rows(`select join_campaign('${joinCode}', 'x')`))
        expect(await as(FRAN, () => rows(`select user_id from campaign_members`))).toHaveLength(3)
    })

    it('claim_gm shows the account name too', async () => {
        const created = await as(FRAN, () => rows<{ out_code: string; out_gm_key: string }>(`select * from create_campaign('Second', '')`))
        const { out_code: secondCode, out_gm_key: key } = created[0]
        await as(GUS, () => rows(`select claim_gm('${secondCode}', '${key}', 'ignored')`))
        const gm = await as(GUS, () =>
            rows<{ display_name: string }>(
                `select m.display_name from campaign_members m join campaigns c on c.id = m.campaign_id where c.name = 'Second' and m.role = 'gm'`,
            ),
        )
        expect(gm).toEqual([{ display_name: 'Gus the Green' }])
    })
})

describe('deleting an account', () => {
    it('removes the profile', async () => {
        await db.query(`delete from auth.users where id = '${IVY}'`)
        expect(await rows(`select 1 from profiles where user_id = '${IVY}'`)).toEqual([])
    })
})
