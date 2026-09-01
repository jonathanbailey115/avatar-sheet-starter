import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import type { Character } from '../types/schema'

type BuilderHomePanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
}

export function BuilderHomePanel({
    character,
    setCharacter,
}: BuilderHomePanelProps) {
    return (
        <div className="grid">
            <SectionCard title="Character Home">
                <label>
                    Character name
                    <input
                        value={character.name}
                        onChange={(event) =>
                            setCharacter((current) => ({
                                ...current,
                                name: event.target.value,
                            }))
                        }
                    />
                </label>

                <label>
                    Character notes
                    <textarea
                        rows={4}
                        value={character.notes}
                        onChange={(event) =>
                            setCharacter((current) => ({
                                ...current,
                                notes: event.target.value,
                            }))
                        }
                    />
                </label>
            </SectionCard>
        </div>
    )
}