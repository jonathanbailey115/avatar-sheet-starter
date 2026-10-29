import type { CharacterClass, Character, Technique, TechniqueDiscipline } from '../types/schema'
import { learnBlocker, limitStatus } from './techniques'

/** Test helpers: the technique rules for a single class at the character's whole level. */
type Known = Pick<Character, 'level' | 'knownTechniques'>

const single = (characterClass: CharacterClass | undefined, character: Pick<Character, 'level'>) =>
    characterClass ? [{ characterClass, level: character.level }] : []

export const learnBlockerFor = (
    character: Known,
    technique: Technique,
    characterClass: CharacterClass | undefined,
    all: Technique[],
    disciplines?: TechniqueDiscipline[],
) => learnBlocker(character, technique, single(characterClass, character), all, disciplines)

export const limitStatusFor = (character: Known, characterClass: CharacterClass | undefined, all: Technique[]) =>
    limitStatus(character, single(characterClass, character), all)
