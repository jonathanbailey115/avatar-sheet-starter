import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import type { BendingType, Character, Lineage, Nation, Style } from '../types/schema'

type BuilderOverviewPanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    nations: Nation[]
    bendingTypes: BendingType[]
    filteredLineages: Lineage[]
    filteredStyles: Style[]
    handleNationChange: (nation: Character['nation']) => void
    handleBendingTypeChange: (bendingType: BendingType) => void
    exportCharacter: () => void
}

export function BuilderOverviewPanel({
    character,
    setCharacter,
    nations,
    bendingTypes,
    filteredLineages,
    filteredStyles,
    handleNationChange,
    handleBendingTypeChange,
    exportCharacter,
}: BuilderOverviewPanelProps) {
    return (
        <div className="grid">
            <SectionCard title="Builder starter">
                <label>
                    Character name
                    <input
                        value={character.name}
                        onChange={(event) =>
                            setCharacter({ ...character, name: event.target.value })
                        }
                    />
                </label>

                <label>
                    Nation
                    <select
                        value={character.nation}
                        onChange={(event) =>
                            handleNationChange(event.target.value as Character['nation'])
                        }
                    >
                        {nations.map((nation) => (
                            <option key={nation} value={nation}>
                                {nation}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Lineage
                    <select
                        value={character.lineageId}
                        onChange={(event) =>
                            setCharacter({ ...character, lineageId: event.target.value })
                        }
                    >
                        {filteredLineages.map((lineage) => (
                            <option key={lineage.id} value={lineage.id}>
                                {lineage.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Bending type
                    <select
                        value={character.bendingType}
                        onChange={(event) =>
                            handleBendingTypeChange(event.target.value as BendingType)
                        }
                    >
                        {bendingTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Style
                    <select
                        value={character.style}
                        onChange={(event) =>
                            setCharacter({ ...character, style: event.target.value })
                        }
                    >
                        {filteredStyles.map((style) => (
                            <option key={style.id} value={style.name}>
                                {style.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Background
                    <textarea
                        rows={4}
                        value={character.backgroundNotes}
                        onChange={(event) =>
                            setCharacter({ ...character, backgroundNotes: event.target.value })
                        }
                    />
                </label>

                <div className="actions">
                    <button className="primary-button" onClick={exportCharacter} type="button">
                        Save Character JSON
                    </button>
                </div>
            </SectionCard>
        </div>
    )
}