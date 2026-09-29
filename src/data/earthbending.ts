import type { CharacterSubclass, Feature } from '../types/schema'

/**
 * Earthbending class and Tradition of Earthbending features (gmbinder, Earthbending).
 * Metalbending and Lavabending Traditions are not included yet.
 * Ability Score Improvement follows the Benders class table (4th, 9th, 12th, 16th, 19th).
 */

const passive = (
    id: string,
    name: string,
    source: Feature['source'],
    levelRequirement: number,
    description: string,
    extra: Partial<Feature> = {},
): Feature => ({
    id,
    name,
    description,
    source,
    featureType: 'Passive',
    levelRequirement,
    isActiveByDefault: true,
    ...extra,
})

export const earthbendingFeatures: Feature[] = [
    passive(
        'class-earthbending-grounded',
        'Grounded',
        'Class',
        1,
        'You are naturally drawn to the call of the land. Starting at level 1, you can bend any Earthbending Technique that has the “Ranged” property in a 35 ft radius sphere centered on you. This is your maximum bending range. You can still bend abilities that have a range increment larger than your bending range however you can only bend them at your maximum Grounded range. You can not bend beyond the range of Grounded.\nAt level 5, radius is increased to 60 ft. At level 10, radius is increased to 100 ft. At level 15, radius is increased to 120 ft.\nAs a bonus action you can move earth that has been artificially created in any direction within your range.\nAdditionally, you also gain the following abilities within you grounded bending range:\n- Terrain Creator: Earth you create remains in place unless manipulated by nature or another earthbender.\n- Material Manipulation: Earthbending is not limited to rock or soil alone. An earthbender can also manipulate coal, gems, crystals, chalk, salt and other earth-based materials, like meteorites and jennamite.\n- Earthen Hut: As an action, jut out two slabs that cross each other to create shelter if needed. The maximum area of the hut can be 30 x 30 ft.',
    ),
    passive(
        'class-earthbending-move-earth',
        'Move Earth',
        'Class',
        1,
        'Starting at level 1, as a bonus action you can move up to 10ft cubed of earth, sand, crystal or clay (if your a metalbender or lavabender, metal and lava as well) to any location within your Grounded bending range. It is considered a projectile. If you move it to an occupied location, all affected creatures must make an Elemental Affinity Saving Throw. On a fail, they take 1d8 + your Constitution Modifier bludgeoning damage per 5ft cubed of earth you hit them with.\nEarthbenders can attempt to stop the Earth you move by making a Constitution Check vs your Save DC. On a fail, they take full damage however on a success they take no damage. The amount of Earth you can move increases by 10ft cubed each time your Grounded bending range increases.',
        { featureType: 'Bonus Action' },
    ),
    passive(
        'class-earthbending-tradition',
        'Earthbending Tradition',
        'Class',
        3,
        'When you reach level 3, you can choose a tradition best suited for your earthbending style.',
    ),
    passive(
        'class-earthbending-ability-score-improvement',
        'Ability Score Improvement',
        'Class',
        4,
        'When you reach 4th, 9th, 12th, 16th and 19th level you may increase one of your abilities by 2 points or two of your abilities by 1 point. You can’t increase your abilities above 20 using this feature. (The Earthbending text says 8th level; the Benders class table says 9th. This app follows the table.)',
    ),
    passive(
        'class-earthbending-extra-attack',
        'Extra Attack',
        'Class',
        5,
        'Beginning at 5th level, you can attack twice, instead of once, whenever you take the Attack action on your turn.',
    ),
    passive(
        'class-earthbending-neutral-jing',
        'Neutral Jing',
        'Class',
        5,
        'Starting at level 5, you have advantage on your Saving Throws against any creature that takes their turn before you in the initiative order.\nAdditionally, attacks you make by using your reaction have advantage.',
        {
            effects: [
                {
                    kind: 'advantage',
                    target: 'saves',
                    situation: 'against a creature that takes its turn before you in the initiative order',
                },
                { kind: 'advantage', target: 'attack', situation: 'an attack made with your reaction' },
            ],
        },
    ),
    passive(
        'class-earthbending-rare-techniques',
        'Rare Techniques',
        'Class',
        8,
        'Starting at level 8, you can now attempt to learn Rare Techniques',
    ),
    passive(
        'class-earthbending-resilient',
        'Resilient',
        'Class',
        11,
        'Hold your ground even against formidable force. Starting at level 11, whenever you are knocked prone you can use your reaction and choose to make a Constitution Saving Throw vs the attack roll, Athletics Check or Save DC of the technique. On a success, you aren’t knocked prone.',
        { featureType: 'Reaction' },
    ),

    // Tradition of Earthbending
    passive(
        'subclass-tradition-of-earthbending-terrain-engineer',
        'Terrain Engineer',
        'Subclass',
        3,
        'Starting at level 3 any area that is considered difficult terrain doesn’t affect you. Additionally, as a bonus action you can transform any patch of land within your Grounded bending radius into difficult terrain. The patch of difficult terrain has a maximum of 10 ft diameter.',
    ),
    passive(
        'subclass-tradition-of-earthbending-reflect-missiles',
        'Reflect Missiles',
        'Subclass',
        7,
        'Waiting for the perfect moment to strike is at the core of Earthbending and you fight by such principles. Starting at level 7, you can use your reaction to attempt to send a projectile that you can bend, back at a creature. Whenever you do so, you take 1d6 + your Constitution Modifier + your Earthbending level less damage from the projectile and send it back at a creature. The projectile counts as a basic attack and you must roll for a new attack for the projectile, on hit the damage is increased by an amount equal to the roll above.',
        { featureType: 'Reaction' },
    ),
    passive(
        'subclass-tradition-of-earthbending-my-turf',
        'My Turf',
        'Subclass',
        15,
        'Starting at level 15 if there is difficult terrain in your Grounded bending radius you can further vandalize that patch of land and turn it into Hard Terrain. Creatures on hard terrain, in addition to the negativities of difficult terrain, have disadvantage on their Saving Throws if they are on the ground. Creatures that are flying aren’t affected by Hard Terrain.\nAdditionally, whenever you apply difficult terrain to terrain that is already difficult terrain the terrain instantly becomes hard terrain.\nAdditionally, you are no longer affected by difficult terrain.',
    ),
    passive(
        'subclass-tradition-of-earthbending-badgermoles-endurance',
        'Badgermole’s Endurance',
        'Subclass',
        18,
        'At 18th level, once per long rest if you are ever reduced to 0 hit points you can use your reaction to instead drop to 1 hit point. Additionally, you gain advantage against effects that would paralyze, stun or make you unconscious.',
        {
            featureType: 'Limited Use',
            uses: 1,
            recharge: 'Long Rest',
            effects: [
                {
                    kind: 'advantage',
                    target: 'saves',
                    situation: 'against an effect that would paralyze, stun or make you unconscious',
                },
            ],
        },
    ),
]

export const earthbendingSubclasses: CharacterSubclass[] = [
    {
        id: 'tradition-of-earthbending',
        classId: 'earthbending',
        name: 'Tradition of Earthbending',
        description:
            'Traditional earthbending: neutral, terrain-shaping, and patient. Waiting for the perfect moment to strike is at the core of Earthbending.',
        unlockLevel: 3,
        featureGrants: [
            { featureId: 'subclass-tradition-of-earthbending-terrain-engineer', level: 3 },
            { featureId: 'subclass-tradition-of-earthbending-reflect-missiles', level: 7 },
            { featureId: 'subclass-tradition-of-earthbending-my-turf', level: 15 },
            { featureId: 'subclass-tradition-of-earthbending-badgermoles-endurance', level: 18 },
        ],
    },
]
