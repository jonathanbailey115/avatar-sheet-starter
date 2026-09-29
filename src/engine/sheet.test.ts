import { describe, expect, it } from 'vitest'
import { createBlankCharacter } from '../lib/character'
import { realContent } from '../lib/testFixtures'
import type { Feature } from '../types/schema'
import { computeSheet } from './sheet'

const earth = (overrides: Record<string, unknown> = {}) => ({
    ...createBlankCharacter(),
    lineageId: 'earth-kingdom-human',
    nation: 'Earth Kingdom' as const,
    dexterity: 12, // +1
    constitution: 14, // +2
    ...overrides,
})

const withFeature = (feature: Feature) => ({
    ...realContent,
    features: [...realContent.features, feature],
})

const customFeature = (id: string, effects: Feature['effects']): Feature => ({
    id,
    name: id,
    description: '',
    source: 'Custom',
    featureType: 'Passive',
    levelRequirement: 1,
    isActiveByDefault: true,
    effects,
})

describe('armor class', () => {
    it('Earth Kingdom Unarmored Defense: 10 + Dex + Con', () => {
        const sheet = computeSheet(earth({ selectedFeatureIds: [] }), realContent)
        expect(sheet.armorClass.total).toBe(13)
        expect(sheet.armorClass.breakdown.map((part) => part.label)).toContain('Unarmored Defense')
    })

    it('other lineages use plain 10 + Dex', () => {
        const fire = { ...earth(), lineageId: 'fire-nation-human', nation: 'Fire Nation' as const }
        expect(computeSheet(fire, realContent).armorClass.total).toBe(11)
    })

    it('Unarmored Defense stops applying when armor is worn (leather: 11 + Dex)', () => {
        const sheet = computeSheet(earth({ armorId: 'leather' }), realContent)
        expect(sheet.armorClass.total).toBe(12)
    })

    it('a shield adds 2 and does not count as armor', () => {
        expect(computeSheet(earth({ hasShield: true }), realContent).armorClass.total).toBe(15)
    })

    it('respects the medium armor Dex cap and heavy armor ignoring Dex', () => {
        const nimble = earth({ dexterity: 18, armorId: 'breastplate' }) // +4 capped to +2
        expect(computeSheet(nimble, realContent).armorClass.total).toBe(16)
        expect(computeSheet(earth({ dexterity: 18, armorId: 'chain-mail' }), realContent).armorClass.total).toBe(16)
    })

    it('takes the best base, not a sum', () => {
        // Studded leather 12 + 1 = 13 ties Unarmored Defense 13 only when unarmored; armor wins here
        expect(computeSheet(earth({ armorId: 'studded-leather' }), realContent).armorClass.total).toBe(13)
    })
})

describe('stealth and armor proficiency (Baseline 5e)', () => {
    it('chain mail gives Stealth disadvantage, and says why', () => {
        const stealth = computeSheet(earth({ armorId: 'chain-mail' }), realContent).skills.Stealth
        expect(stealth.roll.net).toBe('disadvantage')
        expect(stealth.roll.disadvantage[0]).toMatch(/Chain mail/)
    })

    it('no armor, no disadvantage', () => {
        expect(computeSheet(earth(), realContent).skills.Stealth.roll.net).toBe('normal')
    })

    it('a feature that removes the armor penalty hides it', () => {
        const content = withFeature(
            customFeature('iron-will', [
                { kind: 'suppressDisadvantage', target: 'skill:Stealth', tag: 'armor-stealth' },
            ]),
        )
        const sheet = computeSheet(earth({ armorId: 'chain-mail', selectedFeatureIds: ['iron-will'] }), content)
        expect(sheet.skills.Stealth.roll.net).toBe('normal')
        expect(sheet.skills.Stealth.roll.disadvantage).toEqual([])
    })

    it('Earth Kingdom is proficient in heavy armor, so no extra penalties', () => {
        const sheet = computeSheet(earth({ armorId: 'plate' }), realContent)
        expect(sheet.saves.dexterity.roll.net).toBe('normal')
        expect(sheet.skills.Athletics.roll.net).toBe('normal')
    })

    it('Air Nomads are light-armor only: heavy armor gives disadvantage on Str/Dex checks and saves', () => {
        const air = earth({ lineageId: 'air-nomad-human', nation: 'Air Nomads', armorId: 'chain-mail' })
        const sheet = computeSheet(air, realContent)
        expect(sheet.saves.strength.roll.net).toBe('disadvantage')
        expect(sheet.saves.dexterity.roll.net).toBe('disadvantage')
        expect(sheet.skills.Athletics.roll.net).toBe('disadvantage')
        expect(sheet.saves.wisdom.roll.net).toBe('normal')
        expect(sheet.skills.Insight.roll.net).toBe('normal')
    })

    it('an unknown lineage is never penalised (we do not guess)', () => {
        const sheet = computeSheet({ ...earth({ armorId: 'plate' }), lineageId: '' }, realContent)
        expect(sheet.saves.dexterity.roll.net).toBe('normal')
    })
})

describe('advantage and disadvantage combine the 5e way', () => {
    const both = customFeature('mixed', [
        { kind: 'advantage', target: 'skill:Stealth' },
        { kind: 'advantage', target: 'skill:Stealth' },
    ])

    it('advantage alone', () => {
        const sheet = computeSheet(earth({ selectedFeatureIds: ['mixed'] }), withFeature(both))
        expect(sheet.skills.Stealth.roll.net).toBe('advantage')
        expect(sheet.skills.Stealth.roll.advantage).toHaveLength(2)
    })

    it('any advantage plus any disadvantage cancels to normal', () => {
        const sheet = computeSheet(
            earth({ armorId: 'chain-mail', selectedFeatureIds: ['mixed'] }),
            withFeature(both),
        )
        expect(sheet.skills.Stealth.roll.net).toBe('normal')
        expect(sheet.skills.Stealth.roll.advantage.length).toBeGreaterThan(0)
        expect(sheet.skills.Stealth.roll.disadvantage.length).toBeGreaterThan(0)
    })
})

describe('initiative', () => {
    const weaponsmaster = (level: number) =>
        earth({ classId: 'weaponsmaster', level, dexterity: 14 }) // +2

    it('is the Dexterity modifier', () => {
        expect(computeSheet(weaponsmaster(1), realContent).initiative.total).toBe(2)
    })

    it('Quickdraw adds proficiency from 7th level (gmbinder)', () => {
        expect(computeSheet(weaponsmaster(6), realContent).initiative.total).toBe(2)
        const seven = computeSheet(weaponsmaster(7), realContent).initiative
        expect(seven.total).toBe(2 + 3)
        expect(seven.breakdown.map((part) => part.label)).toContain('Quickdraw')
    })
})

describe('saves, skills, passives', () => {
    it('adds proficiency to proficient saves only', () => {
        const sheet = computeSheet(earth({ savingThrowProficiencies: ['constitution'] }), realContent)
        expect(sheet.saves.constitution.total).toBe(2 + 2)
        expect(sheet.saves.strength.total).toBe(0)
    })

    it('Religion uses Wisdom (gmbinder)', () => {
        const sheet = computeSheet(earth({ wisdom: 16, intelligence: 8 }), realContent)
        expect(sheet.skills.Religion.total).toBe(3)
        expect(sheet.skills.Religion.ability).toBe('wisdom')
    })

    it('passive Perception is 10 + modifier (+ proficiency)', () => {
        const sheet = computeSheet(earth({ wisdom: 14, skillProficiencies: ['Perception'] }), realContent)
        expect(sheet.passives.perception).toBe(10 + 2 + 2)
        expect(sheet.passives.insight).toBe(12)
    })

    it('proficiency bonus follows level', () => {
        expect(computeSheet(earth({ level: 9 }), realContent).proficiencyBonus).toBe(4)
    })
})

describe('exhaustion (Baseline 5e)', () => {
    it('level 1: disadvantage on ability checks and initiative, not saves', () => {
        const sheet = computeSheet(earth({ exhaustion: 1 }), realContent)
        expect(sheet.skills.Athletics.roll.net).toBe('disadvantage')
        expect(sheet.initiative.roll.net).toBe('disadvantage')
        expect(sheet.saves.wisdom.roll.net).toBe('normal')
    })

    it('level 3: also disadvantage on saves', () => {
        expect(computeSheet(earth({ exhaustion: 3 }), realContent).saves.wisdom.roll.net).toBe('disadvantage')
    })

    it('shows the level as the source', () => {
        const sources = computeSheet(earth({ exhaustion: 2 }), realContent).skills.Stealth.roll.disadvantage
        expect(sources).toEqual(['Exhaustion 2 (Baseline 5e)'])
    })
})

describe('hit points and resources on the sheet', () => {
    it('Earth Kingdom level 1 with +2 Con has 14 HP and starts full', () => {
        const sheet = computeSheet(earth(), realContent)
        expect(sheet).toMatchObject({ maxHp: 14, currentHp: 14, hitDie: 12, hitDiceRemaining: 1, lifeState: 'conscious' })
    })

    it('reports spent resources', () => {
        const sheet = computeSheet(
            earth({ classId: 'weaponsmaster', resourcesUsed: { 'weaponsmaster:combat-expertise': 1 } }),
            realContent,
        )
        const points = sheet.resources.find((r) => r.name === 'Combat Expertise Points')!
        expect(points).toMatchObject({ max: 1, used: 1, remaining: 0 })
    })
})
