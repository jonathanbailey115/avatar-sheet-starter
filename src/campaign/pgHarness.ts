import { PGlite } from '@electric-sql/pglite'
import schemaSql from '../../supabase/schema.sql?raw'

/**
 * Test harness: runs supabase/schema.sql on a real Postgres (PGlite, in process).
 * Supabase provides the `authenticated`/`anon` roles, auth.uid() and auth.users; we emulate them.
 */
const PRELUDE = `
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    -- Just enough of Supabase's auth.users for the sign-up trigger.
    create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);
    grant usage on schema public, auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    -- Supabase grants everything on new public tables by default; reproduce that.
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on functions to anon, authenticated;
`

export async function startDb(): Promise<PGlite> {
    const db = new PGlite()
    await db.exec(PRELUDE)
    await db.exec(schemaSql)
    return db
}

export const SCHEMA_SQL = schemaSql

/** Run something as a signed-in user, the way PostgREST does: role authenticated + JWT subject. */
export async function runAs<T>(db: PGlite, userId: string | null, run: () => Promise<T>): Promise<T> {
    await db.exec(`select set_config('request.jwt.claim.sub', '${userId ?? ''}', false); set role ${userId ? 'authenticated' : 'anon'};`)
    try {
        return await run()
    } finally {
        await db.exec('reset role')
    }
}

export async function selectRows<T = Record<string, unknown>>(db: PGlite, sql: string, params: unknown[] = []): Promise<T[]> {
    return (await db.query<T>(sql, params)).rows
}

/** Create an auth user the way Supabase Auth does on sign-up, with an optional chosen username. */
export async function signUp(db: PGlite, id: string, email: string, username?: string): Promise<void> {
    const meta = username === undefined ? null : JSON.stringify({ username })
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [id, email, meta])
}
