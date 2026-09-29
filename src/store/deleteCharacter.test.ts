import { beforeAll, describe, expect, it } from 'vitest'
import type { RollEntry } from '../engine/rolls'

class MemoryStorage {
    private data = new Map<string, string>()
    getItem = (key: string) => this.data.get(key) ?? null
    setItem = (key: string, value: string) => void this.data.set(key, value)
    removeItem = (key: string) => void this.data.delete(key)
}

const roll = (id: string, characterId: string | null): RollEntry => ({
    id,
    at: 0,
    characterId,
    characterName: 'x',
    kind: 'check',
    label: id,
    formula: '1d20',
    dice: [10],
    discarded: [],
    modifier: 0,
    total: 10,
    mode: 'normal',
    notes: [],
})

let useLibraryStore: typeof import('./library').useLibraryStore
let useRollLog: typeof import('./rollLog').useRollLog

beforeAll(async () => {
    Object.assign(globalThis, { localStorage: new MemoryStorage(), sessionStorage: new MemoryStorage() })
    ;({ useLibraryStore } = await import('./library'))
    ;({ useRollLog } = await import('./rollLog'))
})

describe('deleting a character', () => {
    it('removes its rolls from the roll log and keeps everyone else’s', () => {
        const library = useLibraryStore.getState()
        const doomed = library.createCharacter()
        const kept = library.createCharacter()

        const log = useRollLog.getState()
        log.clear()
        log.add(roll('a', doomed))
        log.add(roll('b', kept))
        log.add(roll('c', doomed))
        log.add(roll('free', null))

        useLibraryStore.getState().deleteCharacter(doomed)

        expect(useLibraryStore.getState().characters.map((character) => character.id)).toEqual([kept])
        expect(useRollLog.getState().entries.map((entry) => entry.id).sort()).toEqual(['b', 'free'])
    })

    it('leaves the log alone when nothing matches', () => {
        const log = useRollLog.getState()
        log.clear()
        log.add(roll('x', 'someone-else'))
        useRollLog.getState().removeForCharacters(['nobody'])
        expect(useRollLog.getState().entries).toHaveLength(1)
    })
})
