import { describe, expect, it } from 'vitest'
import { techniques } from '../data'
import { createBlankCharacter } from '../lib/character'
import { realContent } from '../lib/testFixtures'
import { DEFAULT_TRAINING } from '../types/schema'
import type { KnownTechnique } from '../types/schema'
import {
    addDice,
    castLevels,
    damageDiceAt,
    damageOptions,
    learnBlocker,
    limitStatus,
    parsePrerequisite,
    saveSummary,
    textAtLevel,
} from './techniques'

const byId = (id: string) => techniques.find((technique) => technique.id === id)!
const known = (techniqueId: string, level: KnownTechnique['level'] = 'Practiced'): KnownTechnique => ({
    techniqueId,
    level,
    training: DEFAULT_TRAINING,
})
const earthbender = (level: number, knownTechniques: KnownTechnique[] = []) => ({
    ...createBlankCharacter(),
    classId: 'earthbending',
    level,
    knownTechniques,
})
const earthClass = realContent.classes.find((c) => c.id === 'earthbending')
const weaponsmasterClass = realContent.classes.find((c) => c.id === 'weaponsmaster')

describe('damage by level (from each technique\'s own "above Practiced" text)', () => {
    it('Tremors: 3d8, +1d8 per level above Practiced, half on a save', () => {
        const damage = byId('earth-tremors').damage![0]
        expect(damageDiceAt(damage, 'Practiced')).toBe('3d8')
        expect(damageDiceAt(damage, 'Trained')).toBe('4d8')
        expect(damageDiceAt(damage, 'Mastered')).toBe('5d8')
        expect(damage.onSave).toBe('half')
    })

    it('Shatter: 3d10 piercing, +1d10 per level', () => {
        const damage = byId('earth-shatter').damage![0]
        expect([damageDiceAt(damage, 'Practiced'), damageDiceAt(damage, 'Mastered')]).toEqual(['3d10', '5d10'])
    })

    it('Land of Spikes: 6d6 +1d6 per level; Meteor Fall 5d10 +1d10 per level', () => {
        expect(damageDiceAt(byId('earth-land-of-spikes').damage![0], 'Trained')).toBe('7d6')
        expect(damageDiceAt(byId('earth-meteor-fall').damage![0], 'Mastered')).toBe('7d10')
    })

    it('Earth Smash negates 1d6 / 2d6 / 4d6 plus the bending modifier', () => {
        const options = (level: 'Practiced' | 'Trained' | 'Mastered') =>
            damageOptions(byId('earth-earth-smash'), level, 2).map((option) => option.formula)
        expect(options('Practiced')).toEqual(['1d6+2'])
        expect(options('Trained')).toEqual(['2d6+2'])
        expect(options('Mastered')).toEqual(['4d6+2'])
    })

    it('a damage entry that only exists at Mastered is not offered lower (Tectonic Rift)', () => {
        expect(damageOptions(byId('earth-tectonic-rift'), 'Trained', 0)).toEqual([])
        expect(damageOptions(byId('earth-tectonic-rift'), 'Mastered', 0)[0].formula).toBe('5d6')
    })

    it('techniques without mechanics have no damage', () => {
        expect(damageOptions(byId('earth-earth-hand'), 'Mastered', 3)).toEqual([])
    })

    it('adds dice of the same size and joins different sizes', () => {
        expect(addDice('3d8', '1d8', 2)).toBe('5d8')
        expect(addDice('2d6', '1d4', 1)).toBe('2d6+1d4')
    })
})

describe('saves', () => {
    it('Earth affinity save names Constitution for earthbenders and the text\'s fallback for others', () => {
        expect(saveSummary(byId('earth-eat-dirt'))).toBe('Constitution (earthbenders), Strength (others)')
        expect(saveSummary(byId('earth-quicksand'))).toBe('Constitution (earthbenders), Strength (others)')
    })

    it('when the text gives no fallback the GM decides', () => {
        expect(saveSummary(byId('earth-tremors'))).toMatch(/GM decides/)
    })

    it('fixed saves are named directly', () => {
        expect(saveSummary(byId('earth-shatter'))).toBe('Dexterity')
        expect(saveSummary(byId('universal-fear'))).toBe('Wisdom')
    })

    it('no save, no summary', () => {
        expect(saveSummary(byId('earth-earth-hand'))).toBeNull()
    })
})

describe('levels and text', () => {
    it('a technique can be cast at its known level or higher, never lower', () => {
        expect(castLevels('Practiced')).toEqual(['Practiced', 'Trained', 'Mastered'])
        expect(castLevels('Trained')).toEqual(['Trained', 'Mastered'])
        expect(castLevels('Mastered')).toEqual(['Mastered'])
    })

    it('fighting techniques have their own text per level', () => {
        const archer = byId('fighting-archer')
        expect(textAtLevel(archer, 'Practiced')).toMatch(/\+1/)
        expect(textAtLevel(archer, 'Trained')).toMatch(/Technique Bonus/)
    })
})

describe('prerequisites and limits', () => {
    it('reads "Trained Tremors" as Tremors at Trained or better', () => {
        expect(parsePrerequisite(byId('earth-earthquake'), techniques)).toEqual({
            techniqueId: 'earth-tremors',
            minLevel: 'Trained',
        })
    })

    it('Earthquake needs Trained Tremors and level 8 (rare)', () => {
        const quake = byId('earth-earthquake')
        expect(learnBlocker(earthbender(5), quake, earthClass, techniques)).toMatch(/level 8/)
        expect(learnBlocker(earthbender(8, [known('earth-tremors')]), quake, earthClass, techniques)).toMatch(/Trained Tremors/)
        expect(learnBlocker(earthbender(8, [known('earth-tremors', 'Trained')]), quake, earthClass, techniques)).toBeNull()
    })

    it('a level 1 bender knows 2 techniques (Benders table)', () => {
        const status = limitStatus(earthbender(1), earthClass, techniques)
        expect(status).toHaveLength(1)
        expect(status[0].max).toBe(2)
    })

    it('blocks learning once the limit is reached, counting Universal techniques too', () => {
        const full = earthbender(1, [known('earth-tremors'), known('universal-fear')])
        expect(learnBlocker(full, byId('earth-shatter'), earthClass, techniques)).toMatch(/full \(2\/2\)/)
    })

    it('does not offer a technique twice', () => {
        expect(learnBlocker(earthbender(3, [known('earth-tremors')]), byId('earth-tremors'), earthClass, techniques)).toBe('Already known')
    })

    it('Weaponsmaster: 2 Universal (3 at 6th, 4 at 13th) and a Fighting technique every 3 levels', () => {
        const at = (level: number) => limitStatus({ level, knownTechniques: [] }, weaponsmasterClass, techniques).map((s) => s.max)
        expect(at(1)).toEqual([2, 1])
        expect(at(5)).toEqual([2, 2])
        expect(at(6)).toEqual([3, 2])
        expect(at(13)).toEqual([4, 5])
        expect(at(19)).toEqual([4, 7])
    })
})
