import type { CharacterClass, CharacterSubclass, Feature } from '../types/schema'
import { SPARK_POINTS, UNIVERSAL_TECHNIQUE_SLOTS } from './benderTable'
import { grantsOf, makeFeature, slug, textOf } from './classFeature'
import { classText } from './classText.generated'

/**
 * Tech-Engineer class, its four Specializations and the Creative Mind contraptions (gmbinder,
 * Tech-Engineer). Wording is extracted from the source; levels and effects are authored here.
 *
 * Contraptions and Gadgeteering upgrades are not granted automatically: the source has you choose
 * them, so they are ordinary features you add in the builder (each is available from its level).
 */

const T = 'tech-engineer'
const cls = (name: string, id: string, level: number, extra: Partial<Feature> & { type?: Feature['featureType']; note?: string } = {}) => {
    const { type, note, ...rest } = extra
    return makeFeature(T, name, { id: `class-tech-engineer-${id}`, source: 'Class', level, featureType: type, note, extra: rest })
}

/** Part of a feature's text: the paragraph(s) that start at a line matching `from`. */
function paragraphs(section: string, name: string, pick: (lines: string[]) => string[]): string {
    return pick(textOf(section, name).split('\n')).join('\n')
}

const nimbleWit = (name: string, id: string, level: number, pick: (lines: string[]) => string[]): Feature => ({
    ...cls('Nimble Wit', id, level),
    name,
    description: paragraphs(T, 'Nimble Wit', pick),
})

const universalTechniques = (name: string, id: string, level: number, pick: (lines: string[]) => string[]): Feature => ({
    ...cls('Universal Techniques', id, level),
    name,
    description: paragraphs(T, 'Universal Techniques', pick),
})

export const techEngineerFeatures: Feature[] = [
    nimbleWit('Nimble Wit', 'nimble-wit', 1, (lines) => lines.filter((line) => !line.startsWith('Starting at level 5'))),
    nimbleWit('Nimble Wit (level 5)', 'nimble-wit-level-5', 5, (lines) => lines.filter((line) => line.startsWith('Starting at level 5'))),
    cls('Creative Mind', 'creative-mind', 1),
    universalTechniques('Universal Techniques', 'universal-techniques', 1, (lines) => lines.slice(0, 1)),
    universalTechniques('Universal Techniques Improvement', 'universal-techniques-improvement', 6, (lines) => lines.slice(1)),
    cls('Specialization', 'specialization', 3),
    cls('Ability Score Improvement', 'ability-score-improvement', 4, {
        note: 'The Tech-Engineer text lists Ability Score Improvements at 4th, 8th, 12th, 16th and 19th level; the class table has none at 19th. This app follows the table (decision in docs/RULES_QUESTIONS.md).',
    }),
    cls('Extra Attack', 'extra-attack', 5),
    cls('Salvage', 'salvage', 7, {
        effects: [{ kind: 'advantage', target: 'skill:Investigation', situation: 'searching a creature, searching for crafting resources or salvaging equipment from a wreck' }],
    }),
    cls('Analyze Hostile', 'analyze-hostile', 10),
    cls('Inferior Creatures', 'inferior-creatures', 15),
]

const CONTRAPTION_LEVEL: Record<string, number> = { 'Level 1': 1, 'Level 5': 5, 'Level 11': 11, 'Level 16': 16 }

/** Creative Mind contraptions, one selectable feature each, available from the level the source lists. */
export const contraptionFeatures: Feature[] = classText['tech-engineer-contraptions'].map((entry) => {
    const level = CONTRAPTION_LEVEL[(entry.group ?? '').replace(/\s+/g, ' ').replace(/ Contraptions$/, '')] ?? 1
    return {
        id: `contraption-${slug(entry.name)}`,
        name: entry.name,
        description: `Creative Mind Contraption (level ${level}). ${entry.text}`,
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: level,
        isActiveByDefault: false,
    }
})

/** Gadgeteering upgrades follow the same level bands, in the order the source prints them. */
const UPGRADE_LEVELS: Array<[from: string, level: number]> = [
    ['Upgraded Cleats', 1],
    ['Upgraded Map', 5],
    ['Upgraded Deep Backpack', 11],
    ['Upgraded Glider', 16],
]

export const gadgeteeringUpgradeFeatures: Feature[] = (() => {
    const entries = classText['gadgeteering-specialist'].filter((entry) => entry.name.startsWith('Upgraded '))
    let level = 1
    return entries.map((entry) => {
        level = UPGRADE_LEVELS.find(([from]) => from === entry.name)?.[1] ?? level
        return {
            id: `upgrade-${slug(entry.name)}`,
            name: entry.name,
            description: `Gadgeteering upgrade of a level ${level} contraption. ${entry.text}`,
            source: 'Subclass' as const,
            featureType: 'Passive' as const,
            levelRequirement: level,
            isActiveByDefault: false,
        }
    })
})()

const spec = (section: string, prefix: string) => (name: string, id: string, level: number, extra: Partial<Feature> & { type?: Feature['featureType'] } = {}) => {
    const { type, ...rest } = extra
    return makeFeature(section, name, { id: `subclass-${prefix}-${id}`, source: 'Subclass', level, featureType: type, extra: rest })
}

const armor = spec('armor-specialist', 'armor-specialist')
const weapons = spec('weapons-specialist', 'weapons-specialist')
const multi = spec('multidisciplinary-specialist', 'multidisciplinary-specialist')
const gadget = spec('gadgeteering-specialist', 'gadgeteering-specialist')

export const specializationFeatures: Feature[] = [
    armor('Introduction', 'armor-specialist', 3, { name: 'Armor Specialist' }),
    armor('Beginner Upgrades', 'beginner-upgrades', 3),
    armor('Experienced Upgrades', 'experienced-upgrades', 7),
    armor('Masterwork Upgrades', 'masterwork-upgrades', 13),
    armor('Pioneer Armorer', 'pioneer-armorer', 19),

    weapons('Introduction', 'weapons-specialist', 3, { name: 'Weapons Specialist' }),
    weapons('Beginner Upgrades', 'beginner-upgrades', 3),
    weapons('Experienced Upgrades', 'experienced-upgrades', 7),
    weapons('Masterwork Upgrades', 'masterwork-upgrades', 13),
    weapons('Pioneer Weaponsmith', 'pioneer-weaponsmith', 19),

    multi('Adaptive', 'adaptive', 3),
    multi('Tactical Cover', 'tactical-cover', 7, { type: 'Action', uses: 2, recharge: 'Short Rest' }),
    multi('Improved Critical', 'improved-critical', 9, {
        effects: [{ kind: 'critRange', target: 'attack', min: 19, attackKinds: ['weapon'] }],
    }),
    multi('Brains and Brawns', 'brains-and-brawns', 19),

    gadget('Craftsmanship', 'craftsmanship', 3),
    gadget('Innovative Contraptions', 'innovative-contraptions', 7, {
        description: textOf('gadgeteering-specialist', 'Innovative Contraptions')
            .split('\n')
            .filter((line) => !line.startsWith('<u>'))
            .join('\n'),
    }),
]

const specGrants = (prefix: string, rows: Array<[id: string, level: number]>) =>
    grantsOf(rows.map(([id, level]): [string, number] => [`subclass-${prefix}-${id}`, level]))

export const techEngineerSubclasses: CharacterSubclass[] = [
    {
        id: 'armor-specialist',
        classId: 'tech-engineer',
        name: 'Armor Specialist',
        description: 'Outlast an enemy by modifying armor.',
        unlockLevel: 3,
        featureGrants: specGrants('armor-specialist', [
            ['armor-specialist', 3],
            ['beginner-upgrades', 3],
            ['experienced-upgrades', 7],
            ['masterwork-upgrades', 13],
            ['pioneer-armorer', 19],
        ]),
    },
    {
        id: 'weapons-specialist',
        classId: 'tech-engineer',
        name: 'Weapons Specialist',
        description: 'The best offense may prove to be the best defense: modify weapons.',
        unlockLevel: 3,
        featureGrants: specGrants('weapons-specialist', [
            ['weapons-specialist', 3],
            ['beginner-upgrades', 3],
            ['experienced-upgrades', 7],
            ['masterwork-upgrades', 13],
            ['pioneer-weaponsmith', 19],
        ]),
    },
    {
        id: 'multidisciplinary-specialist',
        classId: 'tech-engineer',
        name: 'Multidisciplinary Specialist',
        description: 'Fuse engineering with the intelligence of weaponry.',
        unlockLevel: 3,
        featureGrants: specGrants('multidisciplinary-specialist', [
            ['adaptive', 3],
            ['tactical-cover', 7],
            ['improved-critical', 9],
            ['brains-and-brawns', 19],
        ]),
    },
    {
        id: 'gadgeteering-specialist',
        classId: 'tech-engineer',
        name: 'Gadgeteering Specialist',
        description: 'Rely on the inventions you make, and upgrade them.',
        unlockLevel: 3,
        featureGrants: specGrants('gadgeteering-specialist', [
            ['craftsmanship', 3],
            ['innovative-contraptions', 7],
        ]),
    },
]

export const techEngineerClass: CharacterClass = {
    id: 'tech-engineer',
    name: 'Tech-Engineer',
    description:
        'A non-bending inventor who uses gadgets, crafted equipment and Spark Points to stand up to even the toughest of benders. Your ability is Intelligence.',
    hitDie: 'Lineage-based',
    primaryAbility: 'Intelligence',
    bendingAbility: 'intelligence',
    savingThrows: [],
    skillChoices: { choose: 0, options: [] },
    featureGrants: grantsOf([
        ['class-tech-engineer-nimble-wit', 1],
        ['class-tech-engineer-creative-mind', 1],
        ['class-tech-engineer-universal-techniques', 1],
        ['class-tech-engineer-specialization', 3],
        ...[4, 8, 12, 16].map((level): [string, number] => ['class-tech-engineer-ability-score-improvement', level]),
        ['class-tech-engineer-extra-attack', 5],
        ['class-tech-engineer-nimble-wit-level-5', 5],
        ['class-tech-engineer-universal-techniques-improvement', 6],
        ['class-tech-engineer-universal-techniques-improvement', 13],
        ['class-tech-engineer-salvage', 7],
        ['class-tech-engineer-analyze-hostile', 10],
        ['class-tech-engineer-inferior-creatures', 15],
    ]),
    techniqueLimits: [
        {
            id: 'universal',
            label: 'Universal techniques',
            kinds: ['Universal'],
            // 2 at 1st, +1 at 6th, +1 at 13th
            maxByLevel: Array.from({ length: 20 }, (_, i) => 2 + (i + 1 >= 6 ? 1 : 0) + (i + 1 >= 13 ? 1 : 0)),
        },
    ],
    resources: [
        {
            id: 'universal-slots',
            name: 'Universal Technique Slots',
            maxByLevel: UNIVERSAL_TECHNIQUE_SLOTS,
            recharge: 'Long Rest',
            description: 'Uses of your Universal Techniques. Regained after a long rest.',
        },
        {
            id: 'spark-points',
            name: 'Spark Points',
            maxByLevel: SPARK_POINTS,
            recharge: 'Long Rest',
            description: 'Spent on Nimble Wit, Analyze Hostile, Inferior Creatures and Brains and Brawns. Regained after a long rest.',
        },
    ],
    subclassName: 'Specialization',
}
