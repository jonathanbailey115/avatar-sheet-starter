import { describe, expect, it } from 'vitest'
import { npcTemplates } from '../data/npcTemplates'
import { realContent } from '../lib/testFixtures'
import { classEntries } from '../engine/classLevels'
import { generateNpc, rerollPart } from './generate'
import { buildStatBlock, statBlockText } from './statBlock'
import type { NpcContext } from './types'

function seeded(seed: number) {
    let state = seed
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296
        return state / 4294967296
    }
}

const context: NpcContext = { template: npcTemplates[0], content: realContent }
const any = { nation: null, classId: null } as const

describe('random NPC options', () => {
    it('never rolls a Dragon Trainer or the Avatar unless Dragon Trainers are allowed (and never the Avatar)', () => {
        for (let seed = 1; seed <= 120; seed += 1) {
            const { character } = generateNpc({ ...any, level: 5 + (seed % 10) }, context, seeded(seed))
            expect(['dragon-trainer', 'avatar']).not.toContain(character.classId)
        }
        let trainers = 0
        for (let seed = 1; seed <= 400; seed += 1) {
            const { character } = generateNpc({ ...any, level: 6, allowDragonTrainers: true }, context, seeded(seed))
            expect(character.classId).not.toBe('avatar')
            if (character.classId === 'dragon-trainer') trainers += 1
        }
        expect(trainers).toBeGreaterThan(0)
        expect(trainers).toBeLessThan(200)
    })

    it('a Dragon Trainer NPC gets an ancestry, Dragon Techniques and a companion line in its stat block', () => {
        const { character } = generateNpc({ nation: null, classId: 'dragon-trainer', level: 6 }, context, seeded(7))
        expect(character.dragonAncestry).not.toBe('')
        const block = buildStatBlock(character, realContent)
        expect(block.dragon).toContain('Dragon')
        expect(statBlockText(block)).toContain('Dragon companion:')
        const known = character.knownTechniques.map((item) => realContent.techniques.find((technique) => technique.id === item.techniqueId)?.element)
        expect(known.every((element) => element === 'Dragon')).toBe(true)
        expect(known.length).toBeGreaterThan(0)
    })

    it('multiclass NPCs get a second non-bending class that uses part of their levels', () => {
        let withExtra = 0
        for (let seed = 1; seed <= 60; seed += 1) {
            const level = 4 + (seed % 12)
            const { character } = generateNpc({ ...any, level, multiclass: true }, context, seeded(seed))
            expect(character.level).toBe(level)
            if (character.extraClasses.length === 0) continue
            withExtra += 1
            const entries = classEntries(character)
            expect(entries).toHaveLength(2)
            expect(entries.reduce((sum, entry) => sum + entry.level, 0)).toBe(level)
            expect(entries.every((entry) => entry.level >= 1)).toBe(true)
            const extraClass = realContent.classes.find((item) => item.id === character.extraClasses[0].classId)
            expect(extraClass?.element).toBeUndefined()
            expect(buildStatBlock(character, realContent).subtitle).toContain('/')
        }
        expect(withExtra).toBeGreaterThan(40)
    })

    it('stays single-classed by default, and rerolling the class keeps following the option', () => {
        const single = generateNpc({ ...any, level: 8 }, context, seeded(3)).character
        expect(single.extraClasses).toEqual([])
        const multi = generateNpc({ ...any, level: 8, multiclass: true }, context, seeded(3))
        const options = { multiclass: true }
        const rerolled = rerollPart(multi.character, 'class', { ...context, options }, seeded(11)).character
        expect(rerolled.extraClasses.length).toBe(1)
        const plain = rerollPart(multi.character, 'class', context, seeded(11)).character
        expect(plain.extraClasses).toEqual([])
    })
})
