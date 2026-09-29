import { beforeEach, describe, expect, it } from 'vitest'
import { authStorageFor, currentScope, projectRefOf, rememberScope, storageKeyFor } from './authStorage'

class MemoryStorage {
    private data = new Map<string, string>()
    getItem = (key: string) => this.data.get(key) ?? null
    setItem = (key: string, value: string) => void this.data.set(key, value)
    removeItem = (key: string) => void this.data.delete(key)
}

let local: MemoryStorage
let session: MemoryStorage

beforeEach(() => {
    local = new MemoryStorage()
    session = new MemoryStorage()
    Object.assign(globalThis, { localStorage: local, sessionStorage: session })
})

describe('sign-in scope', () => {
    it('defaults to this device', () => {
        expect(currentScope()).toBe('device')
    })

    it('remembers "this tab only" for the life of the tab', () => {
        rememberScope('tab')
        expect(currentScope()).toBe('tab')
        rememberScope('device')
        expect(currentScope()).toBe('device')
    })
})

describe('where the sign-in is kept', () => {
    it('device scope uses localStorage, shared by every tab', () => {
        authStorageFor('device').setItem('k', 'v')
        expect(local.getItem('k')).toBe('v')
        expect(session.getItem('k')).toBeNull()
    })

    it('tab scope uses sessionStorage, private to one tab', () => {
        authStorageFor('tab').setItem('k', 'v')
        expect(session.getItem('k')).toBe('v')
        expect(local.getItem('k')).toBeNull()
    })

    it('does not throw if storage is blocked', () => {
        Object.assign(globalThis, {
            localStorage: {
                getItem() { throw new Error('blocked') },
                setItem() { throw new Error('blocked') },
                removeItem() { throw new Error('blocked') },
            },
        })
        const storage = authStorageFor('device')
        expect(storage.getItem('k')).toBeNull()
        expect(() => storage.setItem('k', 'v')).not.toThrow()
    })
})

describe('storage keys', () => {
    it('device scope uses the standard key', () => {
        expect(storageKeyFor('abc', 'device')).toBe('sb-abc-auth-token')
    })

    it('every tab gets its own key so their sign-ins never announce themselves to each other', () => {
        const first = storageKeyFor('abc', 'tab')
        expect(first).toMatch(/^sb-abc-tab-.+-auth-token$/)
        expect(storageKeyFor('abc', 'tab')).toBe(first) // stable within the tab

        const otherTab = new MemoryStorage()
        Object.assign(globalThis, { sessionStorage: otherTab })
        expect(storageKeyFor('abc', 'tab')).not.toBe(first)
    })
})

describe('projectRefOf', () => {
    it('takes the project name from the address', () => {
        expect(projectRefOf('https://pnwqecmnbwbmcklgczbp.supabase.co')).toBe('pnwqecmnbwbmcklgczbp')
        expect(projectRefOf('not a url')).toBe('project')
    })
})
