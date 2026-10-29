import type { CharacterClass, Feature } from '../types/schema'
import { BENDER_ASI_LEVELS } from './classFeature'

/**
 * The Avatar class. **Stand-in draft** (owner decision AV1 in docs/RULES_QUESTIONS.md): gmbinder has lore
 * for the Avatar (all four elements, Energybending, the Avatar State) but no class, so every feature below is
 * this app's wording for the owner to edit or replace. Bending comes from taking bending classes as extra
 * classes (multiclass), either all at the start or one at a time through masters.
 */

export const AVATAR_ID = 'avatar'
const DRAFT = ' (Stand-in draft: the Avatar class is not from gmbinder.)'

const feature = (id: string, name: string, level: number, description: string, extra: Partial<Feature> = {}): Feature => ({
    id: `class-avatar-${id}`,
    name,
    description: description + DRAFT,
    source: 'Class',
    featureType: 'Passive',
    levelRequirement: level,
    isActiveByDefault: true,
    ...extra,
})

// Index 0 is level 1.
const PAST_LIFE_USES = Array.from({ length: 20 }, (_, i) => (i + 1 >= 13 ? 4 : i + 1 >= 5 ? 3 : 2))
const AVATAR_STATE_USES = Array.from({ length: 20 }, (_, i) => (i + 1 >= 17 ? 2 : i + 1 >= 8 ? 1 : 0))

export const avatarFeatures: Feature[] = [
    feature('spirit-connection', 'Spirit Connection', 1, 'You are the bridge between the material and the spirit world. You can meditate to enter the spirit world, and take others with you if they meditate beside you. You can sense nearby spirits, and spirits tend to speak to you first. Wisdom (Religion) checks use your Wisdom, as for every character.'),
    feature('past-life-guidance', 'Past Life Guidance', 1, 'The voices of past Avatars advise you. Pick a roll you or an ally within 30 feet makes (an ability check, attack or saving throw) and add a Guidance die to it after seeing the roll. The die is a d6, d8 at level 5, d10 at level 11 and d12 at level 17. Uses follow your Past Life Guidance pool and return on a long rest.', {
        featureType: 'Limited Use',
    }),
    feature('all-elements', 'Master of All Elements', 1, 'You are the only one who can bend more than one element. Take levels in bending classes as extra classes on the Class tab. If your GM lets you start with every element, take level 1 in all four. Otherwise you begin with one element and learn each new one from a master (record them, and your GM approves the class).'),
    feature('ability-score-improvement', 'Ability Score Improvement', 4, 'Gain the Ability Score Improvement feat or another feat you qualify for. Ability scores cannot pass 20 this way.'),
    feature('avatar-state', 'Avatar State', 8, 'As a bonus action, in danger or deep emotion, you enter the Avatar State for 1 minute. Stand-in effects (your GM may change them): you have Resistance to all damage, +2 to bending attack rolls and your Save DC, you cannot be Charmed or Frightened, and your technique damage dice are rolled an extra time and the highest is kept. When it ends you gain one level of Exhaustion. If you drop to 0 Hit Points while in it, it ends and you are dying as normal. Once you use it, you finish a long rest before using it again.', {
        featureType: 'Limited Use',
        uses: 1,
        recharge: 'Long Rest',
    }),
    feature('energybending', 'Energybending', 12, 'You can bend the energy of the cosmos itself. As a Magic action you can take away another creature\'s bending permanently, or restore it, by touching its spirit while in the Avatar State. This works only on a willing, restrained, or helpless creature, is a story event rather than a roll, and your GM decides every time. Once per long rest.', {
        featureType: 'Limited Use',
        uses: 1,
        recharge: 'Long Rest',
    }),
    feature('mastered-avatar-state', 'Mastering the Avatar State (GM approved)', 20, 'Very late game, and only when your GM approves (a story milestone). You can hold the Avatar State without a time limit: it no longer ends after 1 minute and you can choose when to end it. It still ends if you drop to 0 Hit Points, and ending it by choice costs no Exhaustion.'),
]

export const avatarClass: CharacterClass = {
    id: AVATAR_ID,
    name: 'Avatar',
    description:
        'The Avatar is the one who can bend all four elements and, in time, the energy of the cosmos, a bridge between the world of people and the spirit world. A stand-in draft: take bending classes as extra classes to gain each element.',
    hitDie: 'Lineage-based',
    primaryAbility: 'Wisdom',
    keyAbilities: ['wisdom'],
    multiclassAbilities: [],
    savingThrows: [],
    skillChoices: { choose: 0, options: [] },
    anyElement: true,
    playerOnly: true,
    featureGrants: [
        { featureId: 'class-avatar-spirit-connection', level: 1 },
        { featureId: 'class-avatar-past-life-guidance', level: 1 },
        { featureId: 'class-avatar-all-elements', level: 1 },
        ...BENDER_ASI_LEVELS.map((level) => ({ featureId: 'class-avatar-ability-score-improvement', level })),
        { featureId: 'class-avatar-avatar-state', level: 8 },
        { featureId: 'class-avatar-energybending', level: 12 },
        { featureId: 'class-avatar-mastered-avatar-state', level: 20 },
    ].sort((a, b) => a.level - b.level),
    resources: [
        {
            id: 'past-lives',
            name: 'Past Life Guidance',
            maxByLevel: PAST_LIFE_USES,
            recharge: 'Long Rest',
            description: 'Add a Guidance die (d6, d8 at 5, d10 at 11, d12 at 17) to a roll you or an ally within 30 feet makes. Stand-in draft.',
        },
        {
            id: 'avatar-state',
            name: 'Avatar State',
            maxByLevel: AVATAR_STATE_USES,
            recharge: 'Long Rest',
            description: 'Uses of the Avatar State. Stand-in draft.',
        },
    ],
}
