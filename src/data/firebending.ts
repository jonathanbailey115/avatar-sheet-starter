import type { CharacterClass, CharacterSubclass, Feature } from '../types/schema'
import { BENDER_TECHNIQUE_SLOTS } from './benderTable'
import { BENDER_ASI_LEVELS, asiNote, grantsOf, makeFeature } from './classFeature'

/**
 * Firebending class and its two Principles (gmbinder, Firebending). Wording is extracted from the
 * source; levels and effects are authored here.
 */

const F = 'firebending'
const cls = (name: string, id: string, level: number, extra: Partial<Feature> & { type?: Feature['featureType']; note?: string } = {}) => {
    const { type, note, ...rest } = extra
    return makeFeature(F, name, { id: `class-firebending-${id}`, source: 'Class', level, featureType: type, note, extra: rest })
}
const principle = (section: string, prefix: string) => (name: string, id: string, level: number, extra: Partial<Feature> & { type?: Feature['featureType']; note?: string } = {}) => {
    const { type, note, ...rest } = extra
    return makeFeature(section, name, { id: `subclass-${prefix}-${id}`, source: 'Subclass', level, featureType: type, note, extra: rest })
}

export const firebendingFeatures: Feature[] = [
    cls('The Flame Within', 'the-flame-within', 1),
    cls('Dragon’s Blessing', 'dragons-blessing', 1),
    cls('Action Surge', 'action-surge', 2),
    cls('Firebending Principle', 'principle', 3),
    cls('Ability Score Improvement', 'ability-score-improvement', 4, { note: asiNote('Firebending') }),
    cls('Extra Attack', 'extra-attack', 5),
    cls('Evasion', 'evasion', 5),
    cls('Rare Techniques', 'rare-techniques', 8),
]

const firebender = principle('principles-of-the-firebender', 'principles-of-the-firebender')
const combustion = principle('principles-of-the-combustionbender', 'principles-of-the-combustionbender')

export const firebendingPrincipleFeatures: Feature[] = [
    firebender('Positive Jing', 'positive-jing', 3, { type: 'Reaction' }),
    firebender('Jet Stepping', 'jet-stepping', 7, { type: 'Bonus Action' }),
    firebender('Dragon’s Flame', 'dragons-flame', 10),
    firebender('Eternal Flame', 'eternal-flame', 18),

    combustion('Telekinetic Firebending', 'telekinetic-firebending', 3, {
        note: 'gmbinder says "Starting at level 1" here, but this Principle is chosen at level 3. This app grants it at 3 (docs/RULES_QUESTIONS.md).',
    }),
    combustion('Collateral Damage', 'collateral-damage', 7),
    combustion('Eye Can See You', 'eye-can-see-you', 10),
    combustion('Sparky Sparky Boom Boom', 'sparky-sparky-boom-boom', 18, { type: 'Limited Use', uses: 2, recharge: 'Long Rest' }),
]

export const firebendingSubclasses: CharacterSubclass[] = [
    {
        id: 'principles-of-the-firebender',
        classId: 'firebending',
        name: 'Principles of the Firebender',
        description: 'Advance and attack whenever you see an opening.',
        unlockLevel: 3,
        featureGrants: grantsOf([
            ['subclass-principles-of-the-firebender-positive-jing', 3],
            ['subclass-principles-of-the-firebender-jet-stepping', 7],
            ['subclass-principles-of-the-firebender-dragons-flame', 10],
            ['subclass-principles-of-the-firebender-eternal-flame', 18],
        ]),
    },
    {
        id: 'principles-of-the-combustionbender',
        classId: 'firebending',
        name: 'Principles of the Combustionbender',
        description: 'Volatile, focused combustion beams that curve around cover and shatter terrain.',
        unlockLevel: 3,
        disciplines: ['Combustionbending'],
        featureGrants: grantsOf([
            ['subclass-principles-of-the-combustionbender-telekinetic-firebending', 3],
            ['subclass-principles-of-the-combustionbender-collateral-damage', 7],
            ['subclass-principles-of-the-combustionbender-eye-can-see-you', 10],
            ['subclass-principles-of-the-combustionbender-sparky-sparky-boom-boom', 18],
        ]),
    },
]

export const firebendingClass: CharacterClass = {
    id: 'firebending',
    name: 'Firebending',
    description:
        'You are Proficient in Firebending and your Bending Ability is Strength. Firebenders dish out high damage in a short time, driven by a burning purpose.',
    hitDie: 'Lineage-based',
    primaryAbility: 'Strength',
    savingThrows: [],
    skillChoices: { choose: 0, options: [] },
    featureGrants: grantsOf([
        ['class-firebending-the-flame-within', 1],
        ['class-firebending-dragons-blessing', 1],
        ['class-firebending-action-surge', 2],
        ['class-firebending-principle', 3],
        ...BENDER_ASI_LEVELS.map((level): [string, number] => ['class-firebending-ability-score-improvement', level]),
        ['class-firebending-extra-attack', 5],
        ['class-firebending-evasion', 5],
        ['class-firebending-rare-techniques', 8],
    ]),
    techniqueLimits: [
        {
            id: 'known',
            label: 'Known techniques',
            kinds: ['Fire', 'Universal'],
            maxByLevel: BENDER_TECHNIQUE_SLOTS.map((row) => row.known),
        },
    ],
    resources: [
        {
            id: 'action-surge',
            name: 'Action Surge',
            // Once from 2nd level, twice from 16th.
            maxByLevel: Array.from({ length: 20 }, (_, i) => (i + 1 >= 16 ? 2 : i + 1 >= 2 ? 1 : 0)),
            recharge: 'Short Rest',
            description: 'One additional action on your turn. Regained after a short or long rest.',
        },
    ],
    subclassName: 'Firebending Principle',
    element: 'Fire',
    bendingAbility: 'strength',
    basicAttack: { dice: '1d10', damageType: 'fire' },
    techniqueSlots: BENDER_TECHNIQUE_SLOTS,
}
