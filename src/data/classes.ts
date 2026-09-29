import type { CharacterClass, CharacterSubclass } from '../types/schema'
import { airbendingClass } from './airbending'
import { BENDER_ASI_LEVELS } from './classFeature'
import { earthbendingSubclasses } from './earthbending'
import { firebendingClass, firebendingSubclasses } from './firebending'
import { techEngineerClass, techEngineerSubclasses } from './techEngineer'
import { waterbendingClass, waterbendingSubclasses } from './waterbending'
import { weaponsmasterExtraGrants } from './weaponsmasterExtras'
import {
    BENDER_TECHNIQUE_SLOTS,
    COMBAT_EXPERTISE_POINTS,
    UNIVERSAL_TECHNIQUE_SLOTS,
    WEAPONSMASTER_ACTION_SURGE,
} from './benderTable'

export const characterClasses: CharacterClass[] = [
    {
        id: 'weaponsmaster',
        name: 'Weaponsmaster',
        description:
            'A versatile and clever non-bending fighter who uses weapons, discipline, and combat expertise to strike down opponents in a world where bending rules the battlefield.',
        hitDie: 'Lineage-based',
        primaryAbility: 'Strength or Dexterity',
        bendingAbility: 'dexterity',
        savingThrows: [],
        skillChoices: {
            choose: 0,
            options: [],
        },
        featureGrants: [
            { featureId: 'class-weaponsmaster-adapted-fighting', level: 1 },
            { featureId: 'class-weaponsmaster-journeymans-lesson', level: 1 },
            { featureId: 'class-weaponsmaster-universal-techniques', level: 1 },
            { featureId: 'class-weaponsmaster-action-surge', level: 3 },
            { featureId: 'class-weaponsmaster-ability-score-improvement', level: 4 },
            { featureId: 'class-weaponsmaster-extra-attack', level: 5 },
            { featureId: 'class-weaponsmaster-universal-techniques-improvement', level: 6 },
            { featureId: 'class-weaponsmaster-quickdraw', level: 7 },
            { featureId: 'class-weaponsmaster-ability-score-improvement', level: 8 },
            { featureId: 'class-weaponsmaster-interrupt', level: 9 },
            { featureId: 'class-weaponsmaster-superior-critical', level: 11 },
            { featureId: 'class-weaponsmaster-ability-score-improvement', level: 12 },
            { featureId: 'class-weaponsmaster-survivor', level: 15 },
            { featureId: 'class-weaponsmaster-ability-score-improvement', level: 16 },
            ...weaponsmasterExtraGrants,
        ].sort((a, b) => a.level - b.level),
        techniqueLimits: [
            {
                id: 'universal',
                label: 'Universal techniques',
                kinds: ['Universal'],
                // 2 at 1st, +1 at 6th, +1 at 13th
                maxByLevel: Array.from({ length: 20 }, (_, i) => 2 + (i + 1 >= 6 ? 1 : 0) + (i + 1 >= 13 ? 1 : 0)),
            },
            {
                id: 'fighting',
                label: 'Fighting techniques',
                kinds: ['Fighting'],
                // Journeyman's Lesson: one at 1st and one more every 3 levels
                maxByLevel: Array.from({ length: 20 }, (_, i) => Math.floor(i / 3) + 1),
            },
        ],
        resources: [
            {
                id: 'combat-expertise',
                name: 'Combat Expertise Points',
                maxByLevel: COMBAT_EXPERTISE_POINTS,
                recharge: 'Long Rest',
                description: 'Spend on Adapted Fighting and fighting techniques. Regained after a long rest.',
            },
            {
                id: 'universal-slots',
                name: 'Universal Technique Slots',
                maxByLevel: UNIVERSAL_TECHNIQUE_SLOTS,
                recharge: 'Long Rest',
                description: 'Uses of your Universal Techniques. Regained after a long rest.',
            },
            {
                id: 'action-surge',
                name: 'Action Surge',
                maxByLevel: WEAPONSMASTER_ACTION_SURGE,
                recharge: 'Short Rest',
                description: 'One additional action on your turn. Regained after a short or long rest.',
            },
        ],
    },
    {
        id: 'earthbending',
        name: 'Earthbending',
        description:
            'You are Proficient in Earthbending and your Bending Ability is Constitution. Earthbenders move stone, sand and earth, fight from firm ground, and wait for the perfect moment to strike.',
        hitDie: 'Lineage-based',
        primaryAbility: 'Constitution',
        savingThrows: [],
        skillChoices: { choose: 0, options: [] },
        featureGrants: [
            { featureId: 'class-earthbending-grounded', level: 1 },
            { featureId: 'class-earthbending-move-earth', level: 1 },
            { featureId: 'class-earthbending-tradition', level: 3 },
            ...BENDER_ASI_LEVELS.map((level) => ({ featureId: 'class-earthbending-ability-score-improvement', level })),
            { featureId: 'class-earthbending-extra-attack', level: 5 },
            { featureId: 'class-earthbending-neutral-jing', level: 5 },
            { featureId: 'class-earthbending-rare-techniques', level: 8 },
            { featureId: 'class-earthbending-resilient', level: 11 },
        ].sort((a, b) => a.level - b.level),
        techniqueLimits: [
            {
                id: 'known',
                label: 'Known techniques',
                kinds: ['Earth', 'Universal'],
                maxByLevel: BENDER_TECHNIQUE_SLOTS.map((row) => row.known),
            },
        ],
        subclassName: 'Earthbending Tradition',
        element: 'Earth',
        bendingAbility: 'constitution',
        basicAttack: { dice: '1d8', damageType: 'bludgeoning' },
        techniqueSlots: BENDER_TECHNIQUE_SLOTS,
    },
    techEngineerClass,
    waterbendingClass,
    firebendingClass,
    airbendingClass,
]

export const characterSubclasses: CharacterSubclass[] = [
    ...earthbendingSubclasses,
    ...techEngineerSubclasses,
    ...waterbendingSubclasses,
    ...firebendingSubclasses,
]
