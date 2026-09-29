import type { CharacterClass, CharacterSubclass } from '../types/schema'
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
            'You are proficient in Earthbending and your Bending Ability is Constitution. (Class features are added in a later update; technique slots work now.)',
        hitDie: 'Lineage-based',
        primaryAbility: 'Constitution',
        savingThrows: [],
        skillChoices: { choose: 0, options: [] },
        featureGrants: [],
        subclassName: 'Earthbending Tradition',
        element: 'Earth',
        techniqueSlots: BENDER_TECHNIQUE_SLOTS,
    },
]

export const characterSubclasses: CharacterSubclass[] = []
