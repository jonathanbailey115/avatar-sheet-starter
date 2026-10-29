import type { RulesContent } from '../lib/normalize'
import type { Character, Lineage } from '../types/schema'
import { classEntries, classLevelsOf } from './classLevels'

/** Armor and weapon proficiencies the character's classes and subclasses add to the lineage's (Dragon Trainer, Dragon Knight). */
export interface GrantedProficiencies {
    armor: string[]
    weapons: string[]
}

const unique = (lists: string[][]): string[] => {
    const seen = new Set<string>()
    return lists.flat().filter((entry) => {
        const key = entry.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

export function classProficiencies(
    character: Pick<Character, 'classId' | 'level'> & Partial<Pick<Character, 'subclassId' | 'extraClasses'>>,
    content: Pick<RulesContent, 'classes' | 'subclasses'>,
): GrantedProficiencies {
    const classes = classLevelsOf(character, content.classes).map((item) => item.characterClass)
    const subclasses = classEntries(character).flatMap((entry) => {
        const subclass = content.subclasses.find((item) => item.id === entry.subclassId && item.classId === entry.classId)
        return subclass && subclass.unlockLevel <= entry.level ? [subclass] : []
    })
    return {
        armor: unique([...classes, ...subclasses].map((item) => item.armorProficiencies ?? [])),
        weapons: unique([...classes, ...subclasses].map((item) => item.weaponProficiencies ?? [])),
    }
}

/** The lineage with these proficiencies added, so the armor and weapon rules see all of them. */
export function withClassProficiencies(lineage: Lineage | null, granted: GrantedProficiencies): Lineage | null {
    if (!lineage || (granted.armor.length === 0 && granted.weapons.length === 0)) return lineage
    return {
        ...lineage,
        armorProficiencies: unique([lineage.armorProficiencies ?? [], granted.armor]),
        weaponProficiencies: unique([lineage.weaponProficiencies ?? [], granted.weapons]),
    }
}
