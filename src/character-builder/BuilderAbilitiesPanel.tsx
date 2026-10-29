import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { ABILITIES, ABILITY_NAMES, formatModifier, getAbilityModifier } from '../engine/abilities'
import { abilityScoresOf, baseScoresOf, speciesBonuses } from '../engine/abilityScores'
import type { AbilityName, Character } from '../types/schema'
import { AbilityMethods } from './AbilityMethods'
import { SpeciesCard } from './SpeciesCard'

type BuilderAbilitiesPanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
}

const DESCRIPTIONS: Record<AbilityName, string> = {
    strength: 'Physical power, lifting, shoving, and raw force.',
    dexterity: 'Agility, reflexes, balance, and precise movement.',
    constitution: 'Durability, endurance, stamina, and physical resilience.',
    intelligence: 'Reasoning, memory, study, analysis, and technical knowledge.',
    wisdom: 'Awareness, intuition, discipline, and reading situations.',
    charisma: 'Presence, force of personality, leadership, and influence.',
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
                            <strong>{ABILITY_NAMES[ability]}</strong> — {total[ability]} ({formatModifier(getAbilityModifier(total[ability]))})
                            {bonus[ability] > 0 && (
                                <small className="muted">
                                    {' '}
                                    {base[ability]} + {total[ability] - base[ability]} from your species
                                </small>
                            )}
                            <br />
                            <small className="muted">{DESCRIPTIONS[ability]}</small>
                        </li>
                    ))}
                </ul>
            </SectionCard>
        </div>
    )
}
