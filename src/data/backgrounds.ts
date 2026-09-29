import type { Background } from '../types/schema'

export const backgrounds: Background[] = [
    {
        id: 'community-helper',
        name: 'Community Helper',
        description:
            'You grew up solving practical problems for neighbors, family, and local leaders, earning trust through reliability.',
        skillProficiencies: ['Insight', 'Persuasion'],
        toolProficiencies: ['Artisan Tools'],
        languages: ['Local Dialect'],
        featureIds: ['background-community-fixer'],
    },
    {
        id: 'street-survivor',
        name: 'Street Survivor',
        description:
            'You learned to survive through awareness, quick thinking, and knowing who to trust in difficult places.',
        skillProficiencies: ['Stealth', 'Investigation'],
        toolProficiencies: ['Thieves’ Tools'],
        languages: ['Underworld Cant'],
        featureIds: ['background-street-instincts'],
    },
]
