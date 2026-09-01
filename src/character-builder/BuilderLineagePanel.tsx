import { useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import type { Character, Lineage, Nation } from '../types/schema'

type BuilderLineagePanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    nations: Nation[]
    filteredLineages: Lineage[]
    handleNationChange: (nation: Character['nation']) => void
}

export function BuilderLineagePanel({
    character,
    setCharacter,
    nations,
    filteredLineages,
    handleNationChange,
}: BuilderLineagePanelProps) {
    const selectedLineage = useMemo(() => {
        return (
            filteredLineages.find((lineage) => lineage.id === character.lineageId) ??
            null
        )
    }, [filteredLineages, character.lineageId])

    return (
        <div className="grid">
            <SectionCard title="Nation and Lineage">
                <p>
                    Choose the character’s cultural origin and lineage. Available
                    lineage options update based on the selected nation.
                </p>

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
                            setCharacter((current) => ({
                                ...current,
                                lineageId: event.target.value,
                            }))
                        }
                    >
                        <option value="">Select a lineage</option>
                        {filteredLineages.map((lineage) => (
                            <option key={lineage.id} value={lineage.id}>
                                {lineage.name}
                            </option>
                        ))}
                    </select>
                </label>

                {selectedLineage ? (
                    <>
                        <p><strong>{selectedLineage.name}</strong></p>
                        <p>{selectedLineage.description}</p>
                    </>
                ) : (
                    <p>Select a lineage to define ancestry and cultural identity.</p>
                )}
            </SectionCard>
        </div>
    )
}