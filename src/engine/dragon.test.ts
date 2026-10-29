import { describe, expect, it } from 'vitest'
import { dragonTechniques } from '../data/dragonTechniques'
import { characterClasses } from '../data'
import { createBlankCharacter } from '../lib/character'
import { realContent } from '../lib/testFixtures'
import type { Character } from '../types/schema'
import { classLevelsOf } from './classLevels'
import { classProficiencies } from './classProficiencies'
import { computeDragon, damageDragon, dragonDefiance, healDragon, reviveDragon } from './dragon'
import { getResources } from './resources'
import { computeSheet } from './sheet'
import { learnBlocker, limitStatus, slotSources, subclassLimits } from './techniques'

const trainer = (level: number, overrides: Partial<Character> = {}): Character => ({
    ...createBlankCharacter(),
    species: 'none',
    classId: 'dragon-trainer',
    level,
    wisdom: 16, // +3
    dragonAncestry: 'ember',
    ...overrides,
})

const dragonAt = (level: number) => computeDragon(trainer(level), level, 16, level >= 17 ? 6 : level >= 13 ? 5 : level >= 9 ? 4 : level >= 5 ? 3 : 2)!

describe('dragon companion', () => {
    it('does not exist without Dragon Trainer levels', () => {
        expect(computeDragon(trainer(5), 0, 16, 3)).toBeNull()
    })

    it('Hit Points are 6 plus six times the trainer level; AC is 14 plus Wisdom', () => {
        expect(dragonAt(1).maxHp).toBe(12)
        expect(dragonAt(10).maxHp).toBe(66)
        expect(dragonAt(10).armorClass).toBe(17)
    })

    it('grows through the stages', () => {
        expect([1, 5, 14, 20].map((level) => dragonAt(level).size)).toEqual(['Small', 'Medium', 'Large', 'Huge'])
        expect(dragonAt(14).speed).toBe(40)
        expect(dragonAt(13).speed).toBe(30)
        expect(dragonAt(5).abilities.find((item) => item.key === 'strength')?.score).toBe(16)
        expect(dragonAt(20).abilities.find((item) => item.key === 'strength')?.score).toBe(20)
    })

    it('Rend scales with Wisdom and proficiency; the Tail comes at level 14', () => {
        const rend = dragonAt(5).attacks[0]
        expect(rend.toHit).toBe(3 + 3)
        expect(rend.formula).toBe('1d8+3')
        expect(rend.extra).toEqual({ formula: '1d6', damageType: 'fire' })
        expect(dragonAt(4).attacks[0].extra).toBeUndefined()
        expect(dragonAt(13).attacks.map((item) => item.name)).toEqual(['Rend'])
        expect(dragonAt(14).attacks.map((item) => item.name)).toEqual(['Rend', 'Tail'])
    })

    it('Dragon Breath: DC, cone, dice and uses follow the table', () => {
        expect(dragonAt(1).breath).toBeNull()
        expect(dragonAt(2).breath).toMatchObject({ dc: 8 + 3 + 2, cone: 15, formula: '2d8', uses: 1 })
        expect(dragonAt(5).breath).toMatchObject({ cone: 30, formula: '3d8', uses: 2 })
        expect(dragonAt(11).breath).toMatchObject({ formula: '4d10', uses: 3 })
        expect(dragonAt(17).breath).toMatchObject({ cone: 60, formula: '4d12', uses: 4 })
    })

    it('damage uses temp HP first, never goes below 0, and healing is capped', () => {
        const c = { ...trainer(5), dragonTempHp: 5 }
        const hit = damageDragon(c, 8, 36)
        expect(hit).toMatchObject({ dragonTempHp: 0, dragonHpLost: 3 })
        expect(damageDragon(c, 500, 36).dragonHpLost).toBe(36)
        expect(healDragon({ ...c, dragonHpLost: 10 }, 4).dragonHpLost).toBe(6)
        expect(healDragon({ ...c, dragonHpLost: 2 }, 50).dragonHpLost).toBe(0)
    })

    it("Dragon's Defiance leaves 1 HP and temp HP; reviving gives half", () => {
        const down = { ...trainer(13), dragonHpLost: 84 }
        expect(dragonDefiance(down, 84, 13)).toMatchObject({ dragonHpLost: 83, dragonTempHp: 13 })
        expect(reviveDragon({ ...trainer(10), dragonDead: true, dragonHpLost: 66 }, 66)).toMatchObject({ dragonDead: false, dragonHpLost: 33 })
    })
})

describe('Dragon Trainer class', () => {
    it('has Breath and Training Dice pools that follow the Features table', () => {
        const at = (level: number) => Object.fromEntries(getResources(trainer(level), realContent).map((item) => [item.id, item.max]))
        expect(at(1)['dragon-trainer:breath-uses']).toBeUndefined()
        expect(at(2)).toMatchObject({ 'dragon-trainer:breath-uses': 1, 'dragon-trainer:training-dice': 4 })
        expect(at(6)['dragon-trainer:training-dice']).toBe(5)
        expect(at(14)['dragon-trainer:training-dice']).toBe(6)
        expect(at(17)['dragon-trainer:breath-uses']).toBe(4)
    })

    it('Dragon Techniques are limited by the table and by Dragon Trainer level', () => {
        const levels = classLevelsOf(trainer(2), characterClasses)
        expect(limitStatus(trainer(2), levels, realContent.techniques).find((item) => item.limit.id === 'dragon')?.max).toBe(3)
        const diving = dragonTechniques.find((item) => item.id === 'dragon-diving-assault')!
        expect(learnBlocker(trainer(5), diving, classLevelsOf(trainer(5), characterClasses), realContent.techniques)).toMatch(/level 10/)
        expect(learnBlocker(trainer(10), diving, classLevelsOf(trainer(10), characterClasses), realContent.techniques)).toBeNull()
    })

    it('Dragon Knight adds heavy armor, shields and martial weapons; the class adds light and medium armor', () => {
        expect(classProficiencies(trainer(2), realContent)).toEqual({ armor: ['Light Armor', 'Medium Armor'], weapons: ['Simple Weapons'] })
        const knight = classProficiencies(trainer(3, { subclassId: 'dragon-knight' }), realContent)
        expect(knight.armor).toEqual(['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields'])
        expect(knight.weapons).toEqual(['Simple Weapons', 'Martial Weapons'])
    })

    it('Dragon Mage gains technique slots and a limit of the dragon element', () => {
        const mage = trainer(7, { subclassId: 'dragon-mage', dragonAncestry: 'tide' })
        const slots = Object.fromEntries(getResources(mage, realContent).filter((item) => item.kind === 'slot').map((item) => [item.slotLevel, item.max]))
        expect(slots).toEqual({ Practiced: 4, Trained: 2 })
        const limits = subclassLimits(mage, realContent.subclasses)
        expect(limits).toHaveLength(1)
        expect(limits[0].limit.kinds).toEqual(['Water'])
        expect(limits[0].limit.maxByLevel[6]).toBe(5)
        expect(subclassLimits({ ...mage, dragonAncestry: '' }, realContent.subclasses)).toEqual([])
    })

    it('a Dragon Trainer sheet shows the companion and its proficiencies', () => {
        const sheet = computeSheet(trainer(5, { subclassId: 'dragon-knight', lineageId: 'earth-kingdom-human' }), realContent)
        expect(sheet.dragon?.maxHp).toBe(36)
        expect(sheet.armorProficiencies).toContain('Heavy Armor')
    })
})

describe('slot sources', () => {
    it('lists each class and a Dragon Mage subclass separately', () => {
        const mage = trainer(7, { subclassId: 'dragon-mage', dragonAncestry: 'ember' })
        const sources = slotSources(mage, classLevelsOf(mage, characterClasses), realContent.subclasses)
        expect(sources).toEqual([{ label: 'Dragon Mage', practiced: 4, trained: 2, mastered: 0 }])
        expect(slotSources(trainer(7), classLevelsOf(trainer(7), characterClasses), realContent.subclasses)).toEqual([])
    })
})
