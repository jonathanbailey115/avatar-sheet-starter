import { describe, expect, it } from 'vitest'
import { characterClasses, characterSubclasses } from '../data'
import { COMBAT_EXPERTISE_POINTS } from '../data/benderTable'
import { realContent } from '../lib/testFixtures'
import { createBlankCharacter } from '../lib/character'
import type { Character, ExtraClass } from '../types/schema'
import { getProficiencyBonus } from './abilities'
import { getGrantedFeatures } from './features'
import { computeMaxHp } from './hitPoints'
import { getResources } from './resources'
import { learnBlocker, limitStatus } from './techniques'
import {
    boonSlots,
    fitLevels,
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
        expect(classSummary(character(), characterClasses)).toBe('Earthbending')
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

describe('fitLevels', () => {
    const fit = (overrides: Partial<Character>) => {
        const result = fitLevels({ ...character(), ...overrides })
        return { level: result.level, extras: result.extraClasses.map((item) => item.level) }
    }

    it('keeps total level 1-20 without the cap lift, shaving the last extra class first', () => {
        expect(fit({ level: 25 })).toEqual({ level: 20, extras: [] })
        expect(fit({ level: 20, extraClasses: [extra({ level: 15 }), extra({ id: 'x2', level: 10 })] })).toEqual({ level: 20, extras: [15, 4] })
        expect(fit({ level: 10, extraClasses: [extra({ level: 15 })] })).toEqual({ level: 10, extras: [9] })
        expect(fit({ level: 0 })).toEqual({ level: 1, extras: [] })
    })

    it('with the lift, each class goes up to 20 and the total follows', () => {
        expect(fit({ levelCapLifted: true, level: 35, extraClasses: [extra({ level: 20 })] })).toEqual({ level: 35, extras: [20] })
        expect(fit({ levelCapLifted: true, level: 70, extraClasses: [extra({ level: 20 })] })).toEqual({ level: 40, extras: [20] })
        expect(fit({ levelCapLifted: true, level: 10, extraClasses: [extra({ level: 20 })] })).toEqual({ level: 21, extras: [20] })
    })

    it('extra classes need a first class', () => {
        expect(fit({ classId: '', level: 5, extraClasses: [extra({ level: 3 })] })).toEqual({ level: 5, extras: [] })
    })
})

describe('what each class gives a multiclass character', () => {
    const multi = character({ level: 8, strength: 14, extraClasses: [extra({ classId: 'weaponsmaster', level: 3 })] })
    const ids = getGrantedFeatures(multi, realContent).map((item) => item.feature.id)

    it('each class gives features up to its own level, not the total level', () => {
        // Earthbending 5: Extra Attack at 5. Weaponsmaster 3: Action Surge at 3, but not its Extra Attack at 5.
        expect(ids).toContain('class-earthbending-extra-attack')
        expect(ids).toContain('class-weaponsmaster-action-surge')
        expect(ids).not.toContain('class-weaponsmaster-extra-attack')
        expect(ids).not.toContain('class-earthbending-rare-techniques')
    })

    it('technique slots come from the bending class level and pools from each class level', () => {
        const resources = getResources(multi, realContent)
        const slots = resources.filter((item) => item.kind === 'slot')
        expect(slots.length).toBeGreaterThan(0)
        expect(slots.every((item) => item.origin === 'Earthbending')).toBe(true)
        const earthRow = characterClasses.find((item) => item.id === 'earthbending')!.techniqueSlots![4]
        expect(resources.find((item) => item.id === 'slots:Practiced')?.max).toBe(earthRow.practiced)
        expect(resources.find((item) => item.id === 'weaponsmaster:combat-expertise')?.max).toBe(COMBAT_EXPERTISE_POINTS[2])
    })

    it('technique limits add up across classes and rare techniques follow the bending class level', () => {
        const levels = classLevelsOf(multi, characterClasses)
        const kinds = limitStatus(multi, levels, realContent.techniques).map((item) => item.limit.id)
        expect(kinds).toEqual(['known', 'universal', 'fighting'])
        const rare = realContent.techniques.find((item) => item.rare && item.element === 'Earth' && !item.prerequisite)!
        expect(learnBlocker(multi, rare, levels, realContent.techniques)).toMatch(/level 8/)
    })
})

describe('the Avatar', () => {
    const avatar = (overrides: Partial<Character> = {}) =>
        character({
            classId: 'avatar',
            subclassId: undefined,
            level: 6,
            wisdom: 16,
            constitution: 14,
            charisma: 14,
            strength: 14,
            extraClasses: [extra({ classId: 'earthbending', level: 1 }), extra({ id: 'x2', classId: 'waterbending', level: 1 })],
            ...overrides,
        })
    const warn = (c: Character) => multiclassWarnings(c, characterClasses, characterSubclasses)

    it('starting with every element needs no masters', () => {
        expect(warn(avatar({ avatarAllElements: true }))).toEqual([])
    })

    it('otherwise each new element needs a master and approval', () => {
        const notes = warn(avatar()).join(' ')
        expect(notes).toContain('learns a new element from a master')
        expect(notes).toContain('approve this element')
        const ready = avatar({
            extraClasses: [
                extra({ classId: 'earthbending', level: 1, master: 'Master Bei', gmApproved: true }),
                extra({ id: 'x2', classId: 'waterbending', level: 1, master: 'Master Pakku', gmApproved: true }),
            ],
        })
        expect(warn(ready)).toEqual([])
    })

    it('technique slots add up across the bending classes it has', () => {
        const c = avatar({ level: 12, extraClasses: [extra({ classId: 'earthbending', level: 5 }), extra({ id: 'x2', classId: 'waterbending', level: 5 })] })
        const slots = getResources(c, realContent).find((item) => item.id === 'slots:Practiced')
        const earth = characterClasses.find((item) => item.id === 'earthbending')!.techniqueSlots![4].practiced
        const water = characterClasses.find((item) => item.id === 'waterbending')!.techniqueSlots![4].practiced
        expect(slots?.max).toBe(earth + water)
        expect(slots?.origin).toBe('Earthbending + Waterbending')
    })

    it('Avatar State and Past Life Guidance are pools that follow level', () => {
        const at = (level: number) => Object.fromEntries(getResources(avatar({ level, extraClasses: [] }), realContent).map((item) => [item.id, item.max]))
        expect(at(1)).toEqual({ 'avatar:past-lives': 2 })
        expect(at(8)).toMatchObject({ 'avatar:past-lives': 3, 'avatar:avatar-state': 1 })
        expect(at(17)['avatar:avatar-state']).toBe(2)
    })
})
