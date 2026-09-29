import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { ABILITIES, SKILLS } from '../engine/abilities'
import type { AbilityName, Character, SkillName, Species } from '../types/schema'

const LABELS: Record<AbilityName, string> = {
    strength: 'Strength',
    dexterity: 'Dexterity',
    constitution: 'Constitution',
    intelligence: 'Intelligence',
    wisdom: 'Wisdom',
    charisma: 'Charisma',
}

const OPTIONS: Array<{ id: Species; label: string; help: string }> = [
    { id: 'human', label: 'Human', help: 'Your ability scores each increase by 1.' },
    {
        id: 'variant-human',
        label: 'Variant Human',
        help: 'Two different ability scores of your choice increase by 1, you gain one skill of your choice, and one Feat (add it on the Features tab).',
    },
    { id: 'none', label: 'Scores are final', help: 'No species bonus. The scores you type are the scores used (older characters, and NPCs).' },
]

interface Props {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
}

/** gmbinder's Species step. Increases stop at 20. */
export function SpeciesCard({ character, setCharacter }: Props) {
    const choose = (species: Species) =>
        setCharacter((current) => ({
            ...current,
            species,
            speciesAbilityChoices: species === 'variant-human' ? current.speciesAbilityChoices : [],
            speciesSkill: species === 'variant-human' ? current.speciesSkill : null,
        }))

    const setChoice = (index: 0 | 1, value: AbilityName | '') =>
        setCharacter((current) => {
            const next: AbilityName[] = [current.speciesAbilityChoices[0], current.speciesAbilityChoices[1]].filter(
                (item): item is AbilityName => Boolean(item),
            )
            const slots: Array<AbilityName | undefined> = [next[0], next[1]]
            slots[index] = value === '' ? undefined : value
            return { ...current, speciesAbilityChoices: slots.filter((item): item is AbilityName => Boolean(item)) }
        })

    const first = character.speciesAbilityChoices[0] ?? ''
    const second = character.speciesAbilityChoices[1] ?? ''

    return (
        <SectionCard title="Species">
            <div className="choice-list" role="radiogroup" aria-label="Species">
                {OPTIONS.map((option) => (
                    <label key={option.id} className="inline-check">
                        <input type="radio" name="species" checked={character.species === option.id} onChange={() => choose(option.id)} />
                        <span>
                            <strong>{option.label}</strong> <small className="muted">{option.help}</small>
                        </span>
                    </label>
                ))}
            </div>

            {character.species === 'variant-human' && (
                <div className="two-col">
                    {([0, 1] as const).map((index) => {
                        const other = index === 0 ? second : first
                        return (
                            <label key={index}>
                                +1 to ability {index + 1}
                                <select value={index === 0 ? first : second} onChange={(event) => setChoice(index, event.target.value as AbilityName | '')}>
                                    <option value="">Choose…</option>
                                    {ABILITIES.filter((ability) => ability !== other).map((ability) => (
                                        <option key={ability} value={ability}>
                                            {LABELS[ability]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )
                    })}
                    <label>
                        Skill
                        <select
                            value={character.speciesSkill ?? ''}
                            onChange={(event) => setCharacter((current) => ({ ...current, speciesSkill: (event.target.value || null) as SkillName | null }))}
                        >
                            <option value="">Choose…</option>
                            {SKILLS.map((skill) => (
                                <option key={skill} value={skill}>
                                    {skill}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}
        </SectionCard>
    )
}
