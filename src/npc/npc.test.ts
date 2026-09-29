import { describe, expect, it } from 'vitest'
import { limitStatus } from '../engine/techniques'
import { realContent } from '../lib/testFixtures'
import { npcTemplates } from '../data/npcTemplates'
import { generateNpc, rerollPart } from './generate'
import { buildStatBlock, statBlockText } from './statBlock'
import { NPC_PARTS } from './types'
import type { NpcContext } from './types'

function seeded(seed: number) {
    let state = seed
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296
        return state / 4294967296
    }
}

const guard: NpcContext = { template: npcTemplates[0], content: realContent }
const none = { nation: null, classId: null } as const

describe('quick-create', () => {
    it('builds a complete NPC for many seeds and levels', () => {
        for (let seed = 1; seed <= 40; seed += 1) {
            const level = 1 + (seed % 20)
            const { character } = generateNpc({ ...none, level }, guard, seeded(seed))
            expect(character.role).toBe('NPC')
            expect(character.name).not.toBe('')
            expect(character.level).toBe(level)
            expect(character.classId).not.toBe('')
            expect(character.lineageId).not.toBe('')
            const block = buildStatBlock(character, realContent)
            expect(block.hp).toBeGreaterThan(0)
            expect(block.armorClass).toBeGreaterThanOrEqual(10)
            expect(statBlockText(block)).toContain(block.name)
        }
    })

    it('never exceeds the class technique caps', () => {
        for (let seed = 1; seed <= 30; seed += 1) {
            const { character } = generateNpc({ ...none, level: 1 + (seed % 20) }, guard, seeded(seed))
            const cls = realContent.classes.find((c) => c.id === character.classId)
            for (const status of limitStatus(character, cls, realContent.techniques)) expect(status.used).toBeLessThanOrEqual(status.max)
        }
    })

    it('gives benders Trained and Mastered techniques only as the class table allows', () => {
        const { character } = generateNpc({ nation: 'Earth Kingdom', classId: 'earthbending', level: 20 }, guard, seeded(3))
        const mastered = character.knownTechniques.filter((k) => k.level === 'Mastered').length
        expect(mastered).toBeLessThanOrEqual(6)
        expect(mastered).toBeGreaterThan(0)
    })

    it('honors a requested class and level, and fixes a nation that cannot bend it', () => {
        const { character, warnings } = generateNpc({ nation: 'Fire Nation', classId: 'earthbending', level: 5 }, guard, seeded(9))
        expect(character.classId).toBe('earthbending')
        expect(character.nation).toBe('Earth Kingdom')
        expect(warnings.join(' ')).toMatch(/nation was changed/)
    })

    it('says so when the nation bends an element the app has no class for', () => {
        const fire = { template: { ...npcTemplates[0], nationWeights: { 'Fire Nation': 1 }, bendingWeights: { Fire: 1 } }, content: realContent }
        const { character, warnings } = generateNpc({ ...none, level: 3 }, fire, seeded(4))
        expect(character.classId).toBe('weaponsmaster')
        expect(warnings.join(' ')).toMatch(/not in the app yet/)
    })

    it('is repeatable for the same seed', () => {
        const a = generateNpc({ ...none, level: 6 }, guard, seeded(11)).character
        const b = generateNpc({ ...none, level: 6 }, guard, seeded(11)).character
        expect({ ...a, id: '', weapons: [] }).toEqual({ ...b, id: '', weapons: [] })
    })
})

describe('rerolling one part', () => {
    const base = generateNpc({ nation: 'Earth Kingdom', classId: null, level: 8 }, guard, seeded(21)).character

    it.each(NPC_PARTS.map((p) => p.id))('%s keeps the NPC valid and its identity', (part) => {
        const { character } = rerollPart(base, part, guard, seeded(5))
        expect(character.id).toBe(base.id)
        expect(character.level).toBe(8)
        expect(buildStatBlock(character, realContent).hp).toBeGreaterThan(0)
    })

    it('rerolling the name changes only the name', () => {
        const { character } = rerollPart(base, 'name', guard, seeded(2))
        expect({ ...character, name: '' }).toEqual({ ...base, name: '' })
    })

    it('rerolling abilities leaves class and gear alone', () => {
        const { character } = rerollPart(base, 'abilities', guard, seeded(2))
        expect(character.classId).toBe(base.classId)
        expect(character.weapons).toEqual(base.weapons)
    })

    it('a new nation never leaves a bender with the wrong element', () => {
        const earthbender = generateNpc({ nation: 'Earth Kingdom', classId: 'earthbending', level: 4 }, guard, seeded(8)).character
        for (let seed = 1; seed <= 20; seed += 1) {
            const { character } = rerollPart(earthbender, 'nation', guard, seeded(seed))
            const cls = realContent.classes.find((c) => c.id === character.classId)
            if (cls?.element) expect(character.nation).toBe('Earth Kingdom')
        }
    })
})
