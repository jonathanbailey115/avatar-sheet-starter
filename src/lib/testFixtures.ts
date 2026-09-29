import { backgrounds, characterClasses, characterSubclasses, features, lineages, techniques } from '../data'
import type { RulesContent } from './normalize'

/** The unversioned (schema 1) sheet the app used before persistence existed. */
export function legacyCharacterV1(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: 'player-1',
        role: 'Player Character',
        name: 'Ling',
        nation: 'Earth Kingdom',
        lineageId: 'earth-kingdom-human',
        bendingType: 'Earth',
        style: 'Earthbender',
        level: 3,
        hp: 12,
        chi: 3,
        backgroundNotes: '',
        personality: '',
        ideals: '',
        bonds: '',
        flaws: '',
        techniques: [
            { id: 'stone-guard', name: 'Stone Guard', tier: 1, bendingType: 'Earth', description: '' },
        ],
        notes: '',
        strength: 10,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        savingThrowProficiencies: ['constitution'],
        skillProficiencies: ['Athletics'],
        classSkillChoices: [],
        toolProficiencies: ['Smith’s Tools'],
        languages: ['Common'],
        selectedFeatureIds: ['class-guardian-combat-training', 'lineage-earth-kingdom-unarmored-defense'],
        classId: 'guardian',
        armorName: '',
        weaponNotes: '',
        inventoryItems: [],
        currency: '',
        equipmentNotes: '',
        ...overrides,
    }
}

export const realContent: RulesContent = {
    classes: characterClasses,
    subclasses: characterSubclasses,
    lineages,
    backgrounds,
    features,
    techniques,
}
