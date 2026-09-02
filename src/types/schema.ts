export type Nation = 'Air Nomads' | 'Water Tribe' | 'Earth Kingdom' | 'Fire Nation' | 'Mixed'
export type CharacterRole = 'Player Character' | 'NPC'
export type BendingType = 'Air' | 'Water' | 'Earth' | 'Fire' | 'Non-Bender'
export type TechniqueTier = 1 | 2 | 3 | 4

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

export interface Style {
    id: string
    name: string
    bendingType: BendingType
    nation: Nation | 'Any'
    description: string
}

export interface Technique {
    id: string
    name: string
    tier: TechniqueTier
    bendingType: BendingType
    description: string
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
    id: string
    role: CharacterRole
    name: string
    nation: Nation
    lineageId: string
    bendingType: BendingType
    style: string
    level: number
    hp: number
    chi: number
    backgroundId?: string
    backgroundNotes: string
    personality: string
    ideals: string
    bonds: string
    flaws: string
    techniques: Technique[]
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
    'Mixed',
]

export const bendingTypes: BendingType[] = [
    'Air',
    'Water',
    'Earth',
    'Fire',
    'Non-Bender',
]