import { describe, expect, it } from 'vitest'
import { createBlankCharacter } from '../lib/character'
import { realContent } from '../lib/testFixtures'
import { applyDamage, getCurrentHp } from './hitPoints'
import { getResources, remainingOf, spendResource } from './resources'
import { hitDiceRemaining, longRest, shortRest } from './rests'
import { computeSheet } from './sheet'

// Earth Kingdom Weaponsmaster, level 5, Con 14 (+2): d12 hit die
const hero = () => ({
    ...createBlankCharacter(),
    lineageId: 'earth-kingdom-human',
    classId: 'weaponsmaster',
    level: 5,
    constitution: 14,
})

const maxHp = (c: ReturnType<typeof hero>) => computeSheet(c, realContent).maxHp
const pool = (c: ReturnType<typeof hero>, name: string) =>
    getResources(c, realContent).find((def) => def.name === name)!

describe('short rest', () => {
    it('spends hit dice: roll + Con each, capped at what is left', () => {
        const hurt = applyDamage(hero(), 20, maxHp(hero()))
        const rng = () => 0.5 // d12 -> 7
        const result = shortRest(hurt, realContent, { spendHitDice: 2, rng })

        expect(result.rolls).toEqual([7, 7])
        expect(result.healed).toBe(18)
        expect(result.character.hitDiceUsed).toBe(2)
        expect(hitDiceRemaining(result.character)).toBe(3)
        expect(getCurrentHp(result.character, maxHp(hero()))).toBe(getCurrentHp(hurt, maxHp(hero())) + 18)
    })

    it('cannot spend more hit dice than remain', () => {
        const tired = { ...hero(), hitDiceUsed: 4 }
        const result = shortRest(tired, realContent, { spendHitDice: 5, rng: () => 0.5 })
        expect(result.rolls).toHaveLength(1)
    })

    it('never heals above max HP', () => {
        const scratched = applyDamage(hero(), 1, maxHp(hero()))
        const result = shortRest(scratched, realContent, { spendHitDice: 3, rng: () => 0.99 })
        expect(getCurrentHp(result.character, maxHp(hero()))).toBe(maxHp(hero()))
    })

    it('a negative Con modifier heals 0, not negative', () => {
        const frail = { ...hero(), constitution: 1 }
        const hurt = applyDamage(frail, 3, maxHp(frail))
        const result = shortRest(hurt, realContent, { spendHitDice: 1, rng: () => 0 }) // roll 1, Con -5
        expect(result.healed).toBe(0)
    })

    it('restores Action Surge but not Combat Expertise Points', () => {
        let c = hero()
        c = spendResource(c, pool(c, 'Action Surge'))
        c = spendResource(c, pool(c, 'Combat Expertise Points'), 2)
        const rested = shortRest(c, realContent, { spendHitDice: 0 }).character
        expect(remainingOf(rested, pool(rested, 'Action Surge'))).toBe(1)
        expect(remainingOf(rested, pool(rested, 'Combat Expertise Points'))).toBe(0)
    })

    it('does nothing for a lineage-less character (no hit die)', () => {
        const c = { ...createBlankCharacter(), level: 3 }
        expect(shortRest(c, realContent, { spendHitDice: 2 }).rolls).toEqual([])
    })
})

describe('long rest', () => {
    it('restores HP, clears temp HP and death saves', () => {
        const down = { ...applyDamage(hero(), 200, maxHp(hero())), tempHp: 5 }
        const rested = longRest({ ...down, deathSaves: { successes: 1, failures: 2 } }, realContent)
        expect(rested.hpLost).toBe(0)
        expect(rested.tempHp).toBe(0)
        expect(rested.deathSaves).toEqual({ successes: 0, failures: 0 })
    })

    it('regains half your hit dice (minimum 1)', () => {
        expect(longRest({ ...hero(), hitDiceUsed: 5 }, realContent).hitDiceUsed).toBe(3)
        expect(longRest({ ...hero(), level: 1, hitDiceUsed: 1 }, realContent).hitDiceUsed).toBe(0)
    })

    it('reduces exhaustion by 1', () => {
        expect(longRest({ ...hero(), exhaustion: 3 }, realContent).exhaustion).toBe(2)
        expect(longRest({ ...hero(), exhaustion: 0 }, realContent).exhaustion).toBe(0)
    })

    it('restores every long-rest and short-rest resource', () => {
        let c = hero()
        for (const name of ['Action Surge', 'Combat Expertise Points', 'Universal Technique Slots']) {
            c = spendResource(c, pool(c, name), 99)
        }
        const rested = longRest(c, realContent)
        expect(rested.resourcesUsed).toEqual({})
    })

    it('leaves manually recharged resources alone', () => {
        const c = { ...hero(), resourcesUsed: { 'feature:manual-thing': 1 } }
        expect(longRest(c, realContent).resourcesUsed).toEqual({ 'feature:manual-thing': 1 })
    })

    it('does not bring back the dead', () => {
        const dead = { ...hero(), hpLost: 99, deathSaves: { successes: 0, failures: 3 } }
        expect(longRest(dead, realContent)).toBe(dead)
    })
})
