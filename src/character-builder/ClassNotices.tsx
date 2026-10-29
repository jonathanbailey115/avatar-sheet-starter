import type { Dispatch, SetStateAction } from 'react'
import { ABILITY_NAMES } from '../engine/abilities'
import { useCollection } from '../store/content'
import type { Character, CharacterClass } from '../types/schema'

interface Props {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    selectedClass: CharacterClass
}

/** Notes and options that come with the chosen class and lineage. */
export function ClassNotices({ character, setCharacter, selectedClass }: Props) {
    const lineage = useCollection('lineages').find((item) => item.id === character.lineageId)
    const airNomadNonBender = lineage?.nation === 'Air Nomads' && selectedClass.element !== 'Air'
    const alternate = selectedClass.altBendingAbility

    return (
        <>
            {alternate && selectedClass.bendingAbility && (
                <label className="inline-check">
                    <input
                        type="checkbox"
                        checked={character.abilityOption}
                        onChange={(event) => setCharacter((current) => ({ ...current, abilityOption: event.target.checked }))}
                    />
                    <span>
                        My GM allows {ABILITY_NAMES[alternate]} instead of {ABILITY_NAMES[selectedClass.bendingAbility]}
                        <small className="muted">
                            {' '}
                            gmbinder lets you use {ABILITY_NAMES[alternate]} for your Bending Save DC, attack modifier and basic attack "with your GM’s
                            permission".
                        </small>
                    </span>
                </label>
            )}
            {airNomadNonBender && (
                <p className="status-message" role="note">
                    gmbinder says every character of Air Nomad lineage is an airbender (you can choose another lineage and adopt their
                    doctrine instead). Ask your GM before playing an Air Nomad as {selectedClass.name}.
                </p>
            )}
        </>
    )
}
