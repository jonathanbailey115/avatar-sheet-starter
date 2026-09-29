import { describe, expect, it } from 'vitest'
import { DEFAULT_TRAINING } from '../types/schema'
import type { KnownTechnique } from '../types/schema'
import {
    canStartTraining,
    masteredCount,
    resolveMasteryCheck,
    resolveTrainingCheck,
    startTraining,
    stopTraining,
    trainingSlotsUsed,
} from './training'

const practiced = (points = 0, dc = 15): KnownTechnique => ({
    techniqueId: 'earth-tremors',
    level: 'Practiced',
    training: { active: true, points, dc, masteryDc: 25 },
})
const trained = (masteryDc = 25, active = true): KnownTechnique => ({
    techniqueId: 'earth-tremors',
    level: 'Trained',
    training: { active, points: 0, dc: 15, masteryDc },
})

describe('training checks (DC 15, 5 Training Points)', () => {
    it('a success earns 1 point', () => {
        const result = resolveTrainingCheck(practiced(), 12, 16)
        expect(result).toMatchObject({ outcome: 'success', gained: 1, leveledUp: false })
        expect(result.known.training.points).toBe(1)
    })

    it('a natural 20 earns 2 points', () => {
        expect(resolveTrainingCheck(practiced(), 20, 22).gained).toBe(2)
    })

    it('a failure earns nothing and lowers the DC by 1', () => {
        const result = resolveTrainingCheck(practiced(0, 15), 4, 8)
        expect(result).toMatchObject({ outcome: 'failure', gained: 0 })
        expect(result.known.training.dc).toBe(14)
    })

    it('keeps lowering the DC on repeated failures', () => {
        let known = practiced()
        for (let i = 0; i < 3; i += 1) known = resolveTrainingCheck(known, 3, 5).known
        expect(known.training.dc).toBe(12)
    })

    it('the DC returns to 15 after a success', () => {
        const result = resolveTrainingCheck(practiced(1, 12), 15, 15)
        expect(result.known.training.dc).toBe(15)
    })

    it('the DC never drops below 1', () => {
        expect(resolveTrainingCheck(practiced(0, 1), 1, 0).known.training.dc).toBe(1)
    })

    it('the 5th point raises the technique to Trained and frees the training slot', () => {
        const result = resolveTrainingCheck(practiced(4), 10, 18)
        expect(result).toMatchObject({ leveledUp: true, outcome: 'success' })
        expect(result.known.level).toBe('Trained')
        expect(result.known.training).toEqual(DEFAULT_TRAINING)
    })

    it('a natural 20 at 4 points also levels up (5+ points)', () => {
        expect(resolveTrainingCheck(practiced(4), 20, 25).known.level).toBe('Trained')
    })

    it('ignores techniques that are not being trained or are not Practiced', () => {
        const idle = { ...practiced(), training: { ...DEFAULT_TRAINING } }
        expect(resolveTrainingCheck(idle, 15, 20).outcome).toBe('ignored')
        expect(resolveTrainingCheck(trained(), 15, 20).outcome).toBe('ignored')
    })
})

describe('training slots', () => {
    const list = (...items: KnownTechnique[]) => ({ knownTechniques: items })

    it('at most 2 techniques can be trained at once', () => {
        const two = list(practiced(), { ...practiced(), techniqueId: 'earth-shatter' }, {
            techniqueId: 'earth-snare', level: 'Practiced', training: { ...DEFAULT_TRAINING },
        })
        expect(trainingSlotsUsed(two)).toBe(2)
        expect(canStartTraining(two, two.knownTechniques[2])).toMatch(/Only 2/)
    })

    it('starting fresh, and stopping loses the progress', () => {
        const idle: KnownTechnique = { techniqueId: 'x', level: 'Practiced', training: { ...DEFAULT_TRAINING } }
        expect(startTraining(idle).training.active).toBe(true)
        expect(stopTraining(practiced(3, 12)).training).toEqual(DEFAULT_TRAINING)
    })

    it('cannot train a Mastered technique', () => {
        const mastered: KnownTechnique = { techniqueId: 'x', level: 'Mastered', training: { ...DEFAULT_TRAINING } }
        expect(canStartTraining(list(mastered), mastered)).toBe('Already Mastered')
    })
})

describe('mastery (DC 25, needs a master)', () => {
    it('succeeds at DC 25 and becomes Mastered', () => {
        const result = resolveMasteryCheck({ knownTechniques: [trained()] }, trained(), 25)
        expect(result.outcome).toBe('mastered')
        expect(result.known.level).toBe('Mastered')
    })

    it('a failure lowers the mastery DC by 1', () => {
        const result = resolveMasteryCheck({ knownTechniques: [trained()] }, trained(), 20)
        expect(result.outcome).toBe('failure')
        expect(result.known.training.masteryDc).toBe(24)
    })

    it('a lowered DC can then succeed', () => {
        expect(resolveMasteryCheck({ knownTechniques: [trained(24)] }, trained(24), 24).outcome).toBe('mastered')
    })

    it('needs the training to be active and the technique Trained', () => {
        expect(resolveMasteryCheck({ knownTechniques: [] }, trained(25, false), 30).outcome).toBe('ignored')
        expect(resolveMasteryCheck({ knownTechniques: [] }, practiced(), 30).outcome).toBe('ignored')
    })

    it('benders may master at most 6 techniques', () => {
        const six = Array.from({ length: 6 }, (_, i): KnownTechnique => ({
            techniqueId: `m${i}`, level: 'Mastered', training: { ...DEFAULT_TRAINING },
        }))
        expect(masteredCount({ knownTechniques: six })).toBe(6)
        expect(resolveMasteryCheck({ knownTechniques: six }, trained(), 30).outcome).toBe('capped')
    })
})
