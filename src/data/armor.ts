export type ArmorCategory = 'light' | 'medium' | 'heavy'

export interface ArmorPiece {
    id: string
    name: string
    category: ArmorCategory
    baseAc: number
    /** Most Dexterity modifier that counts. null means no cap; 0 means none applies. */
    dexCap: number | null
    stealthDisadvantage: boolean
}

/** Baseline 5e (SRD) armor. gmbinder defines proficiencies but not the armor itself. */
export const armorTable: ArmorPiece[] = [
    { id: 'padded', name: 'Padded', category: 'light', baseAc: 11, dexCap: null, stealthDisadvantage: true },
    { id: 'leather', name: 'Leather', category: 'light', baseAc: 11, dexCap: null, stealthDisadvantage: false },
    { id: 'studded-leather', name: 'Studded leather', category: 'light', baseAc: 12, dexCap: null, stealthDisadvantage: false },
    { id: 'hide', name: 'Hide', category: 'medium', baseAc: 12, dexCap: 2, stealthDisadvantage: false },
    { id: 'chain-shirt', name: 'Chain shirt', category: 'medium', baseAc: 13, dexCap: 2, stealthDisadvantage: false },
    { id: 'scale-mail', name: 'Scale mail', category: 'medium', baseAc: 14, dexCap: 2, stealthDisadvantage: true },
    { id: 'breastplate', name: 'Breastplate', category: 'medium', baseAc: 14, dexCap: 2, stealthDisadvantage: false },
    { id: 'half-plate', name: 'Half plate', category: 'medium', baseAc: 15, dexCap: 2, stealthDisadvantage: true },
    { id: 'ring-mail', name: 'Ring mail', category: 'heavy', baseAc: 14, dexCap: 0, stealthDisadvantage: true },
    { id: 'chain-mail', name: 'Chain mail', category: 'heavy', baseAc: 16, dexCap: 0, stealthDisadvantage: true },
    { id: 'splint', name: 'Splint', category: 'heavy', baseAc: 17, dexCap: 0, stealthDisadvantage: true },
    { id: 'plate', name: 'Plate', category: 'heavy', baseAc: 18, dexCap: 0, stealthDisadvantage: true },
]

export const SHIELD_AC_BONUS = 2

export function findArmor(armorId: string): ArmorPiece | null {
    return armorTable.find((armor) => armor.id === armorId) ?? null
}
