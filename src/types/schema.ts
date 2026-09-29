export type Nation = 'Air Nomads' | 'Water Tribe' | 'Earth Kingdom' | 'Fire Nation'
export type CharacterRole = 'Player Character' | 'NPC'
export type Element = 'Air' | 'Water' | 'Earth' | 'Fire'
/** Used for NPC template weights. A character's bending is derived from its class. */
export type BendingType = Element | 'Non-Bender'
export type TechniqueLevel = 'Practiced' | 'Trained' | 'Mastered'

export const TECHNIQUE_LEVELS: TechniqueLevel[] = ['Practiced', 'Trained', 'Mastered']
export const CHARACTER_SCHEMA_VERSION = 5

export interface Lineage {
    id: string
    name: string
    nation: Nation | 'Any'
    description: string
    /** Hit die size, from the lineage (gmbinder). Drives hit points. */
    hitDie?: HitDie
    hitDiceText?: string
    hitPointsAtFirstLevelText?: string
    hitPointsPerLevelText?: string
    savingThrows?: AbilityName[]
    savingThrowChoices?: ChoiceSet<AbilityName>
    skillChoices?: ChoiceSet<SkillName>
    armorProficiencies?: string[]
    weaponProficiencies?: string[]
    toolChoices?: ChoiceSet<string>
    languageProficiencies?: string[]
    allowedBendingTypes?: BendingType[]
    featureIds?: string[]
}

/** Where a technique comes from. Fighting techniques are the Weaponsmaster's. */
export type TechniqueElement = Element | 'Universal' | 'Fighting'

/** Sub-bendings gmbinder lists inside an element's technique list. */
export type TechniqueDiscipline = 'Bloodbending' | 'Combustionbending'

/** A save the target makes against the caster's Bending Save DC. */
export interface TechniqueSave {
    /** 'affinity': the target rolls the Elemental Affinity save of its own element (gmbinder text). */
    ability: AbilityName | 'affinity'
    /** What non-benders roll when the technique text names it (e.g. Strength). */
    fallback?: AbilityName
}

export interface TechniqueDamage {
    label?: string
    /** Dice at Practiced level, e.g. "3d8". Empty when `byLevel` gives every level. */
    base: string
    /** Extra dice for each level above Practiced, e.g. "1d8". */
    perLevel?: string
    /** Exact dice per level; takes precedence over base and perLevel. */
    byLevel?: Partial<Record<TechniqueLevel, string>>
    type: string
    /** Add the caster's bending ability modifier. */
    addModifier?: boolean
    /** What a successful save does to this damage. */
    onSave: 'half' | 'negates' | 'unaffected'
}

export interface Technique {
    id: string
    name: string
    element: TechniqueElement
    description: string
    rare?: boolean
    /** A sub-bending this technique belongs to. Only a subclass that grants the discipline can learn it. */
    discipline?: TechniqueDiscipline
    /** e.g. "Trained Tremors" */
    prerequisite?: string
    castingTime?: string
    range?: string
    components?: string
    duration?: string
    concentration?: boolean
    /** Separate rules text per level (Fighting techniques). */
    levelText?: Record<TechniqueLevel, string>
    /** Mechanics the app can roll for you. Authored in data/techniques/mechanics.ts. */
    resolution?: 'save' | 'attack' | 'none'
    save?: TechniqueSave
    damage?: TechniqueDamage[]
    /** A short reminder shown beside the rolls. */
    mechanicsNote?: string
}

/** Training Points progress toward the next technique level (gmbinder, Training). */
export interface TechniqueTraining {
    /** Being trained uses one of your 2 training slots. */
    active: boolean
    /** 0-5. At 5 the technique levels up. */
    points: number
    /** Elemental Ability Check DC; starts at 15 and drops by 1 on each failure. */
    dc: number
    /** Mastery check DC; starts at 25 and drops by 1 on each failure. */
    masteryDc: number
}

/** A technique a character knows, at the level they know it. */
export interface KnownTechnique {
    techniqueId: string
    level: TechniqueLevel
    training: TechniqueTraining
}

export const DEFAULT_TRAINING: TechniqueTraining = { active: false, points: 0, dc: 15, masteryDc: 25 }
export const MAX_TRAINING_SLOTS = 2
/** Benders may master up to 6 techniques (gmbinder). */
export const MAX_MASTERED_TECHNIQUES = 6


export type HitDie = 6 | 8 | 10 | 12

export type AttackKind = 'weapon' | 'bending' | 'unarmed'

export type Recharge = 'Short Rest' | 'Long Rest' | 'Manual'

/** What an effect applies to. Skill and save targets are per-ability/skill. */
export type EffectTarget =
    | 'ac'
    | 'initiative'
    | 'attack'
    | 'saves'
    | 'skills'
    | `save:${AbilityName}`
    | `skill:${SkillName}`
    | `check:${AbilityName}`

export type BonusValue = number | 'proficiency' | { ability: AbilityName }

/** Conditions the engine can evaluate from the character sheet itself. */
export type EffectRequirement = 'no-armor'

interface EffectBase {
    target: EffectTarget
    requires?: EffectRequirement
    /** Free-text situation the player confirms at roll time (e.g. "vs a creature that acted before you"). */
    situation?: string
}

export type FeatureEffect =
    | (EffectBase & { kind: 'bonus'; value: BonusValue })
    | (EffectBase & { kind: 'setBase'; base: number; abilities: AbilityName[] })
    | (EffectBase & { kind: 'advantage' })
    | (EffectBase & { kind: 'disadvantage'; tag?: string })
    | (EffectBase & { kind: 'suppressDisadvantage'; tag: string })
    /** Attacks of these kinds score a critical hit on a natural roll of `min` or higher. */
    | (EffectBase & { kind: 'critRange'; min: number; attackKinds: AttackKind[] })

/** A cap on techniques known, counted across the listed kinds. Index 0 of `maxByLevel` is level 1. */
export interface TechniqueLimit {
    id: string
    label: string
    kinds: TechniqueElement[]
    maxByLevel: number[]
}

export interface TechniqueSlotRow {
    known: number
    practiced: number
    trained: number
    mastered: number
}

/** A class resource pool whose size depends on level (e.g. Combat Expertise Points). */
export interface ClassResource {
    id: string
    name: string
    /** Maximum at each level; index 0 is level 1. */
    maxByLevel: number[]
    recharge: Recharge
    description?: string
}

export interface Feature {
    id: string
    name: string
    description: string
    source: 'Class' | 'Subclass' | 'Background' | 'Lineage' | 'Feat' | 'Technique' | 'Custom'
    featureType: 'Passive' | 'Action' | 'Bonus Action' | 'Reaction' | 'Limited Use'
    levelRequirement: number
    isActiveByDefault: boolean
    uses?: number
    recharge?: Recharge | null
    effects?: FeatureEffect[]
}

export type AbilityName =
    | 'strength'
    | 'dexterity'
    | 'constitution'
    | 'intelligence'
    | 'wisdom'
    | 'charisma'

export type SkillName =
    | 'Acrobatics'
    | 'Animal Handling'
    | 'Arcana'
    | 'Athletics'
    | 'Deception'
    | 'History'
    | 'Insight'
    | 'Intimidation'
    | 'Investigation'
    | 'Medicine'
    | 'Nature'
    | 'Perception'
    | 'Performance'
    | 'Persuasion'
    | 'Religion'
    | 'Sleight of Hand'
    | 'Stealth'
    | 'Survival'

export interface ChoiceSet<T> {
    choose: number
    options: T[]
}

/** A weapon on a character sheet. `bonus` is a flat +attack/+damage (e.g. Weapons Specialist upgrades). */
export interface EquippedWeapon {
    id: string
    weaponId: string
    bonus: number
}

export interface Character {
    schemaVersion: number
    id: string
    role: CharacterRole
    name: string
    nation: Nation
    lineageId: string
    level: number
    /** Sets max HP directly (GM-set NPCs). Null means derive from lineage, level and Constitution. */
    maxHpOverride: number | null
    /** Manual +/- to max HP (feats, items). */
    maxHpAdjustment: number
    /** Hit die result for each level above 1 (index 0 is level 2). Null means take the average. */
    hpRolls: Array<number | null>
    /** Damage taken. Current HP is max HP minus this, so a new character starts at full. */
    hpLost: number
    tempHp: number
    hitDiceUsed: number
    deathSaves: { successes: number; failures: number }
    exhaustion: number
    /** Spent uses by resource id (see engine/resources). */
    resourcesUsed: Record<string, number>
    backgroundId?: string
    customBackground: CustomBackground | null
    backgroundNotes: string
    personality: string
    ideals: string
    bonds: string
    flaws: string
    knownTechniques: KnownTechnique[]
    notes: string
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
    savingThrowProficiencies: AbilityName[]
    skillProficiencies: SkillName[]
    classSkillChoices: SkillName[]
    toolProficiencies: string[]
    languages: string[]
    selectedFeatureIds: string[]
    classId: string
    subclassId?: string
    lineageSkillChoices?: SkillName[]
    lineageSavingThrowChoices?: AbilityName[]
    lineageToolChoices?: string[]
    lineageFavoredTerrains?: string[]
    manualSavingThrows?: AbilityName[]
    manualSkills?: SkillName[]
    manualTools?: string[]
    manualLanguages?: string[]
    /** Messages from migrations that the player should see once (e.g. a removed nation). */
    migrationNotes: string[]

    armorName: string
    /** Worn armor from the armor table (empty for none). */
    armorId: string
    hasShield: boolean
    /** Weapons carried, chosen from the weapon table. Attacks are rolled from these. */
    weapons: EquippedWeapon[]
    weaponNotes: string
    inventoryItems: string[]
    currency: string
    equipmentNotes: string
}

export interface ClassFeatureGrant {
    featureId: string
    level: number
}

export interface CharacterClass {
    id: string
    name: string
    description: string
    hitDie: string
    primaryAbility: string
    savingThrows: AbilityName[]
    skillChoices: {
        choose: number
        options: SkillName[]
    }
    featureGrants: ClassFeatureGrant[]
    subclassName?: string
    /** Set for bending classes; bending is derived from the class. */
    element?: Element
    /** Bender technique slot table by level; index 0 is level 1. */
    techniqueSlots?: TechniqueSlotRow[]
    /** How many techniques the class can know, by kind and level. */
    techniqueLimits?: TechniqueLimit[]
    resources?: ClassResource[]
    /** The ability behind Bending Save DC and Bending Attack Modifier. */
    bendingAbility?: AbilityName
    /** Basic bending attack (no technique), rolled with the Bending Attack Modifier. */
    basicAttack?: { dice: string; damageType?: string }
}

export interface SubclassFeatureGrant {
    featureId: string
    level: number
}

export interface CharacterSubclass {
    id: string
    classId: string
    /** Sub-bendings this subclass lets you use (their techniques become learnable). */
    disciplines?: TechniqueDiscipline[]
    name: string
    description: string
    unlockLevel: number
    featureGrants: ClassFeatureGrant[]
}

/** A player-made background (D&D Beyond style "custom background"). */
export interface CustomBackground {
    name: string
    description: string
    skillProficiencies: SkillName[]
    toolProficiencies: string[]
    featureName: string
    featureText: string
}

/** `backgroundId` value that means "use `customBackground`". */
export const CUSTOM_BACKGROUND_ID = 'custom'

export interface Background {
    id: string
    name: string
    description: string
    skillProficiencies: SkillName[]
    toolProficiencies: string[]
    languages: string[]
    featureIds: string[]
}

export interface NpcTemplate {
    /** 0-1: how often this role wears armor and carries weapons. Defaults to 0.6. */
    combat?: number
    role: string
    nationWeights: Partial<Record<Nation, number>>
    bendingWeights: Partial<Record<BendingType, number>>
}

export const nations: Nation[] = [
    'Air Nomads',
    'Water Tribe',
    'Earth Kingdom',
    'Fire Nation',
]

export const bendingTypes: BendingType[] = [
    'Air',
    'Water',
    'Earth',
    'Fire',
    'Non-Bender',
]