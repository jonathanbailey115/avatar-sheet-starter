import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { epicBoons, findBoon } from '../data/epicBoons'
import { ABILITIES, ABILITY_NAMES } from '../engine/abilities'
import { boonSlots } from '../engine/classLevels'
import type { AbilityName, Character, CharacterClass } from '../types/schema'

interface Props {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    classes: CharacterClass[]
}

/** Epic Boons: one for each class taken to level 20. Only Boon of the Element can be taken again. */
export function BoonsCard({ character, setCharacter, classes }: Props) {
    const earned = boonSlots(character, classes)
    if (earned === 0 && character.epicBoons.length === 0) return null

    const taken = new Set(character.epicBoons.map((pick) => pick.boonId))
    const options = epicBoons.filter((boon) => boon.repeatable || !taken.has(boon.id))

    const add = (boonId: string) =>
        setCharacter((current) => ({
            ...current,
            epicBoons: [...current.epicBoons, { boonId, ability: findBoon(boonId)?.needsAbility ? 'strength' : undefined }],
        }))

    const setAbility = (index: number, ability: AbilityName) =>
        setCharacter((current) => ({
            ...current,
            epicBoons: current.epicBoons.map((pick, at) => (at === index ? { ...pick, ability } : pick)),
        }))

    const remove = (index: number) =>
        setCharacter((current) => ({ ...current, epicBoons: current.epicBoons.filter((_, at) => at !== index) }))

    return (
        <SectionCard title="Epic Boons">
            <p className="muted">
                You earn one Epic Boon for every class you take to level 20. Used {character.epicBoons.length} of {earned}.
            </p>

            {character.epicBoons.map((pick, index) => {
                const boon = findBoon(pick.boonId)
                return (
                    <article key={`${pick.boonId}-${index}`} className="npc-item">
                        <h3>{boon?.feature.name ?? pick.boonId}</h3>
                        {boon && <p className="muted">{boon.feature.description}</p>}
                        {boon?.needsAbility && (
                            <label>
                                Ability
                                <select value={pick.ability ?? 'strength'} onChange={(event) => setAbility(index, event.target.value as AbilityName)}>
                                    {ABILITIES.map((ability) => (
                                        <option key={ability} value={ability}>
                                            {ABILITY_NAMES[ability]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                        <div className="actions inline-actions">
                            <button className="secondary-button" type="button" onClick={() => remove(index)}>
                                Remove
                            </button>
                        </div>
                    </article>
                )
            })}

            <label>
                Choose a boon
                <select value="" disabled={character.epicBoons.length >= earned} onChange={(event) => event.target.value && add(event.target.value)}>
                    <option value="">{character.epicBoons.length >= earned ? 'No boon left to choose' : 'Choose an Epic Boon'}</option>
                    {options.map((boon) => (
                        <option key={boon.id} value={boon.id}>
                            {boon.feature.name}
                        </option>
                    ))}
                </select>
            </label>
        </SectionCard>
    )
}
