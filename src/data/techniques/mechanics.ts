import type { Technique } from '../../types/schema'

/**
 * Hand-authored mechanics for techniques, keyed by technique id. Layered over the extracted
 * text so re-running the extractor never loses them. Only techniques whose rules are clear
 * enough to roll are listed; the rest are shown as text.
 *
 * Damage "per level" comes from the technique's own "for each level above Practiced ..." text.
 */
export type TechniqueMechanics = Pick<
    Technique,
    'resolution' | 'save' | 'damage' | 'mechanicsNote'
>

const affinity = { ability: 'affinity' } as const

export const techniqueMechanics: Record<string, TechniqueMechanics> = {
    // ---- Earthbending ----
    'earth-eat-dirt': {
        resolution: 'save',
        save: { ability: 'affinity', fallback: 'strength' },
        damage: [{ base: '1d10', perLevel: '1d10', type: 'bludgeoning', onSave: 'unaffected' }],
        mechanicsNote: 'The damage always applies. The save only resists the push. Blinding uses a Constitution save.',
    },
    'earth-earth-smash': {
        resolution: 'none',
        damage: [
            {
                label: 'Damage negated',
                base: '',
                byLevel: { Practiced: '1d6', Trained: '2d6', Mastered: '4d6' },
                type: '',
                addModifier: true,
                onSave: 'unaffected',
            },
        ],
    },
    'earth-earth-launch': { resolution: 'save', save: affinity },
    'earth-ground-shift': { resolution: 'save', save: affinity },
    'earth-quicksand': { resolution: 'save', save: { ability: 'affinity', fallback: 'strength' } },
    'earth-rock-column': {
        resolution: 'save',
        save: affinity,
        damage: [{ label: 'If the column has under 20 ft of room', base: '3d12', type: 'bludgeoning', onSave: 'half' }],
    },
    'earth-rock-glove': {
        resolution: 'save',
        save: affinity,
        damage: [{ label: 'Thrown glove', base: '1d8', perLevel: '1d8', type: 'bludgeoning', onSave: 'negates' }],
        mechanicsNote: 'Mastered text is ambiguous about total damage (see docs/RULES_QUESTIONS.md B19).',
    },
    'earth-sand-spout': {
        resolution: 'save',
        save: affinity,
        damage: [{ base: '2d8', type: 'bludgeoning', onSave: 'negates' }],
        mechanicsNote: 'Sandbenders have advantage on the save.',
    },
    'earth-shatter': {
        resolution: 'save',
        save: { ability: 'dexterity' },
        damage: [{ base: '3d10', perLevel: '1d10', type: 'piercing', onSave: 'half' }],
    },
    'earth-tectonic-rift': {
        resolution: 'save',
        save: affinity,
        damage: [{ label: 'Mastered reaction', base: '', byLevel: { Mastered: '5d6' }, type: 'bludgeoning', onSave: 'unaffected' }],
    },
    'earth-tremors': {
        resolution: 'save',
        save: affinity,
        damage: [{ base: '3d8', perLevel: '1d8', type: 'bludgeoning', onSave: 'half' }],
    },
    'earth-earthquake': {
        resolution: 'save',
        save: affinity,
        damage: [{ base: '5d6', type: 'bludgeoning', onSave: 'half' }],
    },
    'earth-land-of-spikes': {
        resolution: 'save',
        save: affinity,
        damage: [{ base: '6d6', perLevel: '1d6', type: 'piercing', onSave: 'half' }],
    },
    'earth-meteor-fall': {
        resolution: 'save',
        save: { ability: 'dexterity' },
        damage: [{ base: '5d10', perLevel: '1d10', type: 'bludgeoning', onSave: 'negates' }],
    },
    'earth-earth-sinking': {
        resolution: 'save',
        save: { ability: 'affinity', fallback: 'dexterity' },
        damage: [{ label: 'Initial damage', base: '1d10', type: 'bludgeoning', onSave: 'negates' }],
        mechanicsNote: 'Suffocation damage each later turn is on the technique text.',
    },
    'earth-rapid-tunneling': {
        resolution: 'save',
        save: affinity,
        damage: [{ base: '5d10', perLevel: '1d10', type: 'bludgeoning', onSave: 'negates' }],
    },
    'earth-sinkhole': {
        resolution: 'save',
        save: affinity,
        damage: [{ label: 'At Mastered', base: '', byLevel: { Mastered: '2d10' }, type: 'bludgeoning', onSave: 'unaffected' }],
    },
    'earth-summon-the-storm': {
        resolution: 'none',
        damage: [{ label: 'After 2 rounds in the storm', base: '5d12', type: 'bludgeoning', onSave: 'unaffected' }],
    },

    // ---- Universal ----
    'universal-fear': { resolution: 'save', save: { ability: 'wisdom' } },
    'universal-taunt': { resolution: 'save', save: { ability: 'wisdom' } },
    'universal-vicious-mockery': {
        resolution: 'save',
        save: { ability: 'wisdom' },
        damage: [{ base: '1d4', type: 'psychic', onSave: 'negates' }],
    },
    'universal-cutting-words': {
        resolution: 'none',
        damage: [{ label: 'Subtracted from the roll', base: '1d10', type: '', onSave: 'unaffected' }],
    },
    'universal-monologue': {
        resolution: 'none',
        damage: [{ label: 'Bonus die until your next turn', base: '1d10', type: '', onSave: 'unaffected' }],
    },
}
