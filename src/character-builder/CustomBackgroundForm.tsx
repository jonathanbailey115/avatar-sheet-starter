import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { SKILLS } from '../engine/abilities'
import { blankCustomBackground } from '../lib/customBackground'
import { parseListInput } from '../lib/proficiencies'
import type { Character, CustomBackground, SkillName } from '../types/schema'

type CustomBackgroundFormProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
}

/** Build your own background: a name, two skills, tools, and one feature (D&D Beyond style). */
export function CustomBackgroundForm({ character, setCharacter }: CustomBackgroundFormProps) {
    const custom = character.customBackground ?? blankCustomBackground()

    const update = (changes: Partial<CustomBackground>) =>
        setCharacter((current) => ({
            ...current,
            customBackground: { ...(current.customBackground ?? blankCustomBackground()), ...changes },
        }))

    const toggleSkill = (skill: SkillName) => {
        const has = custom.skillProficiencies.includes(skill)
        if (has) update({ skillProficiencies: custom.skillProficiencies.filter((item) => item !== skill) })
        else if (custom.skillProficiencies.length < 2) update({ skillProficiencies: [...custom.skillProficiencies, skill] })
    }

    return (
        <SectionCard title="Custom Background">
            <label>
                Name
                <input value={custom.name} onChange={(event) => update({ name: event.target.value })} />
            </label>

            <label>
                Description
                <textarea
                    rows={3}
                    value={custom.description}
                    onChange={(event) => update({ description: event.target.value })}
                />
            </label>

            <fieldset className="skill-picker">
                <legend>Skill proficiencies (choose 2)</legend>
                <div className="checkbox-list">
                    {SKILLS.map((skill) => {
                        const checked = custom.skillProficiencies.includes(skill)
                        return (
                            <label key={skill} className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={!checked && custom.skillProficiencies.length >= 2}
                                    onChange={() => toggleSkill(skill)}
                                />
                                <span>{skill}</span>
                            </label>
                        )
                    })}
                </div>
            </fieldset>

            <label>
                Tool proficiencies (comma separated)
                <input
                    defaultValue={custom.toolProficiencies.join(', ')}
                    onBlur={(event) => update({ toolProficiencies: parseListInput(event.target.value) })}
                    placeholder="Herbalism Kit, Navigator’s Tools"
                />
            </label>

            <label>
                Feature name
                <input value={custom.featureName} onChange={(event) => update({ featureName: event.target.value })} />
            </label>

            <label>
                Feature description
                <textarea
                    rows={3}
                    value={custom.featureText}
                    onChange={(event) => update({ featureText: event.target.value })}
                />
            </label>

            <p className="muted">
                Everyone in this world speaks Common, so a background does not grant languages.
            </p>
        </SectionCard>
    )
}
