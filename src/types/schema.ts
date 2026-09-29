export type Nation = 'Air Nomads' | 'Water Tribe' | 'Earth Kingdom' | 'Fire Nation'
export type CharacterRole = 'Player Character' | 'NPC'
export type Element = 'Air' | 'Water' | 'Earth' | 'Fire'
/** Used for NPC template weights. A character's bending is derived from its class. */
export type BendingType = Element | 'Non-Bender'
export type TechniqueLevel = 'Practiced' | 'Trained' | 'Mastered'

export const TECHNIQUE_LEVELS: TechniqueLevel[] = ['Practiced', 'Trained', 'Mastered']
export const CHARACTER_SCHEMA_VERSION = 2

export interface Lineage {
    id: string
    name: string
    nation: Nation | 'Any'
    description: string
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

export interface Feature {
    id: string
    name: string
    description: string
    source: 'Class' | 'Subclass' | 'Background' | 'Lineage' | 'Feat' | 'Technique' | 'Custom'
    featureType: 'Passive' | 'Action' | 'Bonus Action' | 'Reaction' | 'Limited Use'
    levelRequirement: number
    isActiveByDefault: boolean
    uses?: number
    recharge?: 'Short Rest' | 'Long Rest' | 'Manual' | null
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

export interface Character {
    schemaVersion: number
    id: string
    role: CharacterRole
    name: string
    nation: Nation
    lineageId: string
    level: number
    hp: number
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