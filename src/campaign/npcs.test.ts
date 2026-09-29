import { describe, expect, it } from 'vitest'
import { createBlankCharacter } from '../lib/character'
import { shareableNpc } from './npcShare'
import { CampaignServer } from './server'
import { CampaignError } from './types'

const GM = 'gm'
const PLAYER = 'player'

function table() {
    const server = new CampaignServer()
    const { campaign } = server.createCampaign(GM, 'Siege', 'Gm')
    server.joinCampaign(PLAYER, campaign.code, 'Pat')
    return { server, id: campaign.id }
}

const npc = (name: string) => ({ ...createBlankCharacter('NPC'), name })

describe('campaign NPCs', () => {
    it('the GM sees every NPC, players only the revealed ones', () => {
        const { server, id } = table()
        const hidden = npc('Hidden')
        const shown = npc('Shown')
        server.saveNpc(GM, id, { id: hidden.id, character: hidden, revealed: false })
        server.saveNpc(GM, id, { id: shown.id, character: shown, revealed: true })

        expect(server.load(GM, id).npcs.map((n) => n.character.name).sort()).toEqual(['Hidden', 'Shown'])
        expect(server.load(PLAYER, id).npcs.map((n) => n.character.name)).toEqual(['Shown'])
    })

    it('revealing later shows it, and saving again replaces rather than duplicates', () => {
        const { server, id } = table()
        const villain = npc('Villain')
        server.saveNpc(GM, id, { id: villain.id, character: villain, revealed: false })
        server.saveNpc(GM, id, { id: villain.id, character: { ...villain, name: 'Villain (revealed)' }, revealed: true })

        expect(server.load(GM, id).npcs).toHaveLength(1)
        expect(server.load(PLAYER, id).npcs[0].character.name).toBe('Villain (revealed)')
    })

    it('only the GM can add, change or remove NPCs', () => {
        const { server, id } = table()
        const guard = npc('Guard')
        expect(() => server.saveNpc(PLAYER, id, { id: guard.id, character: guard, revealed: true })).toThrow(CampaignError)
        server.saveNpc(GM, id, { id: guard.id, character: guard, revealed: true })
        expect(() => server.deleteNpc(PLAYER, id, guard.id)).toThrow(CampaignError)
        server.deleteNpc(GM, id, guard.id)
        expect(server.load(GM, id).npcs).toEqual([])
    })
})

describe('what leaves the GM device', () => {
    it('blanks private writing but keeps the stat block', () => {
        const secret = { ...npc('Spy'), notes: 'works for the Fire Lord', flaws: 'greedy', level: 7, strength: 16 }
        const shared = shareableNpc(secret)
        expect(shared).toMatchObject({ name: 'Spy', level: 7, strength: 16, notes: '', flaws: '' })
        expect(secret.notes).toBe('works for the Fire Lord')
    })
})
