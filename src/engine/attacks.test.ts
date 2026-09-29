import { describe, expect, it } from 'vitest'
import { findWeapon, weaponTable } from '../data/weapons'
import { createBlankCharacter } from '../lib/character'
import { realContent } from '../lib/testFixtures'
import { damageFormula, weaponProficient } from './attacks'
import { computeSheet } from './sheet'
import type { Feature } from '../types/schema'

const earthLineage = 'earth-kingdom-human'

const hero = (overrides: Record<string, unknown> = {}) => ({
    ...createBlankCharacter(),
    lineageId: earthLineage,
    strength: 16, // +3
    dexterity: 14, // +2
    constitution: 14, // +2
    ...overrides,
})

const withWeapon = (weaponId: string, bonus = 0) => ({ id: `w-${weaponId}`, weaponId, bonus })
const attack = (sheet: ReturnType<typeof computeSheet>, name: string) =>
    sheet.attacks.find((item) => item.name === name)!

describe('weapon proficiency from lineage lists (gmbinder)', () => {
    const earth = realContent.lineages.find((l) => l.id === earthLineage)!.weaponProficiencies

    it('Earth Kingdom: simple weapons, axes, greatswords, longswords, hammers, mauls, scimitars, spears', () => {
        for (const id of ['club', 'dagger', 'battleaxe', 'greataxe', 'greatsword', 'longsword', 'warhammer', 'maul', 'scimitar', 'spear', 'throwing-axe']) {
            expect(weaponProficient(findWeapon(id)!, earth), id).toBe(true)
        }
    })

    it('Earth Kingdom is not proficient with martial weapons it does not list', () => {
        for (const id of ['rapier', 'glaive', 'longbow', 'whip', 'shortsword', 'trident']) {
            expect(weaponProficient(findWeapon(id)!, earth), id).toBe(false)
        }
    })

    it('handles plurals, spacing and parentheses in the lists', () => {
        const water = realContent.lineages.find((l) => l.id === 'water-tribe-human')
        const list = ['Simple Weapons', 'Short Swords', 'Crossbows (light and heavy)', 'Bows']
        expect(weaponProficient(findWeapon('shortsword')!, list)).toBe(true)
        expect(weaponProficient(findWeapon('heavy-crossbow')!, list)).toBe(true)
        expect(weaponProficient(findWeapon('longbow')!, list)).toBe(true)
        expect(water).toBeDefined()
    })

    it('no proficiency list means not proficient', () => {
        expect(weaponProficient(findWeapon('club')!, undefined)).toBe(false)
    })

    it('every weapon has a positive die and a unique id', () => {
        const ids = weaponTable.map((weapon) => weapon.id)
        expect(new Set(ids).size).toBe(ids.length)
        for (const weapon of weaponTable.filter((item) => !item.noDamage)) expect(weapon.damage).toMatch(/^\d+d\d+$/)
        expect(weaponTable.filter((item) => item.noDamage).map((item) => item.id)).toEqual(['net'])
    })

    it('Water Tribe and Air Nomad weapon proficiencies now match real weapons', () => {
        const water = realContent.lineages.find((item) => item.nation === 'Water Tribe')
        const air = realContent.lineages.find((item) => item.nation === 'Air Nomads')
        expect(weaponProficient(findWeapon('net')!, water?.weaponProficiencies)).toBe(true)
        expect(weaponProficient(findWeapon('bolas')!, water?.weaponProficiencies)).toBe(true)
        expect(weaponProficient(findWeapon('war-fan')!, air?.weaponProficiencies)).toBe(true)
        expect(weaponProficient(findWeapon('war-fan')!, water?.weaponProficiencies)).toBe(false)
    })

    it('a Net attack rolls to hit but deals no damage', () => {
        const sheet = computeSheet(hero({ weapons: [withWeapon('net')] }), realContent)
        const net = attack(sheet, 'Net')
        expect(net.noDamage).toBe(true)
        expect(net.damageFlat).toBe(0)
        expect(net.damageBreakdown).toEqual([])
    })
})

describe('weapon attacks', () => {
    it('proficient melee weapon: Str + proficiency; damage die + Str', () => {
        const sheet = computeSheet(hero({ weapons: [withWeapon('longsword')] }), realContent)
        const sword = attack(sheet, 'Longsword')
        expect(sword.attack.total).toBe(3 + 2)
        expect(sword.attack.breakdown.map((p) => p.label)).toEqual(['Strength', 'Proficiency'])
        expect(damageFormula(sword)).toBe('1d8+3')
        expect(damageFormula(sword, true)).toBe('1d10+3')
        expect(sword.damageType).toBe('slashing')
    })

    it('not proficient: no proficiency bonus', () => {
        const sheet = computeSheet(hero({ weapons: [withWeapon('rapier')] }), realContent)
        const rapier = attack(sheet, 'Rapier')
        expect(rapier.proficient).toBe(false)
        // Finesse: Dexterity (+2) is not better than Strength (+3), so Strength is used
        expect(rapier.attack.total).toBe(3)
    })

    it('finesse uses the better of Str and Dex', () => {
        const nimble = hero({ strength: 10, dexterity: 18, weapons: [withWeapon('scimitar')] })
        const scimitar = attack(computeSheet(nimble, realContent), 'Scimitar')
        expect(scimitar.attack.total).toBe(4 + 2)
        expect(scimitar.damageFlat).toBe(4)
    })

    it('ranged weapons use Dexterity', () => {
        const sheet = computeSheet(hero({ weapons: [withWeapon('throwing-axe')] }), realContent)
        // Throwing axe is not finesse and is a ranged item in gmbinder: Dex +2, Earth knows Axes: +2
        expect(attack(sheet, 'Throwing axe').attack.total).toBe(2 + 2)
    })

    it('a weapon bonus adds to attack and damage', () => {
        const sheet = computeSheet(hero({ weapons: [withWeapon('longsword', 1)] }), realContent)
        const sword = attack(sheet, 'Longsword')
        expect(sword.attack.total).toBe(6)
        expect(damageFormula(sword)).toBe('1d8+4')
    })

    it('skips unknown weapon ids instead of crashing', () => {
        const sheet = computeSheet(hero({ weapons: [withWeapon('does-not-exist')] }), realContent)
        expect(sheet.attacks.map((a) => a.name)).toEqual(['Unarmed strike'])
    })

    it('unarmed strike is 1 + Strength', () => {
        const unarmed = attack(computeSheet(hero(), realContent), 'Unarmed strike')
        expect(damageFormula(unarmed)).toBe('4')
        expect(unarmed.attack.total).toBe(3 + 2)
    })
})

describe('critical range', () => {
    const weaponsmaster = (level: number) =>
        hero({ classId: 'weaponsmaster', level, weapons: [withWeapon('longsword')] })

    it('20 by default', () => {
        expect(attack(computeSheet(weaponsmaster(10), realContent), 'Longsword').critMin).toBe(20)
    })

    it('Superior Critical (Weaponsmaster 11th): weapon attacks crit on 18-20', () => {
        const sheet = computeSheet(weaponsmaster(11), realContent)
        expect(attack(sheet, 'Longsword').critMin).toBe(18)
        expect(attack(sheet, 'Unarmed strike').critMin).toBe(20)
    })
})

describe('bending', () => {
    const earthbender = (overrides: Record<string, unknown> = {}) =>
        hero({ classId: 'earthbending', level: 5, ...overrides })

    it('Bending Save DC = 8 + proficiency + Con (Earth)', () => {
        expect(computeSheet(earthbender(), realContent).bending).toMatchObject({
            ability: 'constitution',
            modifier: 2,
            attackModifier: 3 + 2,
            saveDc: 8 + 3 + 2,
        })
    })

    it('basic Earthbending attack: d20 + proficiency + Con; 1d8 + Con bludgeoning', () => {
        const basic = computeSheet(earthbender(), realContent).attacks.find((a) => a.kind === 'bending')!
        expect(basic.attack.total).toBe(5)
        expect(damageFormula(basic)).toBe('1d8+2')
        expect(basic.damageType).toBe('bludgeoning')
    })

    it('Weaponsmaster Save DC uses Dexterity (gmbinder) and has no basic bending attack', () => {
        const sheet = computeSheet(hero({ classId: 'weaponsmaster', level: 1 }), realContent)
        expect(sheet.bending).toMatchObject({ ability: 'dexterity', saveDc: 8 + 2 + 2 })
        expect(sheet.attacks.some((a) => a.kind === 'bending')).toBe(false)
    })

    it('non-benders with no class have no bending', () => {
        expect(computeSheet(hero(), realContent).bending).toBeNull()
    })
})

describe('advantage and disadvantage on attacks', () => {
    it('wearing armor you are not proficient with gives disadvantage on attacks', () => {
        const air = hero({ lineageId: 'air-nomad-human', nation: 'Air Nomads', armorId: 'plate', weapons: [withWeapon('club')] })
        const sheet = computeSheet(air, realContent)
        expect(attack(sheet, 'Club').attack.roll.net).toBe('disadvantage')
    })

    it('a situational advantage is offered, not applied', () => {
        const feature: Feature = {
            id: 'neutral-test',
            name: 'Neutral Jing',
            description: '',
            source: 'Class',
            featureType: 'Passive',
            levelRequirement: 1,
            isActiveByDefault: true,
            effects: [{ kind: 'advantage', target: 'saves', situation: 'vs a creature that acts before you' }],
        }
        const content = { ...realContent, features: [...realContent.features, feature] }
        const sheet = computeSheet(hero({ selectedFeatureIds: ['neutral-test'] }), content)
        expect(sheet.saves.wisdom.roll.net).toBe('normal')
        expect(sheet.saves.wisdom.roll.situational).toEqual([
            { kind: 'advantage', source: 'Neutral Jing', situation: 'vs a creature that acts before you', value: 0 },
        ])
    })

    it('a situational bonus carries its value', () => {
        const feature: Feature = {
            id: 'terrain-test',
            name: 'Lay of the Land',
            description: '',
            source: 'Lineage',
            featureType: 'Passive',
            levelRequirement: 1,
            isActiveByDefault: true,
            effects: [{ kind: 'bonus', target: 'skill:Survival', value: 'proficiency', situation: 'in your favored terrain' }],
        }
        const content = { ...realContent, features: [...realContent.features, feature] }
        const sheet = computeSheet(hero({ selectedFeatureIds: ['terrain-test'] }), content)
        expect(sheet.skills.Survival.total).toBe(0) // not applied automatically
        expect(sheet.skills.Survival.roll.situational[0]).toMatchObject({ kind: 'bonus', value: 2 })
    })
})
