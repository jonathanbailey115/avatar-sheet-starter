import type { CharacterClass, CharacterSubclass, Feature } from '../types/schema'
import { BENDER_TECHNIQUE_SLOTS } from './benderTable'
import { BENDER_ASI_LEVELS, asiNote, grantsOf, makeFeature } from './classFeature'

/**
 * Waterbending class and its three Paths (gmbinder, Waterbending). Wording is extracted from the
 * source; levels and effects are authored here.
 */

const W = 'waterbending'
const cls = (name: string, id: string, level: number, extra: Partial<Feature> & { type?: Feature['featureType']; note?: string } = {}) => {
    const { type, note, ...rest } = extra
    return makeFeature(W, name, { id: `class-waterbending-${id}`, source: 'Class', level, featureType: type, note, extra: rest })
}
const path = (section: string, prefix: string) => (name: string, id: string, level: number, extra: Partial<Feature> & { type?: Feature['featureType'] } = {}) => {
    const { type, ...rest } = extra
    return makeFeature(section, name, { id: `subclass-${prefix}-${id}`, source: 'Subclass', level, featureType: type, extra: rest })
}

export const waterbendingFeatures: Feature[] = [
    cls('Flow', 'flow', 1),
    cls('Shape Water', 'shape-water', 1),
    cls('Waterbending Teachings', 'teachings', 3),
    cls('Ability Score Improvement', 'ability-score-improvement', 4, { note: asiNote('Waterbending') }),
    cls('Extra Attack', 'extra-attack', 5),
    cls('Tidal Efficiency', 'tidal-efficiency', 5),
    cls('Rare Techniques', 'rare-techniques', 8),
    cls('Oceanic Master', 'oceanic-master', 11),
    cls('Call of the Waves', 'call-of-the-waves', 19),
]

const waterbender = path('path-of-the-waterbender', 'path-of-the-waterbender')
const healer = path('path-of-the-healer', 'path-of-the-healer')
const bloodbender = path('path-of-the-bloodbender', 'path-of-the-bloodbender')

export const waterbendingPathFeatures: Feature[] = [
    // Path of the Waterbender
    waterbender('Ebb', 'ebb', 3),
    waterbender('Fluidity', 'fluidity', 7, {
        effects: [{ kind: 'advantage', target: 'check:charisma', situation: 'a check to shift water into ice or vapor' }],
    }),
    waterbender('Cutting Edge', 'cutting-edge', 10),
    waterbender('La’s Calling', 'las-calling', 18, { featureType: 'Limited Use', uses: 1, recharge: 'Long Rest' }),

    // Path of the Healer
    healer('Energy Balancing', 'energy-balancing', 3),
    healer('Water Swell', 'water-swell', 7),
    healer('Field Medic', 'field-medic', 15),
    healer('Body Heat Manipulation', 'body-heat-manipulation', 18, { featureType: 'Limited Use', uses: 2, recharge: 'Long Rest' }),

    // Path of the Bloodbender
    bloodbender('Hematopoiesis', 'hematopoiesis', 3),
    bloodbender('Chi Clotting', 'chi-clotting', 7),
    bloodbender('Puppeteer', 'puppeteer', 10),
    bloodbender('Psychic Bloodbending', 'psychic-bloodbending', 18),
]

export const waterbendingSubclasses: CharacterSubclass[] = [
    {
        id: 'path-of-the-waterbender',
        classId: 'waterbending',
        name: 'Path of the Waterbender',
        description: 'The warrior path of waterbending: ice, tides and a high damage output.',
        unlockLevel: 3,
        featureGrants: grantsOf([
            ['subclass-path-of-the-waterbender-ebb', 3],
            ['subclass-path-of-the-waterbender-fluidity', 7],
            ['subclass-path-of-the-waterbender-cutting-edge', 10],
            ['subclass-path-of-the-waterbender-las-calling', 18],
        ]),
    },
    {
        id: 'path-of-the-healer',
        classId: 'waterbending',
        name: 'Path of the Healer',
        description: 'Healing through water: the lifeline of the party.',
        unlockLevel: 3,
        featureGrants: grantsOf([
            ['subclass-path-of-the-healer-energy-balancing', 3],
            ['subclass-path-of-the-healer-water-swell', 7],
            ['subclass-path-of-the-healer-field-medic', 15],
            ['subclass-path-of-the-healer-body-heat-manipulation', 18],
        ]),
    },
    {
        id: 'path-of-the-bloodbender',
        classId: 'waterbending',
        name: 'Path of the Bloodbender',
        description: 'Bending the water inside living bodies. Lethal and physically taxing.',
        unlockLevel: 3,
        disciplines: ['Bloodbending'],
        featureGrants: grantsOf([
            ['subclass-path-of-the-bloodbender-hematopoiesis', 3],
            ['subclass-path-of-the-bloodbender-chi-clotting', 7],
            ['subclass-path-of-the-bloodbender-puppeteer', 10],
            ['subclass-path-of-the-bloodbender-psychic-bloodbending', 18],
        ]),
    },
]

export const waterbendingClass: CharacterClass = {
    id: 'waterbending',
    name: 'Waterbending',
    description:
        'You are Proficient in Waterbending and your Bending Ability is Charisma. Waterbenders shift water between ice, liquid and steam, and flow from one technique to the next.',
    hitDie: 'Lineage-based',
    primaryAbility: 'Charisma',
    savingThrows: [],
    skillChoices: { choose: 0, options: [] },
    featureGrants: grantsOf([
        ['class-waterbending-flow', 1],
        ['class-waterbending-shape-water', 1],
        ['class-waterbending-teachings', 3],
        ...BENDER_ASI_LEVELS.map((level): [string, number] => ['class-waterbending-ability-score-improvement', level]),
        ['class-waterbending-extra-attack', 5],
        ['class-waterbending-tidal-efficiency', 5],
        ['class-waterbending-rare-techniques', 8],
        ['class-waterbending-oceanic-master', 11],
        ['class-waterbending-call-of-the-waves', 19],
    ]),
    techniqueLimits: [
        {
            id: 'known',
            label: 'Known techniques',
            kinds: ['Water', 'Universal'],
            maxByLevel: BENDER_TECHNIQUE_SLOTS.map((row) => row.known),
        },
    ],
    resources: [
        {
            id: 'oceanic-master',
            name: 'Oceanic Master rerolls',
            maxByLevel: Array.from({ length: 20 }, (_, i) => (i + 1 >= 16 ? 5 : i + 1 >= 11 ? 3 : 0)),
            recharge: 'Long Rest',
            description: 'Re-roll the Charisma Check when changing water to ice or steam. Regained after a long rest.',
        },
    ],
    subclassName: 'Waterbending Path',
    element: 'Water',
    bendingAbility: 'charisma',
    basicAttack: { dice: '1d8' },
    techniqueSlots: BENDER_TECHNIQUE_SLOTS,
}
