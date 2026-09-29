import type { CharacterClass, Feature } from '../types/schema'
import { BENDER_TECHNIQUE_SLOTS } from './benderTable'
import { BENDER_ASI_LEVELS, asiNote, grantsOf, makeFeature } from './classFeature'

/**
 * Airbending class (gmbinder, Airbending). The source gives Airbenders no Teaching, Path or
 * Principle and no Extra Attack, so this class has no subclass. Wording is extracted from the
 * source; levels and effects are authored here.
 */

const A = 'airbending'
const cls = (name: string, id: string, level: number, extra: Partial<Feature> & { type?: Feature['featureType']; note?: string } = {}) => {
    const { type, note, ...rest } = extra
    return makeFeature(A, name, { id: `class-airbending-${id}`, source: 'Class', level, featureType: type, note, extra: rest })
}

export const airbendingFeatures: Feature[] = [
    cls('Spiritual Maledict', 'spiritual-maledict', 1),
    cls('Meditation', 'meditation', 1),
    cls('Gust', 'gust', 1),
    cls('Temperature Regulation', 'temperature-regulation', 1),
    cls('Extension of Body', 'extension-of-body', 1),
    cls('Spiritual Companion (Optional)', 'spiritual-companion', 1, { name: 'Spiritual Companion (Optional)' }),
    cls('Ability Score Improvement', 'ability-score-improvement', 4, { note: asiNote('Airbending') }),
    cls('Feather Fall', 'feather-fall', 4, { type: 'Reaction' }),
    cls('Mastery Tattoos (Optional)', 'mastery-tattoos', 1, { name: 'Mastery Tattoos (Optional)' }),
    cls('Stillness of Mind', 'stillness-of-mind', 7),
    cls('Rare Techniques', 'rare-techniques', 8),
    cls('Quick Reflexes', 'quick-reflexes', 10, {
        effects: [{ kind: 'bonus', target: 'initiative', value: { ability: 'wisdom' } }],
    }),
    cls('Last Resort', 'last-resort', 11),
    cls('Another Path', 'another-path', 18, { type: 'Reaction' }),
]

export const airbendingClass: CharacterClass = {
    id: 'airbending',
    name: 'Airbending',
    description:
        'You are Proficient in Airbending and your Bending Ability is Wisdom. Airbenders draw on a strong connection to nature, the spirits and their higher self.',
    hitDie: 'Lineage-based',
    primaryAbility: 'Wisdom',
    savingThrows: [],
    skillChoices: { choose: 0, options: [] },
    featureGrants: grantsOf([
        ['class-airbending-spiritual-maledict', 1],
        ['class-airbending-meditation', 1],
        ['class-airbending-gust', 1],
        ['class-airbending-temperature-regulation', 1],
        ['class-airbending-extension-of-body', 1],
        ['class-airbending-spiritual-companion', 1],
        ['class-airbending-mastery-tattoos', 1],
        ...BENDER_ASI_LEVELS.map((level): [string, number] => ['class-airbending-ability-score-improvement', level]),
        ['class-airbending-feather-fall', 4],
        ['class-airbending-stillness-of-mind', 7],
        ['class-airbending-rare-techniques', 8],
        ['class-airbending-quick-reflexes', 10],
        ['class-airbending-last-resort', 11],
        ['class-airbending-another-path', 18],
    ]),
    techniqueLimits: [
        {
            id: 'known',
            label: 'Known techniques',
            kinds: ['Air', 'Universal'],
            maxByLevel: BENDER_TECHNIQUE_SLOTS.map((row) => row.known),
        },
    ],
    element: 'Air',
    bendingAbility: 'wisdom',
    // "with your GM's permission" an Airbender may use Dexterity instead (gmbinder, Airbending).
    altBendingAbility: 'dexterity',
    basicAttack: { dice: '1d6', damageType: 'thunder' },
    techniqueSlots: BENDER_TECHNIQUE_SLOTS,
}
