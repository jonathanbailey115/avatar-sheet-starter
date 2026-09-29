import type { Lineage } from '../types/schema'

export const lineages: Lineage[] = [
    {
        id: 'air-nomad-human',
        name: 'Air Nomads',
        nation: 'Air Nomads',
        description: 'Raised in or descended from the Air Nomad tradition.',
    },
    {
        id: 'water-tribe-human',
        name: 'Water Tribe',
        nation: 'Water Tribe',
        description: 'Connected to the cultures of the north or south.',
    },
    {
        id: 'earth-kingdom-human',
        name: 'Earth Kingdom',
        nation: 'Earth Kingdom',
        description:
            'The Earth Kingdom is the largest nation in the world. Earth is the element of substance, and its people are as diverse as they are resilient. Citizens of the Earth Nation are persistent and enduring, reflecting a neutral approach to life through neutral jing.',
        hitDiceText: '1d12 per level',
        hitPointsAtFirstLevelText: '12 + Constitution Modifier',
        hitPointsPerLevelText:
            '1d12 + Constitution Modifier per level above 1st',
        savingThrows: ['constitution'],
        savingThrowChoices: {
            choose: 1,
            options: [
                'strength',
                'dexterity',
                'intelligence',
                'wisdom',
                'charisma',
            ],
        },
        skillChoices: {
            choose: 2,
            options: [
                'Athletics',
                'Arcana',
                'History',
                'Intimidation',
                'Sleight of Hand',
                'Stealth',
                'Nature',
                'Perception',
            ],
        },
        armorProficiencies: ['Medium Armor', 'Heavy Armor', 'Shields'],
        weaponProficiencies: [
            'Simple Weapons',
            'Axes',
            'Greatswords',
            'Hammers',
            'Longswords',
            'Mauls',
            'Scimitars',
            'Spears',
            'Shields',
        ],
        toolChoices: {
            choose: 1,
            options: ['Thieves’ Tools', "Smith's Tools", 'Disguise Kit'],
        },
        allowedBendingTypes: ['Earth'],
        featureIds: [
            'lineage-earth-kingdom-unarmored-defense',
            'lineage-earth-kingdom-lay-of-the-land',
        ],
    },
    {
        id: 'fire-nation-human',
        name: 'Fire Nation',
        nation: 'Fire Nation',
        description: 'Descended from the disciplined and ambitious Fire Nation.',
    },
]
