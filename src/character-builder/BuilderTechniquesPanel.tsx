import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import type { BendingType, Character, Style, Technique } from '../types/schema'

type BuilderTechniquesPanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    filteredStyles: Style[]
    filteredTechniques: Technique[]
    handleBendingTypeChange: (bendingType: BendingType) => void
    handleTechniqueToggle: (technique: Technique) => void
}

const bendingOptions: BendingType[] = [
    'Air',
    'Water',
    'Earth',
    'Fire',
    'Non-Bender',
]

export function BuilderTechniquesPanel({
    character,
    setCharacter,
    filteredStyles,
    filteredTechniques,
    handleBendingTypeChange,
    handleTechniqueToggle,
}: BuilderTechniquesPanelProps) {
    const selectedStyle =
        filteredStyles.find((style) => style.name === character.style) ?? null

    const selectedTechniques = character.techniques.filter(
        (technique) => technique.bendingType === character.bendingType,
    )

    return (
        <div className="grid">
            <SectionCard title="Technique Setup">
                <p>
                    Choose the character’s bending discipline or non-bender path,
                    then select an appropriate combat style.
                </p>

                <label>
                    Bending Type
                    <select
                        value={character.bendingType}
                        onChange={(event) =>
                            handleBendingTypeChange(event.target.value as BendingType)
                        }
                    >
                        {bendingOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Style
                    <select
                        value={character.style}
                        onChange={(event) =>
                            setCharacter((current) => ({
                                ...current,
                                style: event.target.value,
                            }))
                        }
                    >
                        {filteredStyles.length === 0 ? (
                            <option value="">No available styles</option>
                        ) : (
                            filteredStyles.map((style) => (
                                <option key={style.id} value={style.name}>
                                    {style.name}
                                </option>
                            ))
                        )}
                    </select>
                </label>

                {selectedStyle ? (
                    <>
                        <p><strong>{selectedStyle.name}</strong></p>
                        <p>{selectedStyle.description}</p>
                    </>
                ) : (
                    <p>No style is currently selected for this bending type.</p>
                )}
            </SectionCard>

            <SectionCard title="Technique Library">
                {filteredTechniques.length === 0 ? (
                    <p>No techniques are available for this bending type.</p>
                ) : (
                    <div className="checkbox-list">
                        {filteredTechniques.map((technique) => {
                            const checked = character.techniques.some(
                                (item) => item.id === technique.id,
                            )

                            return (
                                <label key={technique.id} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleTechniqueToggle(technique)}
                                    />
                                    <span>
                                        <strong>{technique.name}</strong> — Tier {technique.tier}
                                        <br />
                                        <small>{technique.description}</small>
                                    </span>
                                </label>
                            )
                        })}
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Selected Techniques">
                {selectedTechniques.length === 0 ? (
                    <p>No techniques selected yet for this bending type.</p>
                ) : (
                    <div className="npc-list">
                        {selectedTechniques.map((technique) => (
                            <article key={technique.id} className="npc-item">
                                <h3>{technique.name}</h3>
                                <p>Tier {technique.tier}</p>
                                <p>{technique.description}</p>
                            </article>
                        ))}
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Technique Summary">
                <ul className="stats">
                    <li>
                        <strong>Bending Type:</strong> {character.bendingType}
                    </li>
                    <li>
                        <strong>Style:</strong> {character.style || 'None selected'}
                    </li>
                    <li>
                        <strong>Total Learned Techniques:</strong> {selectedTechniques.length}
                    </li>
                </ul>
            </SectionCard>
        </div>
    )
}