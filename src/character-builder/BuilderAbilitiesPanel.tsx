import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { ABILITIES, formatModifier, getAbilityModifier } from '../engine/abilities'
import { abilityScoresOf, baseScoresOf, speciesBonuses } from '../engine/abilityScores'
import type { AbilityName, Character } from '../types/schema'
import { AbilityMethods } from './AbilityMethods'
import { SpeciesCard } from './SpeciesCard'

type BuilderAbilitiesPanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
}

const DESCRIPTIONS: Record<AbilityName, { label: string; text: string }> = {
    strength: { label: 'Strength', text: 'Physical power, lifting, shoving, and raw force.' },
    dexterity: { label: 'Dexterity', text: 'Agility, reflexes, balance, and precise movement.' },
    constitution: { label: 'Constitution', text: 'Durability, endurance, stamina, and physical resilience.' },
    intelligence: { label: 'Intelligence', text: 'Reasoning, memory, study, analysis, and technical knowledge.' },
    wisdom: { label: 'Wisdom', text: 'Awareness, intuition, discipline, and reading situations.' },
    charisma: { label: 'Charisma', text: 'Presence, force of personality, leadership, and influence.' },
}

export function BuilderAbilitiesPanel({ character, setCharacter }: BuilderAbilitiesPanelProps) {
    const base = baseScoresOf(character)
    const total = abilityScoresOf(character)
    const bonus = speciesBonuses(character)

    return (
        <div className="grid">
            <SpeciesCard character={character} setCharacter={setCharacter} />

            <SectionCard title="Ability scores">
                <p>
                    Set the six ability scores before your species bonus. These drive modifiers for saving throws, skills, hit points and
                    your bending.
                </p>
                <AbilityMethods character={character} setCharacter={setCharacter} />
            </SectionCard>

            <SectionCard title="Ability summary">
                <ul className="stats">
                    {ABILITIES.map((ability) => (
                        <li key={ability}>
                            <strong>{DESCRIPTIONS[ability].label}</strong> — {total[ability]} ({formatModifier(getAbilityModifier(total[ability]))})
                            {bonus[ability] > 0 && (
                                <small className="muted">
                                    {' '}
                                    {base[ability]} + {total[ability] - base[ability]} from your species
                                </small>
                            )}
                            <br />
                            <small className="muted">{DESCRIPTIONS[ability].text}</small>
                        </li>
                    ))}
                </ul>
            </SectionCard>
        </div>
    )
}
