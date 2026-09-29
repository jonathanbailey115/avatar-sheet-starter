import type { Feature } from '../types/schema'

/**
 * Feats from the free 5e SRD (version 5.2), which gmbinder says it keeps ("the rest were kept the same")
 * without printing them. Owner decision: add the SRD ones now and the D&D Beyond books later.
 * These are short summaries in this app's own words, not the book text; check them against your books.
 * Every description starts with "Baseline 5e" so they are never mistaken for gmbinder rules.
 */

const feat = (id: string, name: string, description: string, extra: Partial<Feature> = {}): Feature => ({
    id: `feat-srd-${id}`,
    name,
    description: `Baseline 5e (SRD 5.2) summary. ${description}`,
    source: 'Feat',
    featureType: 'Passive',
    levelRequirement: 1,
    isActiveByDefault: false,
    ...extra,
})

export const srdFeatFeatures: Feature[] = [
    feat(
        'alert',
        'Alert',
        'Add your proficiency bonus to your initiative rolls. Immediately after you roll initiative, you can swap your initiative with a willing ally who is in the same combat.',
        { effects: [{ kind: 'bonus', target: 'initiative', value: 'proficiency' }] },
    ),
    feat(
        'savage-attacker',
        'Savage Attacker',
        'Once per turn when you hit with a weapon, you can roll the weapon’s damage dice twice and use either result.',
    ),
    feat(
        'skilled',
        'Skilled',
        'Gain proficiency in any combination of three skills or tools of your choice. You can take this feat more than once.',
    ),
    feat(
        'grappler',
        'Grappler',
        'Increase your Strength or Dexterity score by 1, to a maximum of 20. You have advantage on attack rolls against a creature you are grappling, and you can move a creature you have grappled at full speed instead of half.',
    ),
]
