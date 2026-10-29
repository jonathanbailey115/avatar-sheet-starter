import { getBendingElement } from '../engine/bending'
import type { Character, CharacterClass } from '../types/schema'

/** The value of the data-element attribute that tints a screen (see src/styles/tokens.css). */
export type ElementTheme = 'water' | 'earth' | 'fire' | 'air' | 'none' | 'neutral'

/**
 * Which accent a character's screens use: their bending element, 'none' for a class that does not
 * bend (Weaponsmaster, Tech-Engineer), and 'neutral' when there is no character or no class yet.
 */
export function elementTheme(
    character: Pick<Character, 'classId'> | null | undefined,
    classes: CharacterClass[],
): ElementTheme {
    if (!character?.classId) return 'neutral'
    if (!classes.some((item) => item.id === character.classId)) return 'neutral'
    const element = getBendingElement(character, classes)
    return element ? (element.toLowerCase() as ElementTheme) : 'none'
}

/** The same theme looked up by class name, for places that only have the name (the party board). */
export function elementThemeForClassName(className: string, classes: CharacterClass[]): ElementTheme {
    // Several classes arrive as "Airbending / Dragon Trainer"; the first names the character's accent.
    const found = classes.find((item) => item.name === className.split(' / ')[0])
    return found ? elementTheme({ classId: found.id }, classes) : 'neutral'
}
