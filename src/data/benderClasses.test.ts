import { describe, expect, it } from 'vitest'
import { computeSheet } from '../engine/sheet'
import { disciplinesOf, learnBlocker } from '../engine/techniques'
import { NATION_ELEMENT } from '../engine/bending'
import { createBlankCharacter } from '../lib/character'
import { realContent } from '../lib/testFixtures'
import { airMechanics, fireMechanics, waterMechanics } from './techniques/elementMechanics'
import type { AbilityName, Character, Nation } from '../types/schema'

const CASES: Array<{ classId: string; nation: Nation; ability: AbilityName }> = [
    { classId: 'earthbending', nation: 'Earth Kingdom', ability: 'constitution' },
    { classId: 'waterbending', nation: 'Water Tribe', ability: 'charisma' },
    { classId: 'firebending', nation: 'Fire Nation', ability: 'strength' },
    { classId: 'airbending', nation: 'Air Nomads', ability: 'wisdom' },
]

function build(classId: string, nation: Nation, level: number, patch: Partial<Character> = {}): Character {
    const lineage = realContent.lineages.find((item) => item.nation === nation)
    return {
        ...createBlankCharacter('Player Character'),
        nation,
        lineageId: lineage?.id ?? '',
        classId,
        level,
        ...patch,
    }
}

describe('bending classes', () => {
    it.each(CASES)('$classId bends $nation’s element with $ability', ({ classId, nation, ability }) => {
        const cls = realContent.classes.find((item) => item.id === classId)
        expect(cls?.element).toBe(NATION_ELEMENT[nation])
        expect(cls?.bendingAbility).toBe(ability)
    })

    it.each(CASES)('$classId: Bending Save DC is 8 + proficiency + ability modifier', ({ classId, nation, ability }) => {
        const character = build(classId, nation, 5, { [ability]: 16 })
        const sheet = computeSheet(character, realContent)
        expect(sheet.bending?.ability).toBe(ability)
        expect(sheet.bending?.saveDc).toBe(8 + sheet.proficiencyBonus + 3)
        expect(sheet.bending?.attackModifier).toBe(sheet.proficiencyBonus + 3)
    })

    it.each(CASES)('$classId has the Benders technique slots and full ASI grants', ({ classId, nation }) => {
        const cls = realContent.classes.find((item) => item.id === classId)
        expect(cls?.techniqueSlots).toHaveLength(20)
        const asi = cls?.featureGrants.filter((grant) => grant.featureId.endsWith('ability-score-improvement')).map((grant) => grant.level)
        expect(asi).toEqual([4, 9, 12, 16, 19])
        expect(computeSheet(build(classId, nation, 20), realContent).resources.some((r) => r.kind === 'slot')).toBe(true)
    })

    it('Airbending has no subclass and no Extra Attack, as the source gives none', () => {
        const air = realContent.classes.find((item) => item.id === 'airbending')
        expect(realContent.subclasses.filter((item) => item.classId === 'airbending')).toEqual([])
        expect(air?.featureGrants.some((grant) => grant.featureId.includes('extra-attack'))).toBe(false)
    })

    it('Quick Reflexes adds the Wisdom modifier to an Airbender’s initiative from level 10', () => {
        const before = computeSheet(build('airbending', 'Air Nomads', 9, { wisdom: 16, dexterity: 10 }), realContent)
        const after = computeSheet(build('airbending', 'Air Nomads', 10, { wisdom: 16, dexterity: 10 }), realContent)
        expect(after.initiative.total - before.initiative.total).toBe(3)
        expect(after.initiative.breakdown.some((part) => part.label === 'Quick Reflexes')).toBe(true)
    })
})

describe('sub-bending disciplines', () => {
    const bloodTechnique = realContent.techniques.find((item) => item.discipline === 'Bloodbending')!
    const combustion = realContent.techniques.find((item) => item.discipline === 'Combustionbending')!
    const water = realContent.classes.find((item) => item.id === 'waterbending')
    const fire = realContent.classes.find((item) => item.id === 'firebending')

    it('Bloodbending techniques need the Path of the Bloodbender', () => {
        const plain = build('waterbending', 'Water Tribe', 5, { subclassId: 'path-of-the-waterbender' })
        const blood = build('waterbending', 'Water Tribe', 5, { subclassId: 'path-of-the-bloodbender' })
        const learnable = (c: Character) =>
            learnBlocker(c, { ...bloodTechnique, rare: false, prerequisite: undefined }, water, realContent.techniques, disciplinesOf(c, realContent.subclasses))
        expect(learnable(plain)).toMatch(/Bloodbending/)
        expect(learnable(blood)).toBeNull()
    })

    it('the gate only opens once the subclass is unlocked', () => {
        const early = build('firebending', 'Fire Nation', 2, { subclassId: 'principles-of-the-combustionbender' })
        expect(disciplinesOf(early, realContent.subclasses)).toEqual([])
        expect(learnBlocker(early, { ...combustion, rare: false, prerequisite: undefined }, fire, realContent.techniques, [])).toMatch(/Combustionbending/)
    })

    it('a prerequisite written with two names still finds its technique (Water Whip / Water Rope)', () => {
        const wall = realContent.techniques.find((item) => item.prerequisite?.includes('Water Whip'))
        if (!wall) return
        const character = build('waterbending', 'Water Tribe', 9)
        expect(learnBlocker(character, wall, water, realContent.techniques)).toMatch(/Requires .*Water Whip/)
    })
})

describe('technique content', () => {
    it('every hand-authored mechanic belongs to a real technique', () => {
        const ids = new Set(realContent.techniques.map((item) => item.id))
        for (const id of [...Object.keys(waterMechanics), ...Object.keys(fireMechanics), ...Object.keys(airMechanics)]) {
            expect(ids.has(id), id).toBe(true)
        }
    })

    it('technique ids are unique across every element', () => {
        const ids = realContent.techniques.map((item) => item.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it('every element has a technique list and a class that draws from it', () => {
        for (const { classId } of CASES) {
            const cls = realContent.classes.find((item) => item.id === classId)!
            const own = realContent.techniques.filter((item) => item.element === cls.element)
            expect(own.length, classId).toBeGreaterThan(10)
        }
    })
})

describe('Tech-Engineer', () => {
    const engineer = (level: number, patch: Partial<Character> = {}) =>
        build('tech-engineer', 'Earth Kingdom', level, { intelligence: 16, ...patch })

    it('uses Intelligence for its Save DC and has no bending element', () => {
        const cls = realContent.classes.find((item) => item.id === 'tech-engineer')
        expect(cls?.element).toBeUndefined()
        const sheet = computeSheet(engineer(5), realContent)
        expect(sheet.bending?.ability).toBe('intelligence')
        expect(sheet.bending?.saveDc).toBe(8 + 3 + 3)
    })

    it('tracks Universal Technique Slots and Spark Points from the class table', () => {
        const at = (level: number) => Object.fromEntries(computeSheet(engineer(level), realContent).resources.map((r) => [r.name, r.max]))
        expect(at(1)).toMatchObject({ 'Universal Technique Slots': 3, 'Spark Points': 1 })
        expect(at(9)).toMatchObject({ 'Universal Technique Slots': 5, 'Spark Points': 5 })
        expect(at(20)).toMatchObject({ 'Universal Technique Slots': 7, 'Spark Points': 10 })
    })

    it('follows the class table for Ability Score Improvements (4, 8, 12, 16)', () => {
        const cls = realContent.classes.find((item) => item.id === 'tech-engineer')
        const asi = cls?.featureGrants.filter((grant) => grant.featureId.endsWith('ability-score-improvement')).map((grant) => grant.level)
        expect(asi).toEqual([4, 8, 12, 16])
    })

    it('learns Universal techniques only, two at first level and one more at 6th and 13th', () => {
        const cls = realContent.classes.find((item) => item.id === 'tech-engineer')
        const maxes = cls?.techniqueLimits?.[0].maxByLevel
        expect([maxes?.[0], maxes?.[5], maxes?.[12]]).toEqual([2, 3, 4])
        expect(cls?.techniqueLimits?.[0].kinds).toEqual(['Universal'])
    })

    it('grants each Specialization’s features by level', () => {
        const featuresOf = (subclassId: string, level: number) =>
            computeSheet(engineer(level, { subclassId }), realContent).features.map((granted) => granted.feature.name)
        expect(featuresOf('armor-specialist', 2)).not.toContain('Beginner Upgrades')
        expect(featuresOf('armor-specialist', 3)).toContain('Beginner Upgrades')
        expect(featuresOf('armor-specialist', 19)).toContain('Pioneer Armorer')
        expect(featuresOf('weapons-specialist', 13)).toContain('Masterwork Upgrades')
        expect(featuresOf('gadgeteering-specialist', 7)).toContain('Innovative Contraptions')
    })

    it('Multidisciplinary Specialists crit on 19-20 with weapons from level 9', () => {
        const sword = { id: 'w1', weaponId: 'longsword', bonus: 0 }
        const crit = (level: number) =>
            computeSheet(engineer(level, { subclassId: 'multidisciplinary-specialist', weapons: [sword] }), realContent).attacks.find(
                (attack) => attack.kind === 'weapon',
            )?.critMin
        expect(crit(8)).toBe(20)
        expect(crit(9)).toBe(19)
    })

    it('contraptions are optional features, available from the level the source lists', () => {
        const contraptions = realContent.features.filter((feature) => feature.id.startsWith('contraption-'))
        expect(contraptions).toHaveLength(18)
        const level = (id: string) => contraptions.find((feature) => feature.id === id)?.levelRequirement
        expect(level('contraption-cleats')).toBe(1)
        expect(level('contraption-capacitors')).toBe(5)
        expect(level('contraption-net-gun')).toBe(11)
        expect(level('contraption-glider')).toBe(16)
        expect(contraptions.every((feature) => !feature.isActiveByDefault)).toBe(true)
        const tech = realContent.classes.find((item) => item.id === 'tech-engineer')
        expect(tech?.featureGrants.some((grant) => grant.featureId.startsWith('contraption-'))).toBe(false)
    })

    it('a selected contraption shows up on the sheet once its level is reached', () => {
        const picked = build('tech-engineer', 'Earth Kingdom', 4, { selectedFeatureIds: ['contraption-net-gun', 'contraption-cleats'] })
        const names = computeSheet(picked, realContent).features.map((granted) => granted.feature.name)
        expect(names).toContain('Cleats')
        expect(names).not.toContain('Net Gun')
    })
})

describe('campaign data round trip', () => {
    it('exporting and importing every built-in technique loses nothing', async () => {
        const { parseCampaignData, serializeCampaignData } = await import('../lib/campaignData')
        const text = serializeCampaignData({ lineages: [], techniques: realContent.techniques, features: [], npcTemplates: [] })
        const parsed = parseCampaignData(text)
        expect(parsed.warnings).toEqual([])
        expect(parsed.data.techniques).toEqual(realContent.techniques)
    })

    it('exporting and importing every built-in feature loses nothing', async () => {
        const { parseCampaignData, serializeCampaignData } = await import('../lib/campaignData')
        const text = serializeCampaignData({ lineages: [], techniques: [], features: realContent.features, npcTemplates: [] })
        const parsed = parseCampaignData(text)
        expect(parsed.warnings).toEqual([])
        expect(parsed.data.features).toEqual(realContent.features)
    })
})

describe('feats', () => {
    const feats = realContent.features.filter((feature) => feature.source === 'Feat' && !feature.id.startsWith('feat-srd-'))

    it('brings in the 24 feats gmbinder changes or adds, as optional features', () => {
        expect(feats).toHaveLength(24)
        expect(feats.every((feat) => !feat.isActiveByDefault && feat.levelRequirement === 1)).toBe(true)
        expect(new Set(feats.map((feat) => feat.id)).size).toBe(feats.length)
    })

    it('renames the misprinted Mage Slayer feat to Bender Slayer', () => {
        expect(feats.some((feat) => feat.name === 'Bender Slayer')).toBe(true)
        expect(feats.some((feat) => feat.name === 'Bender Bender')).toBe(false)
    })

    it('adds the SRD feats, labelled Baseline 5e, and Alert adds proficiency to initiative', () => {
        const srd = realContent.features.filter((feature) => feature.id.startsWith('feat-srd-'))
        expect(srd.map((feat) => feat.name).sort()).toEqual(['Alert', 'Grappler', 'Savage Attacker', 'Skilled'])
        expect(srd.every((feat) => feat.description.startsWith('Baseline 5e'))).toBe(true)
        const plain = build('earthbending', 'Earth Kingdom', 5, { dexterity: 14 })
        const alert = { ...plain, selectedFeatureIds: ['feat-srd-alert'] }
        expect(computeSheet(alert, realContent).initiative.total - computeSheet(plain, realContent).initiative.total).toBe(3)
    })

    it('uses the setting names, keeping the 5e name in the text', () => {
        const precise = feats.find((feat) => feat.name === 'Precise Bender')
        expect(precise?.description).toMatch(/Spell Sniper/)
        expect(feats.some((feat) => /\(/.test(feat.name))).toBe(false)
    })

    it('a chosen feat appears on the sheet', () => {
        const character = build('firebending', 'Fire Nation', 3, { selectedFeatureIds: ['feat-lightning-generation'] })
        expect(computeSheet(character, realContent).features.map((granted) => granted.feature.name)).toContain('Lightning Generation')
    })
})

describe('Lightningbending', () => {
    const lightning = realContent.techniques.filter((technique) => technique.discipline === 'Lightningbending')
    const fire = realContent.classes.find((item) => item.id === 'firebending')

    it('has three techniques, all Fire, that only the Lightning Generation feat unlocks', () => {
        expect(lightning.map((technique) => technique.name).sort()).toEqual(['Arc Lightning', 'Lightning Blast', 'Stunning Strike'])
        expect(lightning.every((technique) => technique.element === 'Fire')).toBe(true)

        const without = build('firebending', 'Fire Nation', 9)
        const withFeat = build('firebending', 'Fire Nation', 9, { selectedFeatureIds: ['feat-lightning-generation'] })
        const blocker = (character: Character) => {
            const technique = { ...lightning.find((item) => item.name === 'Stunning Strike')!, rare: false }
            return learnBlocker(character, technique, fire, realContent.techniques, disciplinesOf(character, realContent.subclasses, realContent.features))
        }
        expect(blocker(without)).toMatch(/Lightningbending/)
        expect(blocker(withFeat)).toBeNull()
    })
})

describe('the GM-permitted alternate bending ability', () => {
    it('Airbenders can use Dexterity, and Tech-Engineers Wisdom, only when the switch is on', () => {
        const air = (abilityOption: boolean) =>
            computeSheet(build('airbending', 'Air Nomads', 5, { wisdom: 12, dexterity: 18, abilityOption }), realContent)
        expect(air(false).bending).toMatchObject({ ability: 'wisdom', saveDc: 8 + 3 + 1 })
        expect(air(true).bending).toMatchObject({ ability: 'dexterity', saveDc: 8 + 3 + 4 })
        expect(air(true).attacks.find((attack) => attack.kind === 'bending')?.damageBreakdown[0].label).toBe('Dexterity')

        const engineer = (abilityOption: boolean) =>
            computeSheet(build('tech-engineer', 'Earth Kingdom', 5, { intelligence: 10, wisdom: 16, abilityOption }), realContent)
        expect(engineer(false).bending?.ability).toBe('intelligence')
        expect(engineer(true).bending?.ability).toBe('wisdom')
    })

    it('does nothing for classes that have no alternate', () => {
        const sheet = computeSheet(build('firebending', 'Fire Nation', 5, { strength: 16, dexterity: 18, abilityOption: true }), realContent)
        expect(sheet.bending?.ability).toBe('strength')
    })
})

describe('once-per-day feats', () => {
    it('Efficient Bender and Spiritual Projection are tracked as one use per long rest', () => {
        const character = build('airbending', 'Air Nomads', 3, { selectedFeatureIds: ['feat-efficient-bender', 'feat-spiritual-projection'] })
        const uses = computeSheet(character, realContent).resources.filter((resource) => resource.kind === 'feature')
        expect(uses.map((resource) => [resource.name, resource.max, resource.recharge]).sort()).toEqual([
            ['Efficient Bender', 1, 'Long Rest'],
            ['Spiritual Projection', 1, 'Long Rest'],
        ])
    })
})
