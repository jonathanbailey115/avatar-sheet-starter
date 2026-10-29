import { describe, expect, it } from 'vitest'
import { characterClasses, characterSubclasses } from '../data'
import { createBlankCharacter } from '../lib/character'
import type { Character, ExtraClass } from '../types/schema'
import { getProficiencyBonus } from './abilities'
import { computeMaxHp } from './hitPoints'
import {
    boonSlots,
    classEntries,
    classLevelsOf,
    classSummary,
    levelInClass,
    maxTotalLevel,
    multiclassWarnings,
    primaryLevelOf,
} from './classLevels'

const extra = (overrides: Partial<ExtraClass>): ExtraClass => ({
    id: 'x1',
    classId: 'weaponsmaster',
    level: 2,
    master: '',
    gmApproved: false,
    ...overrides,
})

const character = (overrides: Partial<Character> = {}): Character => ({
    ...createBlankCharacter(),
    species: 'none',
    classId: 'earthbending',
    subclassId: 'tradition-of-earthbending',
    level: 8,
    constitution: 14,
    ...overrides,
})

describe('class entries', () => {
    it('the first class gets the levels the extra classes do not use', () => {
        const c = character({ level: 8, extraClasses: [extra({ level: 3 })] })
        expect(primaryLevelOf(c)).toBe(5)
        expect(classEntries(c).map((entry) => [entry.classId, entry.level])).toEqual([
            ['earthbending', 5],
            ['weaponsmaster', 3],
        ])
    })

    it('a character with no extra classes has one entry at the total level', () => {
        expect(classEntries(character({ level: 7 })).map((entry) => entry.level)).toEqual([7])
        expect(classEntries(character({ classId: '' }))).toEqual([])
    })

    it('an own-class second subclass counts at the most levels in either subclass (gmbinder)', () => {
        const same = character({
            level: 8,
            extraClasses: [extra({ classId: 'earthbending', subclassId: 'other', level: 3, master: 'Master Yu', gmApproved: true })],
        })
        const levels = classLevelsOf(same, characterClasses)
        expect(levelInClass(levels, 'earthbending')).toBe(5)

        const swapped = character({
            level: 13,
            extraClasses: [extra({ classId: 'earthbending', subclassId: 'other', level: 8 })],
        })
        expect(levelInClass(classLevelsOf(swapped, characterClasses), 'earthbending')).toBe(8)
    })

    it('summarises the classes', () => {
        const c = character({ level: 8, extraClasses: [extra({ level: 3 })] })
        expect(classSummary(c, characterClasses)).toBe('Earthbending 5 / Weaponsmaster 3')
        expect(classSummary(character({ classId: '' }), characterClasses)).toBe('No class')
    })
})

describe('level cap', () => {
    it('is 20 total, or 20 per class entry when the GM lifts it', () => {
        expect(maxTotalLevel(character())).toBe(20)
        expect(maxTotalLevel(character({ levelCapLifted: true }))).toBe(20)
        expect(maxTotalLevel(character({ levelCapLifted: true, extraClasses: [extra({}), extra({ id: 'x2' })] }))).toBe(60)
    })

    it('one Epic Boon for each class at level 20', () => {
        const c = character({ level: 40, levelCapLifted: true, extraClasses: [extra({ level: 20 })] })
        expect(boonSlots(c, characterClasses)).toBe(2)
        expect(boonSlots(character({ level: 20 }), characterClasses)).toBe(1)
        expect(boonSlots(character({ level: 19 }), characterClasses)).toBe(0)
    })
})

describe('proficiency bonus and hit points past level 20', () => {
    it('grows by 1 for every 8 levels above 20', () => {
        expect([1, 4, 5, 9, 13, 17, 20].map(getProficiencyBonus)).toEqual([2, 2, 3, 4, 5, 6, 6])
        expect([21, 27, 28, 35, 36, 44].map(getProficiencyBonus)).toEqual([6, 6, 7, 7, 8, 9])
    })

    it('each level above 20 adds a quarter of the normal gain, at least 1', () => {
        // d12: average 7 + Con 2 = 9 a level; level 1 is 12 + 2.
        const at20 = computeMaxHp({ ...character({ level: 20 }) }, 12)
        expect(at20).toBe(14 + 19 * 9)
        // A quarter of 9, rounded down, is 2.
        expect(computeMaxHp({ ...character({ level: 21 }) }, 12)).toBe(at20 + 2)
        expect(computeMaxHp({ ...character({ level: 24 }) }, 12)).toBe(at20 + 8)
        // A terrible Constitution still adds 1.
        expect(computeMaxHp({ ...character({ level: 22, constitution: 1 }) }, 6)).toBe(
            computeMaxHp({ ...character({ level: 20, constitution: 1 }) }, 6) + 2,
        )
    })
})

describe('multiclass warnings (never blocking)', () => {
    const warn = (c: Character) => multiclassWarnings(c, characterClasses, characterSubclasses)

    it('a plain non-bender multiclass with the ability score has no warnings', () => {
        const c = character({ strength: 14, extraClasses: [extra({ classId: 'weaponsmaster' })] })
        expect(warn(c)).toEqual([])
    })

    it('warns when the ability score is too low', () => {
        const c = character({ strength: 10, dexterity: 10, extraClasses: [extra({ classId: 'weaponsmaster' })] })
        expect(warn(c).join(' ')).toContain('Strength or Dexterity 13')
    })

    it('a non-bender taking a bending class needs GM approval until approved', () => {
        const c = character({ classId: 'weaponsmaster', subclassId: undefined, constitution: 14, extraClasses: [extra({ classId: 'earthbending' })] })
        expect(warn(c).join(' ')).toContain("non-benders can't take bending classes")
        const approved = { ...c, extraClasses: [extra({ classId: 'earthbending', gmApproved: true })] }
        expect(warn(approved).join(' ')).not.toContain("non-benders")
    })

    it('a bender taking a different element needs GM approval', () => {
        const c = character({ charisma: 14, extraClasses: [extra({ classId: 'waterbending' })] })
        expect(warn(c).join(' ')).toContain("different element")
    })

    it('an own-class second subclass needs a master and approval', () => {
        const c = character({ constitution: 14, extraClasses: [extra({ classId: 'earthbending', subclassId: 'other' })] })
        const notes = warn(c).join(' ')
        expect(notes).toContain('needs a master')
        expect(notes).toContain('approve')
        const ready = character({
            constitution: 14,
            extraClasses: [extra({ classId: 'earthbending', subclassId: 'other', master: 'Master Yu', gmApproved: true })],
        })
        expect(warn(ready)).toEqual([])
    })
})
