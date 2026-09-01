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