import { armorTable } from '../data/armor'
import type { ArmorPiece } from '../data/armor'
import { weaponTable } from '../data/weapons'
import type { Weapon } from '../data/weapons'
import { weaponProficient } from '../engine/attacks'
import { computeSheet } from '../engine/sheet'
import { newId } from '../lib/character'
import type { RulesContent } from '../lib/normalize'
import { pickOne } from '../lib/random'
import type { Rng } from '../lib/random'
import type { Character, Lineage } from '../types/schema'

const norm = (text: string) => text.toLowerCase().replace(/[^a-z]/g, '')

function armorAllowed(piece: ArmorPiece, lineage: Lineage | undefined): boolean {
    const known = new Set((lineage?.armorProficiencies ?? []).map(norm))
    return known.has(norm(`${piece.category} armor`))
}

function shieldAllowed(lineage: Lineage | undefined): boolean {
    return (lineage?.armorProficiencies ?? []).some((item) => norm(item).startsWith('shield'))
}

function weaponPool(lineage: Lineage | undefined): Weapon[] {
    const proficient = weaponTable.filter((weapon) => weaponProficient(weapon, lineage?.weaponProficiencies))
    return proficient.length > 0 ? proficient : weaponTable.filter((weapon) => weapon.category === 'simple')
}

/**
 * Armor, shield and weapons the NPC can use. `combat` (0-1) is how often the role suits up at all.
 * Armor is whichever proficient piece gives the best AC on the computed sheet, or none.
 */
export function equip(character: Character, content: RulesContent, combat: number, rng: Rng): Character {
    const lineage = content.lineages.find((item) => item.id === character.lineageId)
    const armed = rng() < combat

    const pool = weaponPool(lineage)
    const melee = pool.filter((weapon) => weapon.kind === 'melee')
    const ranged = pool.filter((weapon) => weapon.kind === 'ranged')
    const dexterous = character.dexterity > character.strength
    const preferred = dexterous ? pool.filter((w) => w.properties.includes('finesse') || w.kind === 'ranged') : melee
    const main = pickOne(preferred.length > 0 ? preferred : pool, rng)
    const backup = main?.kind === 'melee' ? pickOne(ranged, rng) : pickOne(melee, rng)
    const chosen = [main, armed ? backup : null].filter((weapon): weapon is Weapon => Boolean(weapon))

    let next: Character = {
        ...character,
        armorId: '',
        armorName: '',
        hasShield: false,
        weapons: chosen.map((weapon) => ({ id: newId(), weaponId: weapon.id, bonus: 0 })),
    }

    if (armed) {
        const twoHanded = main?.properties.includes('two-handed') ?? false
        const shield = !twoHanded && shieldAllowed(lineage) && rng() < 0.5
        let best = next
        let bestAc = computeSheet({ ...next, hasShield: shield }, content).armorClass.total
        for (const piece of armorTable.filter((item) => armorAllowed(item, lineage))) {
            const trial = { ...next, armorId: piece.id, armorName: piece.name, hasShield: shield }
            const ac = computeSheet(trial, content).armorClass.total
            if (ac > bestAc) {
                best = trial
                bestAc = ac
            }
        }
        next = best.armorId ? best : { ...next, hasShield: shield }
    }
    return next
}
