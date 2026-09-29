import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { getBendingElement } from '../engine/bending'
import { DEFAULT_TRAINING, TECHNIQUE_LEVELS } from '../types/schema'
import type { Character, CharacterClass, Technique, TechniqueLevel } from '../types/schema'

type BuilderTechniquesPanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    editableClasses: CharacterClass[]
    editableTechniques: Technique[]
}

export function BuilderTechniquesPanel({
    character,
    setCharacter,
    editableClasses,
    editableTechniques,
}: BuilderTechniquesPanelProps) {
    const selectedClass = editableClasses.find((item) => item.id === character.classId) ?? null
    const element = getBendingElement(character, editableClasses)

    const available = editableTechniques.filter(
        (technique) => technique.element === 'Universal' || technique.element === element,
    )

    const knownLevel = (techniqueId: string): TechniqueLevel | null =>
        character.knownTechniques.find((known) => known.techniqueId === techniqueId)?.level ?? null

    const learn = (techniqueId: string) =>
        setCharacter((current) => ({
            ...current,
            knownTechniques: [...current.knownTechniques, { techniqueId, level: 'Practiced', training: DEFAULT_TRAINING }],
        }))

    const forget = (techniqueId: string) =>
        setCharacter((current) => ({
            ...current,
            knownTechniques: current.knownTechniques.filter(
                (known) => known.techniqueId !== techniqueId,
            ),
        }))

    const setLevel = (techniqueId: string, level: TechniqueLevel) =>
        setCharacter((current) => ({
            ...current,
            knownTechniques: current.knownTechniques.map((known) =>
                known.techniqueId === techniqueId ? { ...known, level } : known,
            ),
        }))

    return (
        <div className="grid">
            <SectionCard title="Bending">
                {!selectedClass ? (
                    <p>Choose a class on the Class tab. Your bending comes from your class.</p>
                ) : element ? (
                    <p>
                        <strong>{element}bending</strong> (from {selectedClass.name}). Techniques
                        come from the {element}bending list and the Universal list.
                    </p>
                ) : (
                    <p>
                        <strong>Non-bender</strong> ({selectedClass.name}). Only Universal
                        techniques apply.
                    </p>
                )}
            </SectionCard>

            <SectionCard title="Technique Library">
                {available.length === 0 ? (
                    <p>
                        No techniques are available yet. The gmbinder technique list arrives with the
                        rules engine, and your GM can add custom techniques under Campaign Data.
                    </p>
                ) : (
                    <div className="checkbox-list">
                        {available.map((technique) => {
                            const level = knownLevel(technique.id)

                            return (
                                <div key={technique.id} className="checkbox-item">
                                    <span>
                                        <strong>{technique.name}</strong> — {technique.element}
                                        <br />
                                        <small>{technique.description}</small>
                                    </span>

                                    {level ? (
                                        <span className="actions inline-actions">
                                            <select
                                                value={level}
                                                onChange={(event) =>
                                                    setLevel(
                                                        technique.id,
                                                        event.target.value as TechniqueLevel,
                                                    )
                                                }
                                            >
                                                {TECHNIQUE_LEVELS.map((option) => (
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                className="secondary-button"
                                                type="button"
                                                onClick={() => forget(technique.id)}
                                            >
                                                Forget
                                            </button>
                                        </span>
                                    ) : (
                                        <button
                                            className="primary-button"
                                            type="button"
                                            onClick={() => learn(technique.id)}
                                        >
                                            Learn
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Known Techniques">
                {character.knownTechniques.length === 0 ? (
                    <p>No techniques learned yet.</p>
                ) : (
                    <ul className="stats">
                        {character.knownTechniques.map((known) => {
                            const technique = editableTechniques.find(
                                (item) => item.id === known.techniqueId,
                            )
                            return (
                                <li key={known.techniqueId}>
                                    <strong>{technique?.name ?? known.techniqueId}</strong> —{' '}
                                    {known.level}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </SectionCard>
        </div>
    )
}
