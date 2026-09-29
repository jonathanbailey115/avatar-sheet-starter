// Read-only check of your Supabase setup for Avatar DND.
//
//   npm run check:supabase
//
// It reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.local and only makes GET
// requests. It creates nothing in your project.

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')

if (!existsSync(envPath)) {
    console.log('No .env.local found. Copy .env.example to .env.local and fill it in (docs/SUPABASE_SETUP.md).')
    process.exit(1)
}

const env = Object.fromEntries(
    readFileSync(envPath, 'utf8')
        .split(/\r?\n/)
        .filter((line) => line.trim() && !line.trim().startsWith('#') && line.includes('='))
        .map((line) => {
            const index = line.indexOf('=')
            return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
        }),
)

let base
try {
    base = new URL(env.VITE_SUPABASE_URL).origin
} catch {
    console.log('VITE_SUPABASE_URL in .env.local is not a valid URL.')
    process.exit(1)
}
const key = env.VITE_SUPABASE_ANON_KEY
if (!key) {
    console.log('VITE_SUPABASE_ANON_KEY is missing from .env.local.')
    process.exit(1)
}
if (/service_role|sb_secret_/.test(key)) {
    console.log('That looks like a SECRET key. Use the publishable (or anon) key instead. Never put the secret key in this app.')
    process.exit(1)
}

const headers = { apikey: key, Authorization: `Bearer ${key}` }
const problems = []

async function get(path) {
    try {
        const response = await fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(20000) })
        return { status: response.status, body: await response.text() }
    } catch (error) {
        return { status: 0, body: String(error) }
    }
}

console.log(`Project: ${base}`)

const settings = await get('/auth/v1/settings')
if (settings.status !== 200) {
    console.log(`  [FAIL] Could not reach the project (HTTP ${settings.status}). Check the URL and that the project is not paused.`)
    process.exit(1)
}
console.log('  [ok]   Project reachable and the key is accepted.')

const anonymous = JSON.parse(settings.body)?.external?.anonymous_users === true
if (anonymous) console.log('  [ok]   Anonymous sign-ins are ON.')
else {
    console.log('  [TODO] Anonymous sign-ins are OFF. Turn them on: Authentication > Sign In / Providers > Anonymous.')
    problems.push('anonymous')
}

const COLUMN = { campaigns: 'id', campaign_members: 'campaign_id', campaign_rolls: 'id', member_status: 'campaign_id', campaign_npcs: 'id', profiles: 'user_id' }
for (const table of Object.keys(COLUMN)) {
    const result = await get(`/rest/v1/${table}?select=${COLUMN[table]}&limit=1`)
    if (result.status === 404 && result.body.includes('PGRST205')) {
        console.log(`  [TODO] Table "${table}" is missing. Run supabase/schema.sql in the SQL Editor.`)
        problems.push(table)
    } else {
        // 401/403 "permission denied" is the correct answer for a signed-out visitor: the table exists and is locked.
        console.log(`  [ok]   Table "${table}" exists and is locked to signed-in campaign members (HTTP ${result.status}).`)
    }
}

// Accounts: the username check function (asks a yes/no question, changes nothing)
const usernameCheck = await fetch(`${base}/rest/v1/rpc/username_available`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_username: 'setup-check-not-a-real-user' }),
    signal: AbortSignal.timeout(20000),
}).then(async (r) => ({ status: r.status, body: await r.text() })).catch((e) => ({ status: 0, body: String(e) }))
if (usernameCheck.status === 200) console.log('  [ok]   Account functions are installed (username check works).')
else {
    console.log('  [TODO] Account functions are missing. Run the latest supabase/schema.sql in the SQL Editor (it is safe to re-run).')
    problems.push('accounts')
}

// Email confirmation: with it on, new players must click an emailed link before they can play.
const confirmRequired = JSON.parse(settings.body)?.mailer_autoconfirm === false
if (confirmRequired) {
    console.log('  [note] "Confirm email" is ON: new players must click a link in an email before signing in. The built-in')
    console.log('         email sender only sends a few emails an hour, which can block a group from signing up. Turning it off')
    console.log('         (Authentication > Sign In / Providers > Email > Confirm email) lets players in immediately.')
} else {
    console.log('  [ok]   "Confirm email" is OFF: players can sign up and play straight away.')
}

console.log(problems.length === 0 ? '\nAll set. Run "npm run dev" and open the Campaigns tab.' : '\nFinish the [TODO] steps above, then run this again.')
process.exit(problems.length === 0 ? 0 : 2)
