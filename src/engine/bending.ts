import type { Character, CharacterClass, Element, Nation } from '../types/schema'

/** Bending is derived from the class. Non-benders and characters without a class return null. */
export function getBendingElement(
    character: Pick<Character, 'classId'>,
    classes: CharacterClass[],
): Element | null {
    return classes.find((item) => item.id === character.classId)?.element ?? null
}

/** A bender bends only the element of their lineage's nation (gmbinder, Benders). */
export const NATION_ELEMENT: Record<Nation, Element> = {
    'Air Nomads': 'Air',
    'Water Tribe': 'Water',
    'Earth Kingdom': 'Earth',
    'Fire Nation': 'Fire',
}
