import { describe, expect, it } from 'vitest'
import type { RollEntry } from '../engine/rolls'
import { formatCode, isPlausibleCode, normalizeCode, randomCode } from './code'
import { LocalBackend } from './localBackend'
import type { ChannelLike } from './localBackend'
import { CampaignServer } from './server'
import { CampaignError } from './types'
import type { CampaignEvent, PlayerSummary } from './types'

const ALICE = 'alice'
const BOB = 'bob'
const CARA = 'cara'
const EVE = 'eve'

const entry = (label = 'Athletics check'): RollEntry => ({
    id: label,
    at: 0,
    characterId: null,
    characterName: 'x',
    kind: 'check',
    label,
    formula: '1d20',
    dice: [10],
    discarded: [],
    modifier: 0,
    total: 10,
    mode: 'normal',
    notes: [],
})

const summary: PlayerSummary = {
    characterId: 'c1',
    name: 'Toph',
    className: 'Earthbending',
    lineageName: 'Earth Kingdom',
    level: 5,
    hp: 30,
    maxHp: 50,
    tempHp: 0,
    armorClass: 14,
    lifeState: 'conscious',
    exhaustion: 0,
    initiative: 2,
    saveDc: 14,
}

function table() {
    const server = new CampaignServer()
    const { campaign, gmKey } = server.createCampaign(ALICE, 'The Siege', 'Alice')
    server.joinCampaign(BOB, campaign.code, 'Bob')
    server.joinCampaign(CARA, campaign.code, 'Cara')
    return { server, campaign, gmKey }
}

describe('join codes', () => {
    it('normalizes what people type', () => {
        expect(normalizeCode(' ab12-cd34 ')).toBe('AB12CD34')
        expect(formatCode('ab12cd34')).toBe('AB12-CD34')
        expect(isPlausibleCode('AB12-CD34')).toBe(true)
        expect(isPlausibleCode('AB12')).toBe(false)
    })

    it('generates 8 hex characters', () => {
        for (let i = 0; i < 50; i += 1) expect(randomCode()).toMatch(/^[0-9A-F]{8}$/)
    })
})

describe('creating and joining', () => {
    it('the creator is GM, the rest are players', () => {
        const { server, campaign } = table()
        const roles = server.load(ALICE, campaign.id).members.map((m) => [m.displayName, m.role])
        expect(roles).toEqual([['Alice', 'gm'], ['Bob', 'player'], ['Cara', 'player']])
    })

    it('joining works with a messy code and rejects a wrong one', () => {
        const { server, campaign } = table()
        const messy = `${campaign.code.slice(0, 4).toLowerCase()} - ${campaign.code.slice(4).toLowerCase()}`
        expect(server.joinCampaign('dan', messy, 'Dan').id).toBe(campaign.id)
        expect(() => server.joinCampaign(EVE, '00000000', 'Eve')).toThrow(/No campaign with that code/)
    })

    it('needs names', () => {
        const server = new CampaignServer()
        expect(() => server.createCampaign(ALICE, '  ', 'Alice')).toThrow(CampaignError)
        expect(() => server.createCampaign(ALICE, 'X', '')).toThrow(/display name/)
    })

    it('never reveals the GM key in the public campaign', () => {
        const { server, campaign } = table()
        expect(JSON.stringify(server.load(BOB, campaign.id))).not.toMatch(/gmKey/)
        expect(Object.keys(campaign)).not.toContain('gmKey')
    })

    it('lists only your own campaigns', () => {
        const { server } = table()
        expect(server.listCampaigns(BOB)).toHaveLength(1)
        expect(server.listCampaigns(EVE)).toHaveLength(0)
    })
})

describe('privacy', () => {
    it('a stranger cannot load, roll, or publish', () => {
        const { server, campaign } = table()
        expect(() => server.load(EVE, campaign.id)).toThrow(/not in that campaign/)
        expect(() => server.publishRoll(EVE, campaign.id, entry(), 'all', 'Eve')).toThrow(/not in that campaign/)
        expect(() => server.publishStatus(EVE, campaign.id, summary)).toThrow(/not in that campaign/)
    })

    it('private rolls are seen by the roller and the GM only', () => {
        const { server, campaign } = table()
        server.publishRoll(BOB, campaign.id, entry('secret'), 'gm', 'Bob')
        server.publishRoll(BOB, campaign.id, entry('open'), 'all', 'Bob')

        const labels = (who: string) => server.load(who, campaign.id).rolls.map((r) => r.entry.label).sort()
        expect(labels(BOB)).toEqual(['open', 'secret'])
        expect(labels(ALICE)).toEqual(['open', 'secret'])
        expect(labels(CARA)).toEqual(['open'])
    })

    it('rolls come back newest first', () => {
        const { server, campaign } = table()
        const first = server.publishRoll(BOB, campaign.id, entry('first'), 'all', 'Bob')
        server.state.rolls[0].createdAt = first.createdAt - 1000
        server.publishRoll(BOB, campaign.id, entry('second'), 'all', 'Bob')
        expect(server.load(BOB, campaign.id).rolls.map((r) => r.entry.label)).toEqual(['second', 'first'])
    })
})

describe('GM powers', () => {
    it('only the GM clears the log or removes a player', () => {
        const { server, campaign } = table()
        server.publishRoll(BOB, campaign.id, entry(), 'all', 'Bob')

        expect(() => server.clearRolls(BOB, campaign.id)).toThrow(/Only the GM/)
        expect(() => server.removeMember(BOB, campaign.id, CARA)).toThrow(/Only the GM/)

        server.removeMember(ALICE, campaign.id, CARA)
        expect(() => server.load(CARA, campaign.id)).toThrow(/not in that campaign/)

        server.clearRolls(ALICE, campaign.id)
        expect(server.load(ALICE, campaign.id).rolls).toEqual([])
    })

    it('anyone can leave, and their status goes with them', () => {
        const { server, campaign } = table()
        server.publishStatus(BOB, campaign.id, summary)
        server.leave(BOB, campaign.id)
        expect(server.load(ALICE, campaign.id).statuses).toEqual([])
        expect(server.listCampaigns(BOB)).toEqual([])
    })
})

describe('the party board', () => {
    it('one status per player, updated in place', () => {
        const { server, campaign } = table()
        server.publishStatus(BOB, campaign.id, summary)
        server.publishStatus(BOB, campaign.id, { ...summary, hp: 12 })
        const statuses = server.load(CARA, campaign.id).statuses
        expect(statuses).toHaveLength(1)
        expect(statuses[0].summary.hp).toBe(12)
    })
})

describe('recovering the GM seat', () => {
    it('the right key moves the seat and demotes the old GM', () => {
        const { server, campaign, gmKey } = table()
        server.claimGm('new-device', campaign.code, gmKey, 'Alice again')
        expect(server.load('new-device', campaign.id).members.filter((m) => m.role === 'gm').map((m) => m.userId)).toEqual(['new-device'])
        expect(() => server.clearRolls(ALICE, campaign.id)).toThrow(/Only the GM/)
        expect(() => server.clearRolls('new-device', campaign.id)).not.toThrow()
    })

    it('a wrong key does nothing', () => {
        const { server, campaign } = table()
        expect(() => server.claimGm(EVE, campaign.code, 'nope', 'Eve')).toThrow(/do not match/)
        expect(() => server.load(EVE, campaign.id)).toThrow(/not in that campaign/)
    })
})

describe('log size', () => {
    it('keeps only the newest 500 rolls per campaign', () => {
        const { server, campaign } = table()
        for (let i = 0; i < 510; i += 1) server.publishRoll(BOB, campaign.id, entry(`r${i}`), 'all', 'Bob')
        expect(server.state.rolls).toHaveLength(500)
        expect(server.state.rolls.some((r) => r.entry.label === 'r0')).toBe(false)
        expect(server.state.rolls.some((r) => r.entry.label === 'r509')).toBe(true)
    })
})

// ---- Local backend: two tabs sharing one browser ----

class MemoryStore {
    private data = new Map<string, string>()
    getItem = (key: string) => this.data.get(key) ?? null
    setItem = (key: string, value: string) => void this.data.set(key, value)
}

/** Like BroadcastChannel: a message reaches every other channel, not the sender. */
function channelBus() {
    const channels = new Set<ChannelLike>()
    return (): ChannelLike => {
        const channel: ChannelLike = {
            onmessage: null,
            postMessage: (data) => {
                for (const other of channels) if (other !== channel) other.onmessage?.({ data })
            },
            close: () => void channels.delete(channel),
        }
        channels.add(channel)
        return channel
    }
}

function twoTabs() {
    const shared = new MemoryStore()
    const openChannel = channelBus()
    const tab = () => new LocalBackend({ shared, session: new MemoryStore(), openChannel })
    return { alice: tab(), bob: tab() }
}

describe('local test mode (two tabs)', () => {
    it('each tab is a different player', async () => {
        const { alice, bob } = twoTabs()
        expect(await alice.init()).not.toBe(await bob.init())
    })

    it('a player joins by code and rolls show up live in the GM tab', async () => {
        const { alice, bob } = twoTabs()
        await alice.init()
        await bob.init()

        const { campaign } = await alice.createCampaign('The Siege', 'Alice')
        const events: CampaignEvent[] = []
        alice.subscribe(campaign.id, (event) => events.push(event))

        await bob.joinCampaign(campaign.code, 'Bob')
        await bob.publishRoll(campaign.id, entry('Bob rolls'), 'all', 'Bob')

        expect(events.length).toBeGreaterThan(0)
        const seen = (await alice.load(campaign.id)).rolls.map((r) => r.entry.label)
        expect(seen).toEqual(['Bob rolls'])
    })

    it('stops notifying after unsubscribing', async () => {
        const { alice, bob } = twoTabs()
        await alice.init()
        await bob.init()
        const { campaign } = await alice.createCampaign('C', 'Alice')
        let count = 0
        const stop = alice.subscribe(campaign.id, () => (count += 1))
        await bob.joinCampaign(campaign.code, 'Bob')
        const before = count
        stop()
        await bob.publishRoll(campaign.id, entry(), 'all', 'Bob')
        expect(count).toBe(before)
    })

    it('errors from the rules reach the caller', async () => {
        const { alice, bob } = twoTabs()
        await alice.init()
        await bob.init()
        const { campaign } = await alice.createCampaign('C', 'Alice')
        await expect(bob.clearRolls(campaign.id)).rejects.toThrow(/not in that campaign|Only the GM/)
    })

    it('survives a corrupt saved state', async () => {
        const shared = new MemoryStore()
        shared.setItem('avatar-dnd:local-campaign-server', '{not json')
        const backend = new LocalBackend({ shared, session: new MemoryStore(), openChannel: channelBus() })
        await backend.init()
        expect(await backend.listCampaigns()).toEqual([])
        await expect(backend.createCampaign('Fresh', 'Me')).resolves.toBeDefined()
    })
})
