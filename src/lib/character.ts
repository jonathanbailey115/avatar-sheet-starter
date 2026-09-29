import { CHARACTER_SCHEMA_VERSION } from '../types/schema'
import type { Character, CharacterRole } from '../types/schema'

export function newId(): string {
    return globalThis.crypto.randomUUID()
}

export function createBlankCharacter(role: CharacterRole = 'Player Character'): Character {
    return {
        schemaVersion: CHARACTER_SCHEMA_VERSION,
        id: newId(),
        role,
        name: '',
        nation: 'Earth Kingdom',
        lineageId: '',
        // NPCs are built with final scores; player characters start as Human (+1 to every ability).
        species: role === 'NPC' ? 'none' : 'human',
        speciesAbilityChoices: [],
        speciesSkill: null,
        abilityOption: false,
        level: 1,
        maxHpOverride: null,
        maxHpAdjustment: 0,
        hpRolls: [],
        hpLost: 0,
        tempHp: 0,
        hitDiceUsed: 0,
        deathSaves: { successes: 0, failures: 0 },
        exhaustion: 0,
        resourcesUsed: {},
        backgroundId: undefined,
        customBackground: null,
        backgroundNotes: '',
        personality: '',
        ideals: '',
        bonds: '',
        flaws: '',
        knownTechniques: [],
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
        manualSavingThrows: [],
        manualSkills: [],
        manualTools: [],
        manualLanguages: [],
        migrationNotes: [],
        armorName: '',
        armorId: '',
        hasShield: false,
        weapons: [],
        weaponNotes: '',
        inventoryItems: [],
        currency: '',
        equipmentNotes: '',
    }
}

export function characterDisplayName(character: Pick<Character, 'name'>): string {
    return character.name.trim() || 'Unnamed character'
}

export function copyCharacter(character: Character): Character {
    return {
        ...structuredClone(character),
        id: newId(),
        name: character.name.trim() ? `${character.name} (copy)` : '',
    }
}
