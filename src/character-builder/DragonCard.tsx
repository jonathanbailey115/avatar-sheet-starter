import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { DRAGON_ANCESTRIES } from '../data/dragonAncestry'
import { DRAGON_TRAINER_ID } from '../data/dragonTrainer'
import { classLevelsOf, levelInClass } from '../engine/classLevels'
import type { Character, CharacterClass } from '../types/schema'

interface Props {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    classes: CharacterClass[]
}

/** Dragon Trainer: which dragon the companion is. It decides the damage type and the Dragon Mage's element. */
export function DragonCard({ character, setCharacter, classes }: Props) {
    if (levelInClass(classLevelsOf(character, classes), DRAGON_TRAINER_ID) < 1) return null

    return (
        <SectionCard title="Dragon ancestry">
            <p className="muted">
                Your dragon companion's ancestry sets its damage type (breath, Rend extras, resistance and immunity). Once chosen it
                cannot change unless you bond with a new dragon.
            </p>
            <div className="choice-list" role="radiogroup" aria-label="Dragon ancestry">
                {DRAGON_ANCESTRIES.map((ancestry) => (
                    <label key={ancestry.id} className="inline-check">
                        <input
                            type="radio"
                            name="dragon-ancestry"
                            checked={character.dragonAncestry === ancestry.id}
                            onChange={() => setCharacter((current) => ({ ...current, dragonAncestry: ancestry.id }))}
                        />
                        <span>
                            <strong>{ancestry.name}</strong> · {ancestry.damageType} · Dragon Mage element {ancestry.element}
                            <small className="muted"> {ancestry.flavour}</small>
                        </span>
                    </label>
                ))}
            </div>
        </SectionCard>
    )
}
