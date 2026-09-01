import type {
    Background,
    Character,
    CharacterClass,
    CharacterSubclass,
    Feature,
    Lineage,
    NpcTemplate,
    Style,
    Technique,
} from '../types/schema'

export const characterClasses: CharacterClass[] = [
    {
        id: 'guardian',
        name: 'Guardian',
        description:
            'A resilient frontline defender who protects allies and controls the battlefield.',
        hitDie: 'd10',
        primaryAbility: 'Strength or Constitution',
        savingThrows: ['strength', 'constitution'],
        skillChoices: {
            choose: 2,
            options: [
                'Athletics',
                'Insight',
                'Intimidation',
                'Investigation',
                'Perception',
                'Survival',
            ],
        },
        featureGrants: [
            { featureId: 'class-guardian-combat-training', level: 1 },
            { featureId: 'class-guardian-protective-stance', level: 1 },
            { featureId: 'class-guardian-steady-advance', level: 2 },
            { featureId: 'class-guardian-archetype', level: 3 },
        ],
        subclassName: 'Guardian Path',
    },
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

export const characterSubclasses: CharacterSubclass[] = [
    {
        id: 'guardian-stonewall',
        classId: 'guardian',
        name: 'Stonewall',
        description:
            'A Guardian path focused on immovable defense and battlefield anchoring.',
        unlockLevel: 3,
        featureGrants: [{ featureId: 'subclass-stonewall-anchor', level: 3 }],
    },
    {
        id: 'guardian-vanguard',
        classId: 'guardian',
        name: 'Vanguard',
        description:
            'A Guardian path built around aggressive protection and forward pressure.',
        unlockLevel: 3,
        featureGrants: [{ featureId: 'subclass-vanguard-press-forward', level: 3 }],
    },
]

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

export const lineages: Lineage[] = [
    {
        id: 'human',
        name: 'Human',
        nation: 'Any',
        description:
            'The most common lineage across the world, adaptable and versatile.',
    },
    {
        id: 'air-nomad-human',
        name: 'Air Nomad Human',
        nation: 'Air Nomads',
        description: 'Raised in or descended from the Air Nomad tradition.',
    },
    {
        id: 'water-tribe-human',
        name: 'Water Tribe Human',
        nation: 'Water Tribe',
        description: 'Connected to the cultures of the north or south.',
    },
    {
        id: 'earth-kingdom-human',
        name: 'Earth Kingdom Human',
        nation: 'Earth Kingdom',
        description: 'Shaped by the vast and varied Earth Kingdom.',
    },
    {
        id: 'fire-nation-human',
        name: 'Fire Nation Human',
        nation: 'Fire Nation',
        description: 'Descended from the disciplined and ambitious Fire Nation.',
    },
    {
        id: 'mixed-heritage',
        name: 'Mixed Heritage',
        nation: 'Mixed',
        description: 'Carries influences from more than one nation or people.',
    },
]

export const styles: Style[] = [
    {
        id: 'airbender',
        name: 'Airbender',
        bendingType: 'Air',
        nation: 'Air Nomads',
        description: 'A mobile and evasive elemental fighter.',
    },
    {
        id: 'waterbender',
        name: 'Waterbender',
        bendingType: 'Water',
        nation: 'Water Tribe',
        description: 'A fluid and adaptive elemental fighter.',
    },
    {
        id: 'earthbender',
        name: 'Earthbender',
        bendingType: 'Earth',
        nation: 'Earth Kingdom',
        description: 'A resilient and grounded elemental fighter.',
    },
    {
        id: 'firebender',
        name: 'Firebender',
        bendingType: 'Fire',
        nation: 'Fire Nation',
        description: 'An aggressive and precise elemental fighter.',
    },
    {
        id: 'weapons-specialist',
        name: 'Weapons Specialist',
        bendingType: 'Non-Bender',
        nation: 'Any',
        description:
            'A trained fighter who relies on tools, weapons, and discipline.',
    },
    {
        id: 'martial-artist',
        name: 'Martial Artist',
        bendingType: 'Non-Bender',
        nation: 'Any',
        description:
            'A close-quarters specialist focused on speed, pressure, and technique.',
    },
    {
        id: 'tactician',
        name: 'Tactician',
        bendingType: 'Non-Bender',
        nation: 'Any',
        description:
            'A planner and battlefield reader who wins through preparation.',
    },
]

export const techniques: Technique[] = [
    {
        id: 'gust',
        name: 'Gust',
        tier: 1,
        bendingType: 'Air',
        description:
            'A focused burst of air used to reposition or stagger a target.',
    },
    {
        id: 'water-whip',
        name: 'Water Whip',
        tier: 1,
        bendingType: 'Water',
        description:
            'A quick lash of water used to strike, disarm, or control space.',
    },
    {
        id: 'stone-guard',
        name: 'Stone Guard',
        tier: 1,
        bendingType: 'Earth',
        description: 'Raise a protective barrier or reinforce your stance.',
    },
    {
        id: 'flame-kick',
        name: 'Flame Kick',
        tier: 1,
        bendingType: 'Fire',
        description:
            'A fast offensive strike that channels fire through movement.',
    },
]

export const features: Feature[] = [
    {
        id: 'feature-brave',
        name: 'Brave',
        description: 'You have advantage on saves against fear effects.',
        source: 'Lineage',
        featureType: 'Passive',
        levelRequirement: 1,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-guardian-combat-training',
        name: 'Combat Training',
        description:
            'You are trained in frontline combat and defensive battlefield control.',
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: 1,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-guardian-protective-stance',
        name: 'Protective Stance',
        description:
            'You can adopt a defensive posture that helps shield nearby allies.',
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: 1,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-guardian-steady-advance',
        name: 'Steady Advance',
        description:
            'You maintain momentum and discipline while moving through danger.',
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: 2,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-guardian-archetype',
        name: 'Guardian Path',
        description:
            'You choose a specialized path that defines your fighting philosophy.',
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: 3,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'subclass-stonewall-anchor',
        name: 'Anchor Stance',
        description:
            'You plant yourself like stone, making it harder for enemies to push past you.',
        source: 'Subclass',
        featureType: 'Passive',
        levelRequirement: 3,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'subclass-vanguard-press-forward',
        name: 'Press Forward',
        description:
            'When you advance, nearby allies gain confidence and momentum.',
        source: 'Subclass',
        featureType: 'Passive',
        levelRequirement: 3,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'background-community-fixer',
        name: 'Community Fixer',
        description:
            'You know how to find help, favors, and practical support among ordinary people.',
        source: 'Background',
        featureType: 'Passive',
        levelRequirement: 1,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'background-street-instincts',
        name: 'Street Instincts',
        description:
            'You quickly read danger, opportunity, and shifting mood in crowded places.',
        source: 'Background',
        featureType: 'Passive',
        levelRequirement: 1,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-weaponsmaster-adapted-fighting',
        name: 'Adapted Fighting',
        description:
            'Benders are strong, thus you have adapted your combat style to be on an equal playing field with them. Starting at level 1, on your turn when you make an attack you can choose to spend a Combat Expertise Point to give the creature an ailment or give the attack a bonus in addition to the normal damage of the attack: Focused Fighting – you gain advantage on your next attack roll; Daze – on a hit, the creature must make a Constitution Saving Throw; on a fail, the creature you attacked has disadvantage on attack rolls until their next turn; Disarm – on a hit, the creature must make a Strength Saving Throw vs your Save DC; on a fail, the creature you attacked drops their weapon or can’t use their bending on opportunity attacks; Sweep the Leg – on a hit, the creature must make a Strength Saving Throw vs your Save DC or be knocked prone. Each creature can only be affected with one ailment per turn. At level 10, you can use Adapted Fighting on attacks you make with your reaction. You gain a number of Combat Expertise Points from the Weaponsmaster class table (1 at 1st level, increasing at 3rd, 6th, 9th, 12th, 15th, 18th and 20th level). You regain all your Combat Expertise Points after you finish a long rest.',
        source: 'Class',
        featureType: 'Limited Use',
        levelRequirement: 1,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-weaponsmaster-journeymans-lesson',
        name: 'Journeyman\'s Lesson',
        description:
            'Throughout your adventures you keep your mind keen to learn and improve yourself. At 1st level, you can choose a Basic Fighting Technique from the Weaponsmaster Fighting Technique list. Every 3 levels, you can choose to get a new Basic Fighting Technique, swap a Fighting Technique that you already use with another Basic Fighting Technique, or level up an existing one to Trained. You can not level up Fighting Techniques to Master using Journeyman’s Lesson. To level up a Fighting Technique to Master, you must find a master trained in that Fighting Technique and complete their lesson, guidance, request, or quest. See the Weaponsmaster Fighting Techniques section for the available techniques.',
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: 1,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-weaponsmaster-universal-techniques',
        name: 'Universal Techniques',
        description:
            'Starting at level 1, you can learn 2 techniques from the Universal Techniques list under Bending Techniques. Every time you level up, you can swap out 1 technique for another; you can not have 2 of the same technique. At level 6, you can choose 1 more technique. At level 13, you can choose 1 more technique. You can use these techniques a number of times equal to your Universal Technique Slots (3 at 1st level, increasing at 5th, 9th, 13th and 17th level). You regain all expended Universal Technique Slots after you finish a long rest.',
        source: 'Class',
        featureType: 'Limited Use',
        levelRequirement: 1,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-weaponsmaster-action-surge',
        name: 'Action Surge',
        description:
            'Starting at 3rd level, you can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action. Once you use this feature, you must finish a short or long rest before you can use it again. Starting at 17th level, you can use it twice before a rest, but only once on the same turn.',
        source: 'Class',
        featureType: 'Limited Use',
        levelRequirement: 3,
        isActiveByDefault: true,
        uses: 1,
        recharge: 'Short Rest',
    },
    {
        id: 'class-weaponsmaster-ability-score-improvement',
        name: 'Ability Score Improvement',
        description:
            'When you reach 4th, 8th, 12th and 16th level you may increase one of your abilities by 2 points or two of your abilities by 1 point. You can’t increase your abilities above 20 using this feature.',
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: 4,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-weaponsmaster-extra-attack',
        name: 'Extra Attack',
        description:
            'Beginning at 5th level, you can attack twice, instead of once, whenever you take the Attack action on your turn. The number of attacks increases to three when you reach 11th level in this class and to four when you reach 20th level in this class.',
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: 5,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-weaponsmaster-universal-techniques-improvement',
        name: 'Universal Techniques Improvement',
        description:
            'Your mastery of the Universal Techniques deepens as you grow. Starting at level 6, you can choose 1 more Universal Technique. Starting at level 13, you can choose 1 more Universal Technique.',
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: 6,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-weaponsmaster-quickdraw',
        name: 'Quickdraw',
        description:
            'Starting at 7th level, Weaponsmasters can add their proficiency bonus to their initiative. They can also sheathe a weapon and unsheathe another as a single object interaction on their turn.',
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: 7,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-weaponsmaster-interrupt',
        name: 'Interrupt',
        description:
            'Starting at level 9, if you are within striking distance of a creature that knows bending, you can use your reaction or you can spend a Combat Expertise Point to attempt to stop the creature from using a technique. Make a Dexterity Check. The DC to interrupt the technique is 10 + 3x(the technique’s level). On a success, you interrupt the creature’s attempt and they can not use the chosen technique. On a fail, the creature is able to use the technique.',
        source: 'Class',
        featureType: 'Reaction',
        levelRequirement: 9,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-weaponsmaster-superior-critical',
        name: 'Superior Critical',
        description:
            'Starting at 11th level, your weapon attacks score a critical hit on a roll of 18-20.',
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: 11,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
    {
        id: 'class-weaponsmaster-survivor',
        name: 'Survivor',
        description:
            'At 15th level, at the start of each of your turns, you regain hit points equal to 5 + your Constitution modifier if you have no more than half of your hit points left. You don’t gain this benefit if you have 0 hit points.',
        source: 'Class',
        featureType: 'Passive',
        levelRequirement: 15,
        isActiveByDefault: true,
        uses: undefined,
        recharge: null,
    },
]

export const sampleCharacter: Character = {
    id: 'player-1',
    role: 'Player Character',
    name: 'Ling',
    nation: 'Earth Kingdom',
    lineageId: '',
    bendingType: 'Earth',
    style: 'Earthbender',
    level: 1,
    hp: 12,
    chi: 3,
    backgroundId: undefined,
    backgroundNotes: '',
    personality: '',
    ideals: '',
    bonds: '',
    flaws: '',
    techniques: [],
    notes: '',
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    savingThrowProficiencies: [],
    skillProficiencies: [],
    classSkillChoices: [],
    toolProficiencies: [],
    languages: [],
    selectedFeatureIds: [],
    classId: '',
    subclassId: undefined,

    armorName: '',
    weaponNotes: '',
    inventoryItems: [],
    currency: '',
    equipmentNotes: '',
}

export const npcTemplates: NpcTemplate[] = [
    {
        role: 'Guard',
        nationWeights: {
            'Earth Kingdom': 4,
            'Fire Nation': 3,
            'Water Tribe': 2,
            'Air Nomads': 1,
            Mixed: 1,
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
        nationWeights: {
            'Earth Kingdom': 2,
            'Fire Nation': 2,
            'Water Tribe': 2,
            'Air Nomads': 2,
            Mixed: 3,
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
        nationWeights: {
            'Earth Kingdom': 3,
            'Fire Nation': 2,
            'Water Tribe': 2,
            'Air Nomads': 1,
            Mixed: 3,
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