export type Nation = 'Air Nomads' | 'Water Tribe' | 'Earth Kingdom' | 'Fire Nation'
export type CharacterRole = 'Player Character' | 'NPC'
export type Element = 'Air' | 'Water' | 'Earth' | 'Fire'
/** Used for NPC template weights. A character's bending is derived from its class. */
export type BendingType = Element | 'Non-Bender'
export type TechniqueLevel = 'Practiced' | 'Trained' | 'Mastered'

export const TECHNIQUE_LEVELS: TechniqueLevel[] = ['Practiced', 'Trained', 'Mastered']
export const CHARACTER_SCHEMA_VERSION = 4

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

export interface Technique {
    id: string
    name: string
    element: Element | 'Universal'
    description: string
    rare?: boolean
}

/** A technique a character knows, at the level they know it. */
export interface KnownTechnique {
    techniqueId: string
    level: TechniqueLevel
}

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
    name: string
    description: string
    unlockLevel: number
    featureGrants: ClassFeatureGrant[]
}

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