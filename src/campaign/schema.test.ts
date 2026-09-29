import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import schemaSql from '../../supabase/schema.sql?raw'

/**
 * Runs supabase/schema.sql on a real Postgres (PGlite, in process) and checks the security rules.
 * Supabase provides the `authenticated`/`anon` roles and auth.uid(); we emulate those here.
 */

const PRELUDE = `
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema public, auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    -- Supabase grants everything on new public tables by default; reproduce that.
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on functions to anon, authenticated;
`

const ALICE = '11111111-1111-1111-1111-111111111111' // GM
const BOB = '22222222-2222-2222-2222-222222222222'
const CARA = '33333333-3333-3333-3333-333333333333'
const EVE = '99999999-9999-9999-9999-999999999999' // not in the campaign

let db: PGlite
let campaignId: string
let code: string
let gmKey: string

/** Run something as a signed-in user, the way PostgREST does: role authenticated + JWT subject. */
async function as<T>(userId: string | null, run: () => Promise<T>): Promise<T> {
    await db.exec(`select set_config('request.jwt.claim.sub', '${userId ?? ''}', false); set role ${userId ? 'authenticated' : 'anon'};`)
    try {
        return await run()
    } finally {
        await db.exec('reset role')
    }
}

async function rows<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await db.query<T>(sql, params)).rows
}

const roll = (label = 'Athletics check') => JSON.stringify({ label, total: 14 })

beforeAll(async () => {
    db = new PGlite()
    await db.exec(PRELUDE)
    await db.exec(schemaSql)

    const created = await as(ALICE, () =>
        rows<{ out_id: string; out_code: string; out_gm_key: string }>(`select * from create_campaign('The Siege', 'Alice')`),
    )
    campaignId = created[0].out_id
    code = created[0].out_code
    gmKey = created[0].out_gm_key

    await as(BOB, () => rows(`select join_campaign('${code}', 'Bob')`))
    await as(CARA, () => rows(`select join_campaign('${code}', 'Cara')`))
})

afterAll(async () => {
    await db.close()
})

describe('schema.sql can be run twice', () => {
    it('is idempotent', async () => {
        await expect(db.exec(schemaSql)).resolves.toBeDefined()
    })
})

describe('creating and joining', () => {
    it('gives a code of 8 letters/digits and a GM key', () => {
        expect(code).toMatch(/^[0-9A-F]{8}$/)
        expect(gmKey).toMatch(/^[0-9a-f]{32}$/)
    })

    it('makes the creator the GM and members of the others players', async () => {
        const members = await as(ALICE, () => rows(`select display_name, role from campaign_members order by display_name`))
        expect(members).toEqual([
            { display_name: 'Alice', role: 'gm' },
            { display_name: 'Bob', role: 'player' },
            { display_name: 'Cara', role: 'player' },
        ])
    })

    it('joining is case, space and dash insensitive', async () => {
        const messy = `${code.slice(0, 4).toLowerCase()} - ${code.slice(4).toLowerCase()}`
        const id = await as('44444444-4444-4444-4444-444444444444', () => rows<{ join_campaign: string }>(`select join_campaign('${messy}', 'Dan')`))
        expect(id[0].join_campaign).toBe(campaignId)
    })

    it('rejects a wrong code', async () => {
        await expect(as(EVE, () => rows(`select join_campaign('00000000', 'Eve')`))).rejects.toThrow(/No campaign with that code/)
    })

    it('rejects an empty name', async () => {
        await expect(as(EVE, () => rows(`select join_campaign('${code}', '  ')`))).rejects.toThrow(/display name/)
        await expect(as(EVE, () => rows(`select * from create_campaign('', 'Eve')`))).rejects.toThrow(/needs a name/)
    })

    it('needs a signed-in user', async () => {
        await expect(as(null, () => rows(`select * from create_campaign('X', 'Anon')`))).rejects.toThrow()
    })

    it('rejoining updates your name and keeps your role', async () => {
        await as(ALICE, () => rows(`select join_campaign('${code}', 'Alice the GM')`))
        const me = await as(ALICE, () => rows(`select display_name, role from campaign_members where user_id = '${ALICE}'`))
        expect(me).toEqual([{ display_name: 'Alice the GM', role: 'gm' }])
        await as(ALICE, () => rows(`select join_campaign('${code}', 'Alice')`))
    })
})

describe('who can read what', () => {
    it('a stranger sees no campaigns, members, rolls or status', async () => {
        await as(BOB, () => db.query(`insert into campaign_rolls (campaign_id, user_id, display_name, entry) values ($1, $2, 'Bob', $3)`, [campaignId, BOB, roll()]))
        for (const table of ['campaigns', 'campaign_members', 'campaign_rolls', 'member_status']) {
            const seen = await as(EVE, () => rows(`select * from ${table}`).catch(() => [] as unknown[]))
            expect(seen, table).toEqual([])
        }
    })

    it('members can list campaigns they belong to', async () => {
        const seen = await as(BOB, () => rows(`select id, name from campaigns`))
        expect(seen).toEqual([{ id: campaignId, name: 'The Siege' }])
    })

    it('nobody can read the GM key hash', async () => {
        await expect(as(ALICE, () => rows(`select gm_key_hash from campaigns`))).rejects.toThrow(/permission denied/)
        await expect(as(ALICE, () => rows(`select * from campaigns`))).rejects.toThrow(/permission denied/)
    })

    it('anonymous (not signed in) users see nothing at all', async () => {
        await expect(as(null, () => rows(`select id from campaigns`))).rejects.toThrow(/permission denied/)
    })
})

describe('rolls', () => {
    it('members see each other\'s public rolls', async () => {
        const seen = await as(CARA, () => rows<{ display_name: string }>(`select display_name from campaign_rolls`))
        expect(seen.map((r) => r.display_name)).toContain('Bob')
    })

    it('you can only roll as yourself', async () => {
        await expect(
            as(BOB, () => db.query(`insert into campaign_rolls (campaign_id, user_id, display_name, entry) values ($1, $2, 'Cara', $3)`, [campaignId, CARA, roll('forged')])),
        ).rejects.toThrow(/row-level security/)
    })

    it('a stranger cannot roll into a campaign', async () => {
        await expect(
            as(EVE, () => db.query(`insert into campaign_rolls (campaign_id, user_id, display_name, entry) values ($1, $2, 'Eve', $3)`, [campaignId, EVE, roll('sneak')])),
        ).rejects.toThrow(/row-level security/)
    })

    it('private rolls are visible to the roller and the GM only', async () => {
        await as(BOB, () =>
            db.query(`insert into campaign_rolls (campaign_id, user_id, display_name, visibility, entry) values ($1, $2, 'Bob', 'gm', $3)`, [campaignId, BOB, roll('secret perception')]),
        )
        const labels = (who: string) => as(who, () => rows<{ entry: { label: string } }>(`select entry from campaign_rolls`)).then((r) => r.map((x) => x.entry.label))

        expect(await labels(BOB)).toContain('secret perception')
        expect(await labels(ALICE)).toContain('secret perception')
        expect(await labels(CARA)).not.toContain('secret perception')
    })

    it('rejects an unknown visibility and oversize entries', async () => {
        await expect(
            as(BOB, () => db.query(`insert into campaign_rolls (campaign_id, user_id, display_name, visibility, entry) values ($1, $2, 'Bob', 'everyone', $3)`, [campaignId, BOB, roll()])),
        ).rejects.toThrow(/check constraint/)
        await expect(
            as(BOB, () => db.query(`insert into campaign_rolls (campaign_id, user_id, display_name, entry) values ($1, $2, 'Bob', $3)`, [campaignId, BOB, JSON.stringify({ pad: 'x'.repeat(9000) })])),
        ).rejects.toThrow(/check constraint/)
    })

    it('players cannot edit or delete rolls; only the GM can delete', async () => {
        await as(BOB, () => db.query(`update campaign_rolls set entry = '{"label":"edited"}'`)).catch(() => undefined)
        const stillOriginal = await as(BOB, () => rows<{ entry: { label: string } }>(`select entry from campaign_rolls where user_id = '${BOB}'`))
        expect(stillOriginal.some((r) => r.entry.label === 'edited')).toBe(false)

        const bobDelete = await as(BOB, () => db.query(`delete from campaign_rolls`))
        expect(bobDelete.affectedRows ?? 0).toBe(0)
    })
})

describe('member status (party board)', () => {
    const summary = JSON.stringify({ name: 'Toph', hp: 20, maxHp: 30 })

    it('you can write your own, and the whole table can read it', async () => {
        await as(BOB, () =>
            db.query(`insert into member_status (campaign_id, user_id, summary) values ($1, $2, $3) on conflict (campaign_id, user_id) do update set summary = excluded.summary`, [campaignId, BOB, summary]),
        )
        const seen = await as(CARA, () => rows<{ summary: { name: string } }>(`select summary from member_status`))
        expect(seen[0].summary.name).toBe('Toph')
    })

    it('you cannot write someone else\'s', async () => {
        await expect(
            as(BOB, () => db.query(`insert into member_status (campaign_id, user_id, summary) values ($1, $2, $3)`, [campaignId, CARA, summary])),
        ).rejects.toThrow(/row-level security/)
    })
})

describe('GM powers', () => {
    it('only the GM can clear the log', async () => {
        const cara = await as(CARA, () => db.query(`delete from campaign_rolls`))
        expect(cara.affectedRows ?? 0).toBe(0)

        const gm = await as(ALICE, () => db.query(`delete from campaign_rolls`))
        expect(gm.affectedRows ?? 0).toBeGreaterThan(0)
        expect(await as(ALICE, () => rows(`select id from campaign_rolls`))).toEqual([])
    })

    it('only the GM can remove another member; anyone can leave', async () => {
        const bobKicksCara = await as(BOB, () => db.query(`delete from campaign_members where user_id = '${CARA}'`))
        expect(bobKicksCara.affectedRows ?? 0).toBe(0)

        const gmKicksCara = await as(ALICE, () => db.query(`delete from campaign_members where user_id = '${CARA}'`))
        expect(gmKicksCara.affectedRows).toBe(1)

        // Removed members lose access immediately
        expect(await as(CARA, () => rows(`select id from campaigns`))).toEqual([])
        await as(CARA, () => rows(`select join_campaign('${code}', 'Cara')`))

        const bobLeaves = await as(BOB, () => db.query(`delete from campaign_members where user_id = '${BOB}'`))
        expect(bobLeaves.affectedRows).toBe(1)
        await as(BOB, () => rows(`select join_campaign('${code}', 'Bob')`))
    })

    it('only the GM can rename the campaign, and only the name', async () => {
        const bob = await as(BOB, () => db.query(`update campaigns set name = 'Hijacked'`))
        expect(bob.affectedRows ?? 0).toBe(0)

        await as(ALICE, () => db.query(`update campaigns set name = 'The Long Siege'`))
        expect((await as(ALICE, () => rows<{ name: string }>(`select name from campaigns`)))[0].name).toBe('The Long Siege')

        await expect(as(ALICE, () => db.query(`update campaigns set gm_id = '${EVE}'`))).rejects.toThrow(/permission denied/)
        await expect(as(ALICE, () => db.query(`update campaigns set code = 'HACKED'`))).rejects.toThrow(/permission denied/)
    })

    it('cannot make yourself GM by editing your member row', async () => {
        await expect(as(BOB, () => db.query(`update campaign_members set role = 'gm' where user_id = '${BOB}'`))).rejects.toThrow(/permission denied/)
    })

    it('cannot add members directly, only through join_campaign', async () => {
        await expect(
            as(EVE, () => db.query(`insert into campaign_members (campaign_id, user_id, display_name, role) values ($1, $2, 'Eve', 'player')`, [campaignId, EVE])),
        ).rejects.toThrow(/permission denied/)
    })

    it('cannot create campaigns directly', async () => {
        await expect(
            as(EVE, () => db.query(`insert into campaigns (code, name, gm_id, gm_key_hash) values ('EVEEVE12', 'Mine', '${EVE}', 'x')`)),
        ).rejects.toThrow(/permission denied/)
    })
})

describe('recovering the GM seat', () => {
    it('the right code and key hand the seat to the new device, and demote the old GM', async () => {
        const newDevice = '55555555-5555-5555-5555-555555555555'
        await as(newDevice, () => rows(`select claim_gm('${code}', '${gmKey}', 'Alice again')`))

        const roles = await as(newDevice, () => rows<{ user_id: string; role: string }>(`select user_id, role from campaign_members where role = 'gm'`))
        expect(roles).toEqual([{ user_id: newDevice, role: 'gm' }])

        // The old device is now just a player: it cannot clear the log
        await as(BOB, () => db.query(`insert into campaign_rolls (campaign_id, user_id, display_name, entry) values ($1, $2, 'Bob', $3)`, [campaignId, BOB, roll()]))
        const oldGm = await as(ALICE, () => db.query(`delete from campaign_rolls`))
        expect(oldGm.affectedRows ?? 0).toBe(0)
        const newGm = await as(newDevice, () => db.query(`delete from campaign_rolls`))
        expect(newGm.affectedRows).toBe(1)
    })

    it('a wrong key or wrong code does nothing', async () => {
        await expect(as(EVE, () => rows(`select claim_gm('${code}', 'nope', 'Eve')`))).rejects.toThrow(/do not match/)
        await expect(as(EVE, () => rows(`select claim_gm('00000000', '${gmKey}', 'Eve')`))).rejects.toThrow(/do not match/)
        expect(await as(EVE, () => rows(`select id from campaigns`))).toEqual([])
    })
})

describe('NPCs (used by the NPC Studio)', () => {
    it('the GM manages them; players only see revealed ones', async () => {
        const gm = '55555555-5555-5555-5555-555555555555' // claimed the seat above
        await as(gm, () => db.query(`insert into campaign_npcs (campaign_id, data) values ($1, '{"name":"Hidden"}'), ($1, '{"name":"Shown"}')`, [campaignId]))
        await as(gm, () => db.query(`update campaign_npcs set revealed = true where data->>'name' = 'Shown'`))

        const bobSees = await as(BOB, () => rows<{ data: { name: string } }>(`select data from campaign_npcs`))
        expect(bobSees.map((r) => r.data.name)).toEqual(['Shown'])

        const gmSees = await as(gm, () => rows(`select id from campaign_npcs`))
        expect(gmSees).toHaveLength(2)

        await expect(as(BOB, () => db.query(`insert into campaign_npcs (campaign_id, data) values ($1, '{}')`, [campaignId]))).rejects.toThrow(/row-level security/)
    })
})

describe('deleting a campaign', () => {
    it('removes its members, rolls and status', async () => {
        const gm = '55555555-5555-5555-5555-555555555555'
        await as(gm, () => db.query(`delete from campaigns where id = $1`, [campaignId]))
        for (const table of ['campaign_members', 'campaign_rolls', 'member_status', 'campaign_npcs']) {
            expect((await rows<{ n: number }>(`select count(*)::int as n from ${table}`))[0].n, table).toBe(0)
        }
    })
})
