import type { Dispatch, SetStateAction } from 'react'
import { useCollection } from '../store/content'
import type { AbilityName, Character, CharacterClass } from '../types/schema'

const NAME: Record<AbilityName, string> = {
    strength: 'Strength',
    dexterity: 'Dexterity',
    constitution: 'Constitution',
    intelligence: 'Intelligence',
    wisdom: 'Wisdom',
    charisma: 'Charisma',
}

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
                        My GM allows {NAME[alternate]} instead of {NAME[selectedClass.bendingAbility]}
                        <small className="muted">
                            {' '}
                            gmbinder lets you use {NAME[alternate]} for your Bending Save DC, attack modifier and basic attack "with your GM’s
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
