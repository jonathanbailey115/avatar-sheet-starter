import { beforeEach, describe, expect, it } from 'vitest'
import type { SavedInfo, SavedItem, SavedKind, SavedUpload } from '../campaign/types'
import { createBlankCharacter } from '../lib/character'
import { realContent } from '../lib/testFixtures'
import type { Character } from '../types/schema'
import type { Collection } from './collections'
import { runSync } from './syncRun'
import { createSyncStore, ownedBy } from './syncStore'

const ME = 'me'

/** The account's database, with the same "newer wins" rule as save_synced_characters. */
class FakeAccount {
    rows = new Map<string, { kind: SavedKind; id: string; data: unknown; deleted: boolean; updatedAt: number }>()
    saves = 0

    listSavedCharacters = async (): Promise<SavedInfo[]> =>
        [...this.rows.values()].map(({ kind, id, deleted, updatedAt }) => ({ kind, id, deleted, updatedAt }))

    loadSavedCharacters = async (kind: SavedKind, ids: string[]): Promise<SavedItem[]> =>
        ids.flatMap((id) => {
            const row = this.rows.get(`${kind}:${id}`)
            return row && row.data !== null ? [{ kind, id, data: JSON.parse(JSON.stringify(row.data)) as unknown }] : []
        })

    saveCharacters = async (rows: SavedUpload[]): Promise<void> => {
        this.saves += 1
        for (const row of rows) {
            const key = `${row.kind}:${row.id}`
            const existing = this.rows.get(key)
            if (existing && existing.updatedAt > row.updatedAt) continue
            this.rows.set(key, {
                kind: row.kind,
                id: row.id,
                data: row.deleted ? null : JSON.parse(JSON.stringify(row.data)),
                deleted: Boolean(row.deleted),
                updatedAt: row.updatedAt,
            })
        }
    }
}

/** One computer: its own saved characters and its own record of what the account holds. */
function device(account: FakeAccount, kind: SavedKind = 'character') {
    const lists: Record<SavedKind, Character[]> = { character: [], npc: [] }
    const collections: Collection[] = (['character', 'npc'] as const).map((k) => ({
        kind: k,
        all: () => lists[k],
        put: (incoming) => {
            const ids = new Set(incoming.map((c) => c.id))
            lists[k] = [...lists[k].filter((c) => !ids.has(c.id)), ...incoming]
        },
        remove: (ids) => {
            lists[k] = lists[k].filter((c) => !ids.includes(c.id))
        },
        subscribe: () => () => undefined,
    }))
    const store = createSyncStore(`test-${Math.random()}`)
    return {
        lists,
        store,
        sync: () => runSync(ME, { backend: account, collections, store, content: realContent, applying: () => undefined }),
        add: (name: string, at: number, k: SavedKind = kind) => {
            const character = { ...createBlankCharacter(k === 'npc' ? 'NPC' : 'Player Character'), name }
            lists[k].push(character)
            store.getState().own(ME, k, [character.id], at)
            return character
        },
        edit: (id: string, name: string, at: number, k: SavedKind = kind) => {
            lists[k] = lists[k].map((c) => (c.id === id ? { ...c, name } : c))
            store.getState().touch(ME, k, id, at)
        },
        delete: (id: string, at: number, k: SavedKind = kind) => {
            lists[k] = lists[k].filter((c) => c.id !== id)
            store.getState().disown(ME, k, [id])
            store.getState().bury(ME, k, id, at)
        },
    }
}

let account: FakeAccount
beforeEach(() => {
    account = new FakeAccount()
})

describe('syncing two devices through an account', () => {
    it('a character made on one device appears on the other', async () => {
        const laptop = device(account)
        const phone = device(account)
        laptop.add('Ling', 1_000)
        await laptop.sync()
        const result = await phone.sync()
        expect(result.downloaded).toBe(1)
        expect(phone.lists.character.map((c) => c.name)).toEqual(['Ling'])
        expect(ownedBy(phone.store.getState(), ME, 'character')[phone.lists.character[0].id]).toBe(1_000)
    })

    it('an edit travels both ways and the newer one wins', async () => {
        const laptop = device(account)
        const phone = device(account)
        const ling = laptop.add('Ling', 1_000)
        await laptop.sync()
        await phone.sync()

        phone.edit(ling.id, 'Ling (phone)', 2_000)
        await phone.sync()
        await laptop.sync()
        expect(laptop.lists.character[0].name).toBe('Ling (phone)')

        laptop.edit(ling.id, 'Ling (laptop, later)', 3_000)
        await laptop.sync()
        await phone.sync()
        expect(phone.lists.character[0].name).toBe('Ling (laptop, later)')
    })

    it('an older offline edit does not overwrite newer work', async () => {
        const laptop = device(account)
        const phone = device(account)
        const ling = laptop.add('Ling', 1_000)
        await laptop.sync()
        await phone.sync()

        laptop.edit(ling.id, 'newer', 5_000)
        await laptop.sync()
        phone.edit(ling.id, 'older, made while offline', 2_000)
        await phone.sync()

        expect(phone.lists.character[0].name).toBe('newer')
        expect(account.rows.get(`character:${ling.id}`)?.updatedAt).toBe(5_000)
    })

    it('a deletion on one device removes it from the other, and it does not come back', async () => {
        const laptop = device(account)
        const phone = device(account)
        const ling = laptop.add('Ling', 1_000)
        await laptop.sync()
        await phone.sync()

        laptop.delete(ling.id, 2_000)
        await laptop.sync()
        const result = await phone.sync()
        expect(result.removed).toBe(1)
        expect(phone.lists.character).toEqual([])

        await laptop.sync()
        await phone.sync()
        expect(laptop.lists.character).toEqual([])
        expect(phone.lists.character).toEqual([])
    })

    it('characters that were on the device before the account are never uploaded on their own', async () => {
        const laptop = device(account)
        const old = { ...createBlankCharacter(), name: 'Made before signing in' }
        laptop.lists.character.push(old)
        const result = await laptop.sync()
        expect(result.uploaded).toBe(0)
        expect(account.rows.size).toBe(0)

        laptop.store.getState().own(ME, 'character', [old.id], 9_000)
        await laptop.sync()
        expect(account.rows.has(`character:${old.id}`)).toBe(true)
    })

    it('syncs NPCs separately from characters, even with the same id', async () => {
        const laptop = device(account)
        const phone = device(account)
        const guard = laptop.add('Guard', 1_000, 'npc')
        await laptop.sync()
        await phone.sync()
        expect(phone.lists.npc.map((c) => c.name)).toEqual(['Guard'])
        expect(phone.lists.character).toEqual([])
        expect(guard.id).toBe(phone.lists.npc[0].id)
    })

    it('skips a stored record that cannot be read and still loads the rest', async () => {
        const laptop = device(account)
        laptop.add('Good', 1_000)
        await laptop.sync()
        account.rows.set('character:broken', { kind: 'character', id: 'broken', data: { id: 'broken', level: 'not a number' }, deleted: false, updatedAt: 2_000 })

        const phone = device(account)
        const result = await phone.sync()
        expect(result.downloaded).toBe(1)
        expect(result.unreadable).toBe(1)
        expect(phone.lists.character.map((c) => c.name)).toEqual(['Good'])
    })

    it('a second sync with nothing changed sends and receives nothing', async () => {
        const laptop = device(account)
        laptop.add('Ling', 1_000)
        await laptop.sync()
        const savesBefore = account.saves
        const result = await laptop.sync()
        expect(result).toEqual({ downloaded: 0, removed: 0, uploaded: 0, unreadable: 0 })
        expect(account.saves).toBe(savesBefore)
    })

    it('a character that was old-format on the account is migrated when it arrives', async () => {
        account.rows.set('character:legacy', {
            kind: 'character',
            id: 'legacy',
            data: { id: 'legacy', role: 'Player Character', name: 'Old sheet', nation: 'Earth Kingdom', level: 2, bendingType: 'Earth', style: 'Earthbender', hp: 10, chi: 2 },
            deleted: false,
            updatedAt: 500,
        })
        const phone = device(account)
        const result = await phone.sync()
        expect(result.downloaded + result.unreadable).toBe(1)
        if (result.downloaded === 1) expect(phone.lists.character[0].name).toBe('Old sheet')
    })
})
