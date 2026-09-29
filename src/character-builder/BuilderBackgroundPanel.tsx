import { useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { blankCustomBackground, withCustomBackground } from '../lib/customBackground'
import { CUSTOM_BACKGROUND_ID } from '../types/schema'
import type { Background, Character, Feature } from '../types/schema'
import { CustomBackgroundForm } from './CustomBackgroundForm'

type BuilderBackgroundPanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    editableBackgrounds: Background[]
    editableFeatures: Feature[]
}

export function BuilderBackgroundPanel({
    character,
    setCharacter,
    editableBackgrounds: baseBackgrounds,
    editableFeatures: baseFeatures,
}: BuilderBackgroundPanelProps) {
    // Includes this character's custom background so it shows like any other.
    const { backgrounds: editableBackgrounds, features: editableFeatures } = withCustomBackground(character, {
        backgrounds: baseBackgrounds,
        features: baseFeatures,
    })
    const selectedBackground =
        editableBackgrounds.find((item) => item.id === character.backgroundId) ?? null

    const backgroundFeatures = useMemo(() => {
        if (!selectedBackground) return []

        return selectedBackground.featureIds
            .map((featureId) => editableFeatures.find((item) => item.id === featureId))
            .filter((feature): feature is Feature => Boolean(feature))
    }, [selectedBackground, editableFeatures])

    const handleBackgroundChange = (backgroundId: string) => {
        setCharacter((current) => ({
            ...current,
            backgroundId: backgroundId || undefined,
            customBackground:
                backgroundId === CUSTOM_BACKGROUND_ID
                    ? (current.customBackground ?? blankCustomBackground())
                    : current.customBackground,
        }))
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
                        <option value={CUSTOM_BACKGROUND_ID}>Custom background…</option>
                        {baseBackgrounds.map((background) => (
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

            {character.backgroundId === CUSTOM_BACKGROUND_ID && (
                <CustomBackgroundForm character={character} setCharacter={setCharacter} />
            )}

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