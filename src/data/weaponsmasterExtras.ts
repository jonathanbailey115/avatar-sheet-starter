import type { Feature } from '../types/schema'

/** Weaponsmaster table rows the first data pass left out (gmbinder, Weaponsmaster). */
export const weaponsmasterExtraFeatures: Feature[] = [
    {
        id: 'class-weaponsmaster-journeymans-lesson-feature',
        name: 'Journeyman’s Lesson Feature',
        description:
            'Every 3 levels (4th, 7th, 10th, 13th, 16th and 19th), you can choose to get a new Basic Fighting Technique, swap a Fighting Technique that you already use with another Basic Fighting Technique or level up an existing one to Trained. You can not level up Fighting Techniques to Master using Journeyman’s Lesson.',
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: 4,
        isActiveByDefault: true,
    },
    {
        id: 'class-weaponsmaster-adapted-fighting-feature',
        name: 'Adapted Fighting Feature',
        description: 'At level 10, you can use Adapted Fighting on attacks you make with your reaction.',
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: 10,
        isActiveByDefault: true,
    },
]

export const weaponsmasterExtraGrants = [
    { featureId: 'class-weaponsmaster-journeymans-lesson-feature', level: 4 },
    { featureId: 'class-weaponsmaster-adapted-fighting-feature', level: 10 },
]
