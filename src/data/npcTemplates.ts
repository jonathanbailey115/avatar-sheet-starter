import type { NpcTemplate } from '../types/schema'

export const npcTemplates: NpcTemplate[] = [
    {
        role: 'Guard',
        combat: 0.9,
        nationWeights: {
            'Earth Kingdom': 4,
            'Fire Nation': 3,
            'Water Tribe': 2,
            'Air Nomads': 1,
        },
        bendingWeights: {
            'Non-Bender': 5,
            Earth: 2,
            Fire: 2,
            Water: 1,
            Air: 1,
        },
    },
    {
        role: 'Scholar',
        combat: 0.1,
        nationWeights: {
            'Earth Kingdom': 2,
            'Fire Nation': 2,
            'Water Tribe': 2,
            'Air Nomads': 2,
        },
        bendingWeights: {
            'Non-Bender': 6,
            Earth: 1,
            Fire: 1,
            Water: 1,
            Air: 1,
        },
    },
    {
        role: 'Street Fighter',
        combat: 0.7,
        nationWeights: {
            'Earth Kingdom': 3,
            'Fire Nation': 2,
            'Water Tribe': 2,
            'Air Nomads': 1,
        },
        bendingWeights: {
            'Non-Bender': 4,
            Earth: 2,
            Fire: 2,
            Water: 1,
            Air: 1,
        },
    },
]