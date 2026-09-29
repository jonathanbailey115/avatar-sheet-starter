import { describe, expect, it } from 'vitest'
import { SupabaseBackend } from './supabaseBackend'

/** A stand-in for the Supabase client that records calls and returns what each test says. */
interface Fake {
    session: { user: { id: string; email: string; is_anonymous?: boolean } } | null
    profile: string | null
    signUpResult: { data: { session: unknown; user: { id: string; email: string } | null }; error: { message: string } | null }
    signInResult: { data: { user: { id: string; email: string } | null }; error: { message: string } | null }
    rpcResults: Record<string, { data: unknown; error: { message: string } | null }>
    calls: string[]
    lastSignUp?: unknown
    lastReset?: unknown
}

function makeBackend(overrides: Partial<Fake> = {}) {
    const fake: Fake = {
        session: null,
        profile: null,
        signUpResult: { data: { session: null, user: null }, error: null },
        signInResult: { data: { user: null }, error: null },
        rpcResults: {},
        calls: [],
        ...overrides,
    }

    const client = {
        auth: {
            getSession: async () => ({ data: { session: fake.session } }),
            signOut: async (options: unknown) => {
                fake.calls.push(`signOut:${JSON.stringify(options)}`)
                fake.session = null
                return { error: null }
            },
            signUp: async (input: unknown) => {
                fake.calls.push('signUp')
                fake.lastSignUp = input
                return fake.signUpResult
            },
            signInWithPassword: async () => fake.signInResult,
            updateUser: async (input: unknown) => {
                fake.calls.push(`updateUser:${JSON.stringify(input)}`)
                return { error: null }
            },
            resetPasswordForEmail: async (email: string, options: unknown) => {
                fake.lastReset = { email, options }
                return { error: null }
            },
        },
        from: () => ({ select: () => ({ maybeSingle: async () => ({ data: fake.profile ? { username: fake.profile } : null, error: null }) }) }),
        rpc: async (name: string) => {
            fake.calls.push(`rpc:${name}`)
            return fake.rpcResults[name] ?? { data: null, error: null }
        },
    }

    // The fake only implements the parts the account methods use.
    const backend = new SupabaseBackend('https://abc.supabase.co', 'key', 'device', (() => client) as never)
    return { backend, fake }
}

const user = (over = {}) => ({ id: 'u1', email: 'a@b.co', ...over })

describe('restoring a session', () => {
    it('is null when nobody is signed in', async () => {
        expect(await makeBackend().backend.init()).toBeNull()
    })

    it('returns the account with its username', async () => {
        const { backend } = makeBackend({ session: { user: user() }, profile: 'Toph' })
        expect(await backend.init()).toEqual({ userId: 'u1', email: 'a@b.co', username: 'Toph' })
    })

    it('an account with no username yet still signs in (the app asks for one)', async () => {
        const { backend } = makeBackend({ session: { user: user() }, profile: null })
        expect((await backend.init())?.username).toBeNull()
    })

    it('old guest sign-ins are ended, not kept', async () => {
        const { backend, fake } = makeBackend({ session: { user: user({ is_anonymous: true }) } })
        expect(await backend.init()).toBeNull()
        expect(fake.calls).toContain('signOut:{"scope":"local"}')
    })
})

describe('signing up', () => {
    it('passes the username along and trims the email', async () => {
        const { backend, fake } = makeBackend({
            signUpResult: { data: { session: { ok: true }, user: user() }, error: null },
            profile: 'Toph',
        })
        const result = await backend.signUp({ email: '  a@b.co ', password: 'secret123', username: ' Toph ' })
        expect(result).toEqual({ status: 'signed-in', session: { userId: 'u1', email: 'a@b.co', username: 'Toph' } })
        expect(fake.lastSignUp).toMatchObject({ email: 'a@b.co', options: { data: { username: 'Toph' } } })
    })

    it('says to check email when the project requires confirmation', async () => {
        const { backend } = makeBackend()
        expect(await backend.signUp({ email: 'a@b.co', password: 'secret123', username: 'Toph' })).toEqual({ status: 'confirm-email' })
    })

    it('claims the username afterwards if the sign-up trigger could not', async () => {
        const { backend, fake } = makeBackend({
            signUpResult: { data: { session: { ok: true }, user: user() }, error: null },
            profile: null,
            rpcResults: { claim_username: { data: 'Toph', error: null } },
        })
        const result = await backend.signUp({ email: 'a@b.co', password: 'secret123', username: 'Toph' })
        expect(result).toMatchObject({ status: 'signed-in', session: { username: 'Toph' } })
        expect(fake.calls).toContain('rpc:claim_username')
    })

    it('reports a duplicate email in plain words', async () => {
        const { backend } = makeBackend({ signUpResult: { data: { session: null, user: null }, error: { message: 'User already registered' } } })
        await expect(backend.signUp({ email: 'a@b.co', password: 'secret123', username: 'Toph' })).rejects.toThrow(/already an account/)
    })
})

describe('signing in and out', () => {
    it('returns the account', async () => {
        const { backend } = makeBackend({ signInResult: { data: { user: user() }, error: null }, profile: 'Toph' })
        expect(await backend.signIn('a@b.co', 'secret123')).toMatchObject({ userId: 'u1', username: 'Toph' })
    })

    it('says the email and password do not match without saying which is wrong', async () => {
        const { backend } = makeBackend({ signInResult: { data: { user: null }, error: { message: 'Invalid login credentials' } } })
        await expect(backend.signIn('a@b.co', 'nope')).rejects.toThrow('That email and password do not match.')
    })

    it('signs out of this device only', async () => {
        const { backend, fake } = makeBackend()
        await backend.signOut()
        expect(fake.calls).toContain('signOut:{"scope":"local"}')
    })
})

describe('usernames, passwords, and resets', () => {
    it('checks whether a username is free', async () => {
        const { backend } = makeBackend({ rpcResults: { username_available: { data: false, error: null } } })
        expect(await backend.usernameAvailable('Toph')).toBe(false)
    })

    it('does not block sign-up if the availability check itself fails', async () => {
        const { backend } = makeBackend({ rpcResults: { username_available: { data: null, error: { message: 'boom' } } } })
        expect(await backend.usernameAvailable('Toph')).toBe(true)
    })

    it('changing username surfaces "taken" from the database', async () => {
        const { backend } = makeBackend({ rpcResults: { claim_username: { data: null, error: { message: 'That username is taken' } } } })
        await expect(backend.setUsername('Toph')).rejects.toThrow('That username is taken')
    })

    it('changes the password', async () => {
        const { backend, fake } = makeBackend()
        await backend.changePassword('newsecret1')
        expect(fake.calls).toContain('updateUser:{"password":"newsecret1"}')
    })

    it('asks for a reset email that returns to this app', async () => {
        const { backend, fake } = makeBackend()
        Object.assign(globalThis, { window: { location: { origin: 'https://game.example', pathname: '/' } } })
        await backend.requestPasswordReset(' a@b.co ')
        expect(fake.lastReset).toEqual({ email: 'a@b.co', options: { redirectTo: 'https://game.example/' } })
    })
})
