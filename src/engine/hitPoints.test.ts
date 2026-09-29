import { describe, expect, it } from 'vitest'
import { lineages } from '../data'
import { createBlankCharacter } from '../lib/character'
import {
    applyDamage,
    applyHealing,
    averageHitDieRoll,
    computeMaxHp,
    getCurrentHp,
    getHitDie,
    getLifeState,
    recordDeathSave,
    reviveWithOneHp,
    setTempHp,
} from './hitPoints'

const base = () => ({ ...createBlankCharacter(), constitution: 14 }) // +2 Con

describe('max HP (gmbinder lineage hit dice)', () => {
    it('Earth Kingdom: level 1 is 12 + Con', () => {
        const c = { ...base(), lineageId: 'earth-kingdom-human' }
        expect(getHitDie(c, lineages)).toBe(12)
        expect(computeMaxHp(c, 12)).toBe(14)
    })

    it('each later level adds the average (die/2 + 1) + Con by default', () => {
        expect(averageHitDieRoll(12)).toBe(7)
        expect(computeMaxHp({ ...base(), level: 3 }, 12)).toBe(14 + 9 + 9)
    })

    it('uses a recorded roll for that level', () => {
        // level 2 rolled 12, level 3 uses the average
        expect(computeMaxHp({ ...base(), level: 3, hpRolls: [12, null] }, 12)).toBe(14 + 14 + 9)
    })

    it('other lineages use their own die: Water d10, Fire d8, Air d6', () => {
        const dice = Object.fromEntries(lineages.map((l) => [l.name, l.hitDie]))
        expect(dice).toMatchObject({
            'Water Tribe': 10,
            'Earth Kingdom': 12,
            'Fire Nation': 8,
            'Air Nomads': 6,
        })
    })

    it('a level never adds less than 1 HP, even with a terrible Con', () => {
        const c = { ...createBlankCharacter(), constitution: 1, level: 2 } // -5
        expect(computeMaxHp(c, 6)).toBe(1 + 1)
    })

    it('applies a manual adjustment and an override', () => {
        expect(computeMaxHp({ ...base(), maxHpAdjustment: 4 }, 12)).toBe(18)
        expect(computeMaxHp({ ...base(), maxHpOverride: 30 }, null)).toBe(30)
    })

    it('is 0 (unknown) with no lineage', () => {
        expect(computeMaxHp(base(), null)).toBe(0)
    })
})

describe('damage', () => {
    const c = base()

    it('reduces current HP', () => {
        expect(getCurrentHp(applyDamage(c, 5, 14), 14)).toBe(9)
    })

    it('temp HP absorbs first', () => {
        const hurt = applyDamage({ ...c, tempHp: 4 }, 6, 14)
        expect(hurt.tempHp).toBe(0)
        expect(getCurrentHp(hurt, 14)).toBe(12)
    })

    it('damage fully absorbed by temp HP leaves HP untouched', () => {
        const hurt = applyDamage({ ...c, tempHp: 10 }, 6, 14)
        expect(hurt.tempHp).toBe(4)
        expect(hurt.hpLost).toBe(0)
    })

    it('stops at 0, not below', () => {
        const down = applyDamage(c, 20, 14)
        expect(getCurrentHp(down, 14)).toBe(0)
        expect(getLifeState(down, 14)).toBe('dying')
    })

    it('massive damage (overflow >= max HP) kills outright', () => {
        expect(getLifeState(applyDamage(c, 14 + 14, 14), 14)).toBe('dead')
        expect(getLifeState(applyDamage(c, 14 + 13, 14), 14)).toBe('dying')
    })

    it('damage at 0 is a death save failure; a crit counts as two', () => {
        const down = applyDamage(c, 20, 14)
        expect(applyDamage(down, 3, 14).deathSaves.failures).toBe(1)
        const crit = applyDamage(down, 3, 14, { critical: true })
        expect(crit.deathSaves.failures).toBe(2)
        expect(getLifeState(applyDamage(crit, 3, 14), 14)).toBe('dead')
    })

    it('ignores zero, negative and damage to the dead', () => {
        expect(applyDamage(c, 0, 14)).toBe(c)
        expect(applyDamage(c, -3, 14)).toBe(c)
        const dead = { ...c, hpLost: 14, deathSaves: { successes: 0, failures: 3 } }
        expect(applyDamage(dead, 5, 14)).toBe(dead)
    })
})

describe('healing', () => {
    it('cannot exceed max HP', () => {
        const hurt = applyDamage(base(), 5, 14)
        expect(getCurrentHp(applyHealing(hurt, 99, 14), 14)).toBe(14)
    })

    it('getting up from 0 clears death saves', () => {
        const down = applyDamage(base(), 20, 14)
        const hit = applyDamage(down, 1, 14)
        const healed = applyHealing(hit, 3, 14)
        expect(getCurrentHp(healed, 14)).toBe(3)
        expect(healed.deathSaves).toEqual({ successes: 0, failures: 0 })
    })

    it('does not raise the dead (gmbinder: no mortal resurrection)', () => {
        const dead = { ...base(), hpLost: 14, deathSaves: { successes: 0, failures: 3 } }
        expect(applyHealing(dead, 10, 14)).toBe(dead)
    })
})

describe('temp HP and death saves', () => {
    it('temp HP does not stack unless replaced', () => {
        const c = { ...base(), tempHp: 5 }
        expect(setTempHp(c, 3).tempHp).toBe(5)
        expect(setTempHp(c, 8).tempHp).toBe(8)
        expect(setTempHp(c, 3, 'replace').tempHp).toBe(3)
    })

    it('three successes stabilize, three failures kill', () => {
        let c = applyDamage(base(), 20, 14)
        for (let i = 0; i < 3; i += 1) c = recordDeathSave(c, 'success', 14)
        expect(getLifeState(c, 14)).toBe('stable')

        let d = applyDamage(base(), 20, 14)
        for (let i = 0; i < 3; i += 1) d = recordDeathSave(d, 'failure', 14)
        expect(getLifeState(d, 14)).toBe('dead')
    })

    it('death saves only count while dying', () => {
        const up = base()
        expect(recordDeathSave(up, 'failure', 14)).toBe(up)
    })

    it('a natural 20 brings you back with 1 HP', () => {
        const back = reviveWithOneHp(applyDamage(base(), 20, 14), 14)
        expect(getCurrentHp(back, 14)).toBe(1)
        expect(getLifeState(back, 14)).toBe('conscious')
    })
})
