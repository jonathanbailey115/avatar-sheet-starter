import { describe, expect, it } from 'vitest'
import { weaponProficient } from '../engine/attacks'
import { computeSheet } from '../engine/sheet'
import { createBlankCharacter } from '../lib/character'
import { normalizeCharacter } from '../lib/normalize'
import { realContent } from '../lib/testFixtures'
import type { AbilityName, Character, Nation } from '../types/schema'
import { armorTable } from './armor'
import { weaponTable } from './weapons'

/** What gmbinder gives each lineage (Lineage section). */
const EXPECTED: Array<{
    nation: Nation
    hitDie: 6 | 8 | 10 | 12
    save: AbilityName
    skills: number
    armor: string[]
    tools: string[]
    features: string[]
}> = [
    {
        nation: 'Water Tribe',
        hitDie: 10,
        save: 'charisma',
        skills: 7,
        armor: ['Light Armor', 'Medium Armor', 'Shields'],
        tools: ['Alchemist’s Supplies', 'Poisoner’s Kit', 'Navigator’s Tools', 'Cartographer’s Tools'],
        features: ['Community'],
    },
    {
        nation: 'Earth Kingdom',
        hitDie: 12,
        save: 'constitution',
        skills: 8,
        armor: ['Medium Armor', 'Heavy Armor', 'Shields'],
        tools: ['Thieves’ Tools', "Smith's Tools", 'Disguise Kit'],
        features: ['Unarmored Defense', 'Lay of the Land'],
    },
    {
        nation: 'Fire Nation',
        hitDie: 8,
        save: 'strength',
        skills: 8,
        armor: ['Light Armor', 'Medium Armor'],
        tools: ['Disguise Kit', 'Forgery Kit', 'Poisoner’s Kit'],
        features: ['Lessons of the Schools', 'Dragon’s Fury'],
    },
    {
        nation: 'Air Nomads',
        hitDie: 6,
        save: 'wisdom',
        skills: 11,
        armor: ['Light Armor'],
        tools: ['Herbalism Kit', 'Navigator’s Tools', 'Potter’s Tools'],
        features: ['Negative Jing', 'Twinkletoes'],
    },
]

const lineageOf = (nation: Nation) => realContent.lineages.find((item) => item.nation === nation)!

describe.each(EXPECTED)('$nation lineage', (expected) => {
    const lineage = lineageOf(expected.nation)

    it('has the hit die, saving throw, skills, armor and tools the source lists', () => {
        expect(lineage.hitDie).toBe(expected.hitDie)
        expect(lineage.savingThrows).toEqual([expected.save])
        expect(lineage.savingThrowChoices?.choose).toBe(1)
        expect(lineage.savingThrowChoices?.options).not.toContain(expected.save)
        expect(lineage.skillChoices?.choose).toBe(2)
        expect(lineage.skillChoices?.options).toHaveLength(expected.skills)
        expect(lineage.armorProficiencies).toEqual(expected.armor)
        expect(lineage.toolChoices).toEqual({ choose: 1, options: expected.tools })
    })

    it('grants its named features', () => {
        const names = (lineage.featureIds ?? []).map((id) => realContent.features.find((feature) => feature.id === id)?.name)
        expect(names).toEqual(expected.features)
    })

    it('turns the choices into proficiencies on a normalized character', () => {
        const character: Character = normalizeCharacter(
            {
                ...createBlankCharacter(),
                nation: expected.nation,
                lineageId: lineage.id,
                lineageSkillChoices: lineage.skillChoices!.options.slice(0, 2),
                lineageSavingThrowChoices: [lineage.savingThrowChoices!.options[0]],
                lineageToolChoices: [expected.tools[0]],
            },
            realContent,
        )
        expect(character.savingThrowProficiencies).toEqual(expect.arrayContaining([expected.save, lineage.savingThrowChoices!.options[0]]))
        expect(character.skillProficiencies).toEqual(expect.arrayContaining(lineage.skillChoices!.options.slice(0, 2)))
        expect(character.toolProficiencies).toContain(expected.tools[0])
        expect(computeSheet(character, realContent).saves[expected.save].proficient).toBe(true)
    })
})

describe('lineage weapon and armor proficiencies', () => {
    const can = (nation: Nation, weaponId: string) =>
        weaponProficient(weaponTable.find((weapon) => weapon.id === weaponId)!, lineageOf(nation).weaponProficiencies)

    it('Water Tribe: spears, tridents, slings, scimitars and short swords; not longswords', () => {
        for (const id of ['spear', 'trident', 'sling', 'scimitar', 'shortsword', 'boomerang', 'light-crossbow', 'heavy-crossbow', 'shortbow']) {
            expect(can('Water Tribe', id), id).toBe(true)
        }
        expect(can('Water Tribe', 'longsword')).toBe(false)
    })

    it('Fire Nation: rapiers, longswords, whips and glaives; not tridents', () => {
        for (const id of ['rapier', 'longsword', 'whip', 'glaive', 'dagger', 'scimitar', 'shortsword']) expect(can('Fire Nation', id), id).toBe(true)
        expect(can('Fire Nation', 'trident')).toBe(false)
    })

    it('Air Nomads: light weapons only; not longswords or heavy crossbows', () => {
        for (const id of ['quarterstaff', 'dagger', 'glaive', 'whip', 'shortbow', 'light-crossbow']) expect(can('Air Nomads', id), id).toBe(true)
        expect(can('Air Nomads', 'longsword')).toBe(false)
        expect(can('Air Nomads', 'heavy-crossbow')).toBe(false)
    })

    it('only Earth Kingdom and Water Tribe lineages can use shields, and only Earth wears heavy armor', () => {
        const shields = realContent.lineages.filter((item) => item.armorProficiencies?.includes('Shields')).map((item) => item.nation)
        expect(shields.sort()).toEqual(['Earth Kingdom', 'Water Tribe'])
        const heavy = armorTable.filter((piece) => piece.category === 'heavy')
        expect(heavy.length).toBeGreaterThan(0)
        expect(realContent.lineages.filter((item) => item.armorProficiencies?.includes('Heavy Armor')).map((item) => item.nation)).toEqual(['Earth Kingdom'])
    })
})
