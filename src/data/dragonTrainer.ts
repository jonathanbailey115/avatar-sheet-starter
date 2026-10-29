import type { CharacterClass, CharacterSubclass, Feature, TechniqueSlotRow } from '../types/schema'
import { grantsOf } from './classFeature'

/**
 * Dragon Trainer: a homebrew class by Gamingbrew (GB_DragonTrainer_Class_V2.pdf) for this campaign,
 * re-themed for Avatar (owner decisions DT1-DT5 in docs/RULES_QUESTIONS.md). The wording below is a
 * condensed paraphrase; the numbers follow the PDF. It is not part of gmbinder, and gmbinder wins any conflict.
 */

export const DRAGON_TRAINER_ID = 'dragon-trainer'
const CREDIT = ' (Dragon Trainer by Gamingbrew, Avatar theme.)'

// Index 0 is level 1. From the Dragon Trainer Features table.
export const DRAGON_BREATH_USES = [0, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4]
export const DRAGON_TRAINING_DICE = [0, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6]
export const DRAGON_TECHNIQUES_KNOWN = [0, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7]

/** The Training Die is a d8, then a d10 at level 10 and a d12 at level 17. */
export const trainingDieSize = (level: number): 8 | 10 | 12 => (level >= 17 ? 12 : level >= 10 ? 10 : 8)

const feature = (
    id: string,
    name: string,
    level: number,
    description: string,
    extra: Partial<Feature> & { subclass?: boolean } = {},
): Feature => {
    const { subclass, ...rest } = extra
    return {
        id: `${subclass ? 'subclass' : 'class'}-dragon-trainer-${id}`,
        name,
        description: description + CREDIT,
        source: subclass ? 'Subclass' : 'Class',
        featureType: 'Passive',
        levelRequirement: level,
        isActiveByDefault: true,
        ...rest,
    }
}

const asi = (level: number) =>
    feature('ability-score-improvement', 'Ability Score Improvement', level, 'Gain the Ability Score Improvement feat or another feat you qualify for. Ability scores cannot pass 20 this way.')

export const dragonTrainerFeatures: Feature[] = [
    feature('draconic-knowledge', 'Draconic Knowledge', 1, 'When you make an Intelligence, Wisdom or Charisma check about dragons, your proficiency bonus is doubled if it applies. You also speak, read and write Draconic.'),
    feature('dragon-companion', 'Dragon Companion', 1, 'You are bonded to a dragon companion, who is Friendly to you and your allies and obeys your commands. Choose its Ancestry (it decides the dragon\'s damage type and cannot change). It shares your Initiative and takes its turn after yours. Its only action is Dodge unless you use a Bonus Action to command it. It can move and use its Reaction on its own. If you are Incapacitated it acts on its own. At 0 Hit Points it is Unconscious and makes Death Saving Throws. Within 24 hours of death you can spend 10 minutes to restore it to half its Hit Points. Otherwise you can bond with a new willing dragon after 8 hours (same size and stat block, its own ancestry). You can have only one dragon companion.', { featureType: 'Action' }),
    feature('dragon-breath', 'Dragon Breath', 2, 'Your dragon gains a breath weapon: a Dexterity save against your Dragon Technique DC (8 + Wisdom modifier + proficiency bonus), in a cone (15 feet, 30 at level 5, 60 at level 17). Creatures take two Training Dice of its ancestry damage (three at level 5, four at level 11), or half on a success. It does not spend Training Dice. Uses follow the Breath Uses column and return on a long rest.', { featureType: 'Limited Use' }),
    feature('dragon-training', 'Dragon Training', 2, 'You teach your dragon Dragon Techniques (known number from the Features table; you may swap one when you gain a Dragon Trainer level). Only one technique per attack. You have Training Dice (4 d8, 5 at level 6, 6 at level 14; d10 at level 10, d12 at level 17) that you spend on techniques. You regain up to two on a short rest and all on a long rest. Dragon Technique DC = 8 + Wisdom modifier + proficiency bonus.', { featureType: 'Limited Use' }),
    feature('subclass', 'Dragon Trainer Subclass', 3, 'Choose a Dragon Trainer subclass: Dragon Herald, Dragon Knight or Dragon Mage.'),
    asi(4),
    feature('dragon-growth-1', 'Dragon Growth I', 5, 'Your dragon is now a Medium very young dragon. Its breath cone is 30 feet, and its Rend deals an extra 1d6 damage of its ancestry type. Its Strength becomes 16.'),
    feature('dragon-riding', 'Dragon Riding', 5, 'You can ride your dragon if you are Medium or smaller and no larger than it. While mounted it can use its Fly Speed but must end its turn on a surface that can hold it, or it falls. Mounting or dismounting costs you only 5 feet of movement.'),
    feature('dragon-bond', 'Dragon Bond', 7, 'Empowered Strikes: your dragon\'s hits can deal its normal damage type or its ancestry type. Sense Companion: you know its direction within 1,000 feet. Shared Senses: as a Magic action, see and hear through your dragon until your next turn (Blinded and Deafened to your own surroundings). Telepathic Bond: you can speak telepathically with it within 100 feet.', { featureType: 'Action' }),
    feature('ancestral-resistance', 'Ancestral Resistance', 9, 'While your dragon is within 30 feet of you, you have Resistance to the damage type of its ancestry.'),
    feature('fearless', 'Fearless', 9, 'While you and your dragon are within 100 feet of each other and neither is Unconscious, you are both immune to the Frightened condition.'),
    feature('to-the-skies', 'To the Skies', 10, 'While mounted, your dragon can use its Fly Speed without needing to end its turn on a surface.'),
    feature('dragons-defiance', 'Dragon\'s Defiance', 13, 'When your dragon drops to 0 Hit Points but is not killed outright, you can use your Reaction to make it drop to 1 Hit Point instead. It then gains Temporary Hit Points equal to your Dragon Trainer level. Once used, you must finish a long rest to use it again.', { featureType: 'Reaction', uses: 1, recharge: 'Long Rest' }),
    feature('dragon-growth-2', 'Dragon Growth II', 14, 'Your dragon is a Large young dragon. Speed and Fly Speed become 40 feet, its Strength becomes 18, and it learns a Tail attack (melee, reach 10 feet, 1d8 plus Wisdom modifier bludgeoning; pushes a Large or smaller target 15 feet).'),
    feature('empowered-dragon-breath', 'Empowered Dragon Breath', 17, 'Your dragon\'s breath cone increases to 60 feet.'),
    feature('indomitable-bond', 'Indomitable Bond', 18, 'When you or your dragon takes damage while within 30 feet of each other, you can use your Reaction to give the target Resistance to that damage. You can do this a number of times equal to your Wisdom modifier (minimum once) and regain all uses on a long rest.', { featureType: 'Reaction' }),
    feature('free-feat', 'Epic Boon feat', 19, 'Gain a feat you qualify for (Boon of Fate is the PDF\'s suggestion). This app\'s Avatar-themed Epic Boons come from reaching class level 20 and are chosen on the Class tab.'),
    feature('dragon-growth-3', 'Dragon Growth III', 20, 'Your dragon is a Huge adult dragon with Strength 20. Draconic Might: once per turn when it hits with Rend or Tail, it deals extra damage equal to one roll of your Training Die (does not spend it). Mighty Mount: it carries up to three Medium or smaller creatures, or one Large and one Medium, while walking or flying; only you command it.'),
]

// ---- Subclasses ----

const sub = (id: string, name: string, level: number, description: string, extra: Partial<Feature> = {}) =>
    feature(`${id}`, name, level, description, { ...extra, subclass: true })

export const dragonSubclassFeatures: Feature[] = [
    // Dragon Herald
    sub('herald-proclamation', 'Draconic Proclamation', 3, 'When your dragon uses Dragon Breath, choose a creature within 60 feet of your dragon (you can choose yourself, not the dragon). It gains temporary Hit Points equal to 2d8 plus your Dragon Trainer level.'),
    sub('herald-voice', 'Herald\'s Voice', 3, 'You gain proficiency in Persuasion and Performance. You also have a Guidance-style boost (stand-in for the PDF\'s Guidance cantrip): as an action you add 1d4 to one ability check an ally makes within 30 feet, using Wisdom for the effect.'),
    sub('herald-exhortation', 'Herald\'s Exhortation', 6, 'Once on each of your turns, when you command your dragon with a Bonus Action, choose an ally within 60 feet of your dragon who can hear you. The next time that creature hits with an attack before your next turn, it deals extra damage equal to one roll of your Training Die (ancestry type; does not spend it).'),
    sub('herald-sermon', 'Sermon of Resolve', 11, 'When you or another creature you can see within 60 feet of your dragon fails a saving throw, you can use your Reaction to roll a Training Die and add it to the save (the creature must hear you; it does not spend the die). Uses equal your Wisdom modifier (minimum 1), regained on a long rest.', { featureType: 'Reaction' }),
    sub('herald-testament', 'Testament of Dragonkind', 15, 'As a Magic action you deliver a proclamation: your dragon radiates a 30-foot Emanation of inspiration. Once on each of your turns you can give yourself or an ally in it a Heroic Inspiration (stand-in: advantage on one roll, usable once). Allies entering or starting their turn there gain +20 feet of Speed until the end of their next turn. Once per long rest.', { featureType: 'Limited Use', uses: 1, recharge: 'Long Rest' }),
    // Dragon Knight
    sub('knight-training', 'Knight\'s Training', 3, 'You gain proficiency with Martial weapons and training with Heavy armor and Shields.'),
    sub('knight-shield', 'Draconic Shield', 3, 'When a creature you can see within 10 feet hits you with an attack roll, you can use your Reaction to roll a Training Die and add it to your AC against that attack. If it misses and the attacker is within your dragon\'s reach, your dragon can use its Reaction to Rend it. Uses equal your Wisdom modifier (minimum 1), regained on a long rest.', { featureType: 'Reaction' }),
    sub('knight-extra-attack', 'Extra Attack', 6, 'You can attack twice when you take the Attack action. You can give up one attack to command your dragon to take the Rend action.'),
    sub('knight-breathforged', 'Breathforged Weapon', 11, 'When your dragon uses Dragon Breath within 30 feet of you, it infuses a melee weapon you hold for 1 minute: it deals an extra 1d6 damage of its ancestry type. Another breath within 30 feet resets the minute.'),
    sub('knight-defender', 'Dragon Defender', 15, 'While you are within 5 feet of your dragon (including mounted) and not Incapacitated, your dragon gains a +2 bonus to AC.'),
    // Dragon Mage
    sub('mage-magic', 'Dragon Magic', 3, 'You draw on the element of your dragon\'s ancestry (Ember: Fire, Tide and Jade: Water, Stone: Earth, Storm: Air). Stand-in for the PDF\'s Druid spellcasting: you gain technique slots and techniques known from the Dragon Mage table, using Wisdom, and learn techniques of that element. Slots return on a long rest.'),
    sub('mage-connection', 'Elemental Connection', 6, 'Ancestral Attunement: when you use a technique that deals acid, cold, fire, lightning, poison or thunder damage you can change it to your dragon\'s ancestry damage type. Draconic Conduit: when you use a technique you can have it originate from your dragon\'s space if it is within 60 feet (you use your own senses).'),
    sub('mage-communion', 'Draconic Communion', 11, 'Steadfast Concentration: when you fail a Constitution save to keep concentration while your dragon is within 60 feet, you can spend a Training Die and have your dragon use its Reaction to add it to the save. Shared Breath: as a Magic action, spend one of your dragon\'s Dragon Breath uses to breathe it yourself (cone from you; same damage, DC and area). You and your dragon use Dragon Breath only once per turn between you.', { featureType: 'Action' }),
    sub('mage-shield', 'Energy Shield', 15, 'When you spend a technique slot while your dragon is within 60 feet, roll your Training Die (it is not spent). You and your dragon each gain temporary Hit Points equal to the roll plus your Wisdom modifier.'),
]

const grants = (names: Array<[string, number]>, prefix: 'class' | 'subclass') =>
    grantsOf(names.map(([id, level]) => [`${prefix}-dragon-trainer-${id}`, level] as [string, number]))

export const dragonTrainerClass: CharacterClass = {
    id: DRAGON_TRAINER_ID,
    name: 'Dragon Trainer',
    description:
        'Dragon Trainers form lifelong bonds with dragons, raising a hatchling into a powerful companion through shared training. In this world the dragons are the Far Eastern kind, the first Firebenders, and the bond is companionship, not magic. A homebrew class by Gamingbrew, re-themed for Avatar.',
    hitDie: 'Lineage-based',
    primaryAbility: 'Wisdom',
    keyAbilities: ['wisdom'],
    multiclassAbilities: ['wisdom'],
    bendingAbility: 'wisdom',
    savingThrows: ['wisdom', 'charisma'],
    playerOnly: true,
    skillChoices: { choose: 2, options: ['Animal Handling', 'Insight', 'Investigation', 'Nature', 'Perception', 'Survival'] },
    armorProficiencies: ['Light Armor', 'Medium Armor'],
    weaponProficiencies: ['Simple Weapons'],
    featureGrants: grants(
        [
            ['draconic-knowledge', 1],
            ['dragon-companion', 1],
            ['dragon-breath', 2],
            ['dragon-training', 2],
            ['subclass', 3],
            ['ability-score-improvement', 4],
            ['dragon-growth-1', 5],
            ['dragon-riding', 5],
            ['dragon-bond', 7],
            ['ability-score-improvement', 8],
            ['ancestral-resistance', 9],
            ['fearless', 9],
            ['to-the-skies', 10],
            ['ability-score-improvement', 12],
            ['dragons-defiance', 13],
            ['dragon-growth-2', 14],
            ['ability-score-improvement', 16],
            ['empowered-dragon-breath', 17],
            ['indomitable-bond', 18],
            ['free-feat', 19],
            ['dragon-growth-3', 20],
        ],
        'class',
    ),
    subclassName: 'Dragon Trainer Subclass',
    techniqueLimits: [
        { id: 'dragon', label: 'Dragon techniques', kinds: ['Dragon'], maxByLevel: DRAGON_TECHNIQUES_KNOWN },
    ],
    resources: [
        {
            id: 'breath-uses',
            name: 'Dragon Breath uses',
            maxByLevel: DRAGON_BREATH_USES,
            recharge: 'Long Rest',
            description: 'Your dragon\'s breath weapon. Regained on a long rest.',
        },
        {
            id: 'training-dice',
            name: 'Training Dice',
            maxByLevel: DRAGON_TRAINING_DICE,
            recharge: 'Long Rest',
            description: 'Spent on Dragon Techniques and subclass features. You regain up to two on a short rest and all on a long rest (restore two by hand after a short rest).',
        },
    ],
}

/** The Dragon Mage table (stand-in for the PDF's spell table, mapping approved by the owner). Index 0 is level 1. */
const mageRows: Array<[level: number, known: number, practiced: number, trained: number, mastered: number]> = [
    [3, 3, 2, 0, 0],
    [4, 4, 3, 0, 0],
    [5, 4, 3, 0, 0],
    [6, 4, 3, 0, 0],
    [7, 5, 4, 2, 0],
    [8, 6, 4, 2, 0],
    [9, 6, 4, 2, 0],
    [10, 7, 4, 3, 0],
    [11, 8, 4, 3, 0],
    [12, 8, 4, 3, 0],
    [13, 9, 4, 3, 2],
    [14, 10, 4, 3, 2],
    [15, 10, 4, 3, 2],
    [16, 11, 4, 3, 3],
    [17, 11, 4, 3, 3],
    [18, 11, 4, 3, 3],
    [19, 12, 4, 3, 4],
    [20, 13, 4, 3, 4],
]

export const dragonMageSlots: TechniqueSlotRow[] = Array.from({ length: 20 }, (_, index) => {
    const row = mageRows.find(([level]) => level === index + 1)
    return row ? { known: row[1], practiced: row[2], trained: row[3], mastered: row[4] } : { known: 0, practiced: 0, trained: 0, mastered: 0 }
})

export const dragonTrainerSubclasses: CharacterSubclass[] = [
    {
        id: 'dragon-herald',
        classId: DRAGON_TRAINER_ID,
        name: 'Dragon Herald',
        description: 'Proclaim the glory of dragonkind. Heralds are devoted advocates who tell tales of draconic greatness and inspire courage in everyone who watches their companion.',
        unlockLevel: 3,
        featureGrants: grants([['herald-proclamation', 3], ['herald-voice', 3], ['herald-exhortation', 6], ['herald-sermon', 11], ['herald-testament', 15]], 'subclass'),
    },
    {
        id: 'dragon-knight',
        classId: DRAGON_TRAINER_ID,
        name: 'Dragon Knight',
        description: 'Forge a wall of steel and scales. Knights fight armored beside their dragon on the front line, anticipating each other\'s movements.',
        unlockLevel: 3,
        armorProficiencies: ['Heavy Armor', 'Shields'],
        weaponProficiencies: ['Martial Weapons'],
        featureGrants: grants([['knight-training', 3], ['knight-shield', 3], ['knight-extra-attack', 6], ['knight-breathforged', 11], ['knight-defender', 15]], 'subclass'),
    },
    {
        id: 'dragon-mage',
        classId: DRAGON_TRAINER_ID,
        name: 'Dragon Mage',
        description: 'Harness the elemental power of dragons. Mages channel their dragon\'s element into techniques that complement the companion\'s natural abilities.',
        unlockLevel: 3,
        techniqueSlots: dragonMageSlots,
        featureGrants: grants([['mage-magic', 3], ['mage-connection', 6], ['mage-communion', 11], ['mage-shield', 15]], 'subclass'),
    },
]
