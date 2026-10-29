import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { AVATAR_ID } from '../data/avatar'
import { classLevelsOf, levelInClass } from '../engine/classLevels'
import type { Character, CharacterClass } from '../types/schema'

interface Props {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    classes: CharacterClass[]
}

/** The Avatar: how the other elements arrive. Stand-in draft, see docs/RULES_QUESTIONS.md (AV1). */
export function AvatarCard({ character, setCharacter, classes }: Props) {
    if (levelInClass(classLevelsOf(character, classes), AVATAR_ID) < 1) return null

    return (
        <SectionCard title="The Avatar">
            <p className="muted">
                The Avatar bends all four elements. Add bending classes under Multiclass: one level in each at the start, or one element
                to begin with and each new element after finding a master. This class is a stand-in draft for your GM to approve.
            </p>
            <label className="inline-check">
                <input
                    type="checkbox"
                    checked={character.avatarAllElements}
                    onChange={(event) => setCharacter((current) => ({ ...current, avatarAllElements: event.target.checked }))}
                />
                <span>
                    Starts with every element
                    <small className="muted"> Off: each new element needs a master and your GM's approval.</small>
                </span>
            </label>
        </SectionCard>
    )
}
