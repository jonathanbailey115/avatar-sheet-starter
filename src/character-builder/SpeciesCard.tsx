import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { ABILITIES, ABILITY_NAMES, SKILLS } from '../engine/abilities'
import type { AbilityName, Character, SkillName, Species } from '../types/schema'

const OPTIONS: Array<{ id: Species; label: string; help: string }> = [
    { id: 'human', label: 'Human', help: 'Your ability scores each increase by 1.' },
    {
        id: 'variant-human',
        label: 'Variant Human',
        help: 'Two different ability scores of your choice increase by 1, you gain one skill of your choice, and one Feat (add it on the Features tab).',
    },
    { id: 'none', label: 'Scores are final', help: 'No species bonus. The scores you type are the scores used (older characters, and NPCs).' },
]

type Choice = AbilityName | ''
const toSlots = (choices: AbilityName[]): [Choice, Choice] => [choices[0] ?? '', choices[1] ?? '']

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

    // The two dropdowns keep fixed positions, so picking the second one first does not jump into the first.
    const [[first, second], setSlots] = useState<[Choice, Choice]>(() => toSlots(character.speciesAbilityChoices))
    const stored = character.speciesAbilityChoices.join(',')
    useEffect(() => {
        // Something else changed the choices (a species switch, an import): follow it.
        if ([first, second].filter(Boolean).join(',') !== stored) setSlots(toSlots(character.speciesAbilityChoices))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stored])

    const setChoice = (index: 0 | 1, value: Choice) => {
        const next: [Choice, Choice] = index === 0 ? [value, second] : [first, value]
        setSlots(next)
        setCharacter((current) => ({ ...current, speciesAbilityChoices: next.filter((item): item is AbilityName => item !== '') }))
    }

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
                                <select value={index === 0 ? first : second} onChange={(event) => setChoice(index, event.target.value as Choice)}>
                                    <option value="">Choose…</option>
                                    {ABILITIES.filter((ability) => ability !== other).map((ability) => (
                                        <option key={ability} value={ability}>
                                            {ABILITY_NAMES[ability]}
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
