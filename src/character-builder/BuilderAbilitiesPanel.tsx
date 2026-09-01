import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import type { Character } from '../types/schema'

type AbilityKey = keyof Pick<
    Character,
    'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'
>

type BuilderAbilitiesPanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
}

const abilityFields: Array<{
    key: AbilityKey
    label: string
    shortLabel: string
    description: string
}> = [
        {
            key: 'strength',
            label: 'Strength',
            shortLabel: 'STR',
            description: 'Physical power, lifting, shoving, and raw force.',
        },
        {
            key: 'dexterity',
            label: 'Dexterity',
            shortLabel: 'DEX',
            description: 'Agility, reflexes, balance, and precise movement.',
        },
        {
            key: 'constitution',
            label: 'Constitution',
            shortLabel: 'CON',
            description: 'Durability, endurance, stamina, and physical resilience.',
        },
        {
            key: 'intelligence',
            label: 'Intelligence',
            shortLabel: 'INT',
            description: 'Reasoning, memory, study, analysis, and technical knowledge.',
        },
        {
            key: 'wisdom',
            label: 'Wisdom',
            shortLabel: 'WIS',
            description: 'Awareness, intuition, discipline, and reading situations.',
        },
        {
            key: 'charisma',
            label: 'Charisma',
            shortLabel: 'CHA',
            description: 'Presence, force of personality, leadership, and influence.',
        },
    ]

function getAbilityModifier(score: number) {
    return Math.floor((score - 10) / 2)
}

function formatModifier(modifier: number) {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

export function BuilderAbilitiesPanel({
    character,
    setCharacter,
}: BuilderAbilitiesPanelProps) {
    const updateAbility = (key: AbilityKey, value: number) => {
        setCharacter((current) => ({
            ...current,
            [key]: Number.isNaN(value) ? 0 : value,
        }))
    }

    return (
        <div className="grid">
            <SectionCard title="Ability Scores">
                <p>
                    Set the six core ability scores for the character. These scores
                    drive modifiers used by saving throws, skills, and other derived
                    systems.
                </p>

                <div className="ability-grid">
                    {abilityFields.map(({ key, label, shortLabel, description }) => {
                        const score = Number(character[key] ?? 0)
                        const modifier = getAbilityModifier(score)

                        return (
                            <div key={key} className="ability-card">
                                <p className="ability-short-label">{shortLabel}</p>

                                <label>
                                    {label}
                                    <input
                                        type="number"
                                        min={1}
                                        max={30}
                                        value={score}
                                        onChange={(event) =>
                                            updateAbility(key, event.target.valueAsNumber)
                                        }
                                    />
                                </label>

                                <p className="ability-modifier">
                                    Modifier: <strong>{formatModifier(modifier)}</strong>
                                </p>

                                <p>{description}</p>
                            </div>
                        )
                    })}
                </div>
            </SectionCard>

            <SectionCard title="Ability Summary">
                <ul className="stats">
                    {abilityFields.map(({ key, label }) => {
                        const score = Number(character[key] ?? 0)
                        const modifier = getAbilityModifier(score)

                        return (
                            <li key={key}>
                                <strong>{label}</strong> — {score} ({formatModifier(modifier)})
                            </li>
                        )
                    })}
                </ul>
            </SectionCard>
        </div>
    )
}