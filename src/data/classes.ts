import type { CharacterClass, CharacterSubclass } from '../types/schema'

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
    },
]

export const characterSubclasses: CharacterSubclass[] = []
