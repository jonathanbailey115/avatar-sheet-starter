import { describe, expect, it } from 'vitest'
import { SCHEMA_SQL, selectRows, startDb } from './pgHarness'

describe('campaign NPC rows set up before npc_id existed', () => {
    it('keep their identity when the schema is run again', async () => {
        const db = await startDb()
        // Put the table back the way an older project has it: no npc_id column, one row keyed by the NPC's id.
        await db.exec('drop index if exists campaign_npcs_one_per_campaign; alter table campaign_npcs drop column npc_id;')
        await db.exec(`insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'gm@example.com')`)
        await db.exec(`insert into campaigns (id, code, name, gm_id, gm_key_hash) values ('22222222-2222-2222-2222-222222222222', 'ABCD1234', 'Old', '11111111-1111-1111-1111-111111111111', 'x')`)
        await db.exec(`insert into campaign_npcs (id, campaign_id, data) values ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '{}')`)

        await db.exec(SCHEMA_SQL)

        const rows = await selectRows<{ id: string; npc_id: string }>(db, 'select id, npc_id from campaign_npcs')
        expect(rows).toEqual([{ id: '33333333-3333-3333-3333-333333333333', npc_id: '33333333-3333-3333-3333-333333333333' }])
        // And new rows still get an id of their own.
        await db.exec(`insert into campaign_npcs (campaign_id, data) values ('22222222-2222-2222-2222-222222222222', '{}')`)
        const fresh = await selectRows<{ npc_id: string }>(db, `select npc_id from campaign_npcs where id <> '33333333-3333-3333-3333-333333333333'`)
        expect(fresh[0].npc_id).toMatch(/^[0-9a-f-]{36}$/)
        await db.close()
    }, 60_000)
})
