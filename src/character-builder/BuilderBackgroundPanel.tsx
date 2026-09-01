import { useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import type { Background, Character, Feature } from '../types/schema'

type BuilderBackgroundPanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    editableBackgrounds: Background[]
    editableFeatures: Feature[]
}

export function BuilderBackgroundPanel({
    character,
    setCharacter,
    editableBackgrounds,
    editableFeatures,
}: BuilderBackgroundPanelProps) {
    const selectedBackground =
        editableBackgrounds.find((item) => item.id === character.backgroundId) ?? null

    const backgroundFeatures = useMemo(() => {
        if (!selectedBackground) return []

        return selectedBackground.featureIds
            .map((featureId) => editableFeatures.find((item) => item.id === featureId))
            .filter((feature): feature is Feature => Boolean(feature))
    }, [selectedBackground, editableFeatures])

    const handleBackgroundChange = (backgroundId: string) => {
        const nextBackground =
            editableBackgrounds.find((item) => item.id === backgroundId) ?? null

        setCharacter((current) => {
            const filteredSkillProficiencies = current.skillProficiencies.filter(
                (skill) =>
                    !editableBackgrounds.some((background) =>
                        background.skillProficiencies.includes(skill),
                    ),
            )

            const filteredToolProficiencies = current.toolProficiencies.filter(
                (tool) =>
                    !editableBackgrounds.some((background) =>
                        background.toolProficiencies.includes(tool),
                    ),
            )

            const filteredLanguages = current.languages.filter(
                (language) =>
                    !editableBackgrounds.some((background) =>
                        background.languages.includes(language),
                    ),
            )

            if (!nextBackground) {
                return {
                    ...current,
                    backgroundId: undefined,
                    skillProficiencies: filteredSkillProficiencies,
                    toolProficiencies: filteredToolProficiencies,
                    languages: filteredLanguages,
                }
            }

            return {
                ...current,
                backgroundId: nextBackground.id,
                skillProficiencies: Array.from(
                    new Set([
                        ...filteredSkillProficiencies,
                        ...nextBackground.skillProficiencies,
                    ]),
                ),
                toolProficiencies: Array.from(
                    new Set([
                        ...filteredToolProficiencies,
                        ...nextBackground.toolProficiencies,
                    ]),
                ),
                languages: Array.from(
                    new Set([
                        ...filteredLanguages,
                        ...nextBackground.languages,
                    ]),
                ),
            }
        })
    }

    return (
        <div className="grid">
            <SectionCard title="Background Selection">
                <label>
                    Background
                    <select
                        value={character.backgroundId ?? ''}
                        onChange={(event) => handleBackgroundChange(event.target.value)}
                    >
                        <option value="">Select a background</option>
                        {editableBackgrounds.map((background) => (
                            <option key={background.id} value={background.id}>
                                {background.name}
                            </option>
                        ))}
                    </select>
                </label>

                {selectedBackground ? (
                    <>
                        <p><strong>{selectedBackground.name}</strong></p>
                        <p>{selectedBackground.description}</p>
                    </>
                ) : (
                    <p>
                        Select a background to apply narrative identity and starting
                        benefits.
                    </p>
                )}
            </SectionCard>

            <SectionCard title="Granted Benefits">
                {!selectedBackground ? (
                    <p>No background selected yet.</p>
                ) : (
                    <>
                        <h3>Skill Proficiencies</h3>
                        {selectedBackground.skillProficiencies.length === 0 ? (
                            <p>No skill proficiencies granted.</p>
                        ) : (
                            <ul className="stats">
                                {selectedBackground.skillProficiencies.map((skill) => (
                                    <li key={skill}>{skill}</li>
                                ))}
                            </ul>
                        )}

                        <h3>Tool Proficiencies</h3>
                        {selectedBackground.toolProficiencies.length === 0 ? (
                            <p>No tool proficiencies granted.</p>
                        ) : (
                            <ul className="stats">
                                {selectedBackground.toolProficiencies.map((tool) => (
                                    <li key={tool}>{tool}</li>
                                ))}
                            </ul>
                        )}

                        <h3>Languages</h3>
                        {selectedBackground.languages.length === 0 ? (
                            <p>No languages granted.</p>
                        ) : (
                            <ul className="stats">
                                {selectedBackground.languages.map((language) => (
                                    <li key={language}>{language}</li>
                                ))}
                            </ul>
                        )}

                        <h3>Background Features</h3>
                        {backgroundFeatures.length === 0 ? (
                            <p>No background features granted.</p>
                        ) : (
                            <div className="npc-list">
                                {backgroundFeatures.map((feature) => (
                                    <article key={feature.id} className="npc-item">
                                        <h3>{feature.name}</h3>
                                        <p>
                                            {feature.source} · {feature.featureType}
                                        </p>
                                        <p>{feature.description}</p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </SectionCard>

            <SectionCard title="Narrative Details">
                <label>
                    Background Notes
                    <textarea
                        rows={4}
                        value={character.backgroundNotes}
                        onChange={(event) =>
                            setCharacter((current) => ({
                                ...current,
                                backgroundNotes: event.target.value,
                            }))
                        }
                    />
                </label>

                <label>
                    Personality
                    <textarea
                        rows={3}
                        value={character.personality}
                        onChange={(event) =>
                            setCharacter((current) => ({
                                ...current,
                                personality: event.target.value,
                            }))
                        }
                    />
                </label>

                <label>
                    Ideals
                    <textarea
                        rows={3}
                        value={character.ideals}
                        onChange={(event) =>
                            setCharacter((current) => ({
                                ...current,
                                ideals: event.target.value,
                            }))
                        }
                    />
                </label>

                <label>
                    Bonds
                    <textarea
                        rows={3}
                        value={character.bonds}
                        onChange={(event) =>
                            setCharacter((current) => ({
                                ...current,
                                bonds: event.target.value,
                            }))
                        }
                    />
                </label>

                <label>
                    Flaws
                    <textarea
                        rows={3}
                        value={character.flaws}
                        onChange={(event) =>
                            setCharacter((current) => ({
                                ...current,
                                flaws: event.target.value,
                            }))
                        }
                    />
                </label>
            </SectionCard>

            <SectionCard title="Current Background Summary">
                <ul className="stats">
                    <li>
                        <strong>Selected Background:</strong>{' '}
                        {selectedBackground?.name ?? 'None'}
                    </li>
                    <li>
                        <strong>Character Skills:</strong>{' '}
                        {character.skillProficiencies.length > 0
                            ? character.skillProficiencies.join(', ')
                            : 'None'}
                    </li>
                    <li>
                        <strong>Character Tools:</strong>{' '}
                        {character.toolProficiencies.length > 0
                            ? character.toolProficiencies.join(', ')
                            : 'None'}
                    </li>
                    <li>
                        <strong>Character Languages:</strong>{' '}
                        {character.languages.length > 0
                            ? character.languages.join(', ')
                            : 'None'}
                    </li>
                </ul>
            </SectionCard>
        </div>
    )
}