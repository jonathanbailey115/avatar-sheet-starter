import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import {
    isLanguagesMigrated,
    isSavesMigrated,
    isSkillsMigrated,
    isToolsMigrated,
    migrateLanguagesOnEdit,
    migrateSavingThrowsOnToggle,
    migrateSkillsOnToggle,
    migrateToolsOnEdit,
    resolveGrantedSavingThrows,
    resolveGrantedSkills,
    resolveProficiencyContext,
    toggleMember,
} from '../lib/proficiencies'
import type {
    AbilityName,
    Background,
    Character,
    CharacterClass,
    Lineage,
    SkillName,
} from '../types/schema'

type BuilderProficienciesPanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    editableClasses: CharacterClass[]
    editableLineages: Lineage[]
    editableBackgrounds: Background[]
}

const savingThrowOptions: Array<{ key: AbilityName; label: string }> = [
    { key: 'strength', label: 'Strength' },
    { key: 'dexterity', label: 'Dexterity' },
    { key: 'constitution', label: 'Constitution' },
    { key: 'intelligence', label: 'Intelligence' },
    { key: 'wisdom', label: 'Wisdom' },
    { key: 'charisma', label: 'Charisma' },
]

const skillAbilityMap: Record<SkillName, AbilityName> = {
    Acrobatics: 'dexterity',
    'Animal Handling': 'wisdom',
    Arcana: 'intelligence',
    Athletics: 'strength',
    Deception: 'charisma',
    History: 'intelligence',
    Insight: 'wisdom',
    Intimidation: 'charisma',
    Investigation: 'intelligence',
    Medicine: 'wisdom',
    Nature: 'intelligence',
    Perception: 'wisdom',
    Performance: 'charisma',
    Persuasion: 'charisma',
    Religion: 'intelligence',
    'Sleight of Hand': 'dexterity',
    Stealth: 'dexterity',
    Survival: 'wisdom',
}

const skillOptions: SkillName[] = [
    'Acrobatics',
    'Animal Handling',
    'Arcana',
    'Athletics',
    'Deception',
    'History',
    'Insight',
    'Intimidation',
    'Investigation',
    'Medicine',
    'Nature',
    'Perception',
    'Performance',
    'Persuasion',
    'Religion',
    'Sleight of Hand',
    'Stealth',
    'Survival',
]

function getProficiencyBonus(level: number) {
    if (level >= 17) return 6
    if (level >= 13) return 5
    if (level >= 9) return 4
    if (level >= 5) return 3
    return 2
}

function getAbilityModifier(score: number) {
    return Math.floor((score - 10) / 2)
}

function formatModifier(modifier: number) {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function formatAbilityName(ability: AbilityName) {
    return ability.charAt(0).toUpperCase() + ability.slice(1)
}

export function BuilderProficienciesPanel({
    character,
    setCharacter,
    editableClasses,
    editableLineages,
    editableBackgrounds,
}: BuilderProficienciesPanelProps) {
    const proficiencyBonus = getProficiencyBonus(character.level)

    const toggleSavingThrow = (ability: AbilityName) => {
        setCharacter((current) => {
            const ctx = resolveProficiencyContext(
                current,
                editableClasses,
                editableLineages,
                editableBackgrounds,
            )

            if (!isSavesMigrated(current)) {
                return {
                    ...current,
                    manualSavingThrows: migrateSavingThrowsOnToggle(current, ctx, ability),
                }
            }

            const manualSaves = current.manualSavingThrows ?? []
            const grantedSaves = resolveGrantedSavingThrows(current, ctx)

            if (!manualSaves.includes(ability) && grantedSaves.includes(ability)) {
                return current
            }

            return {
                ...current,
                manualSavingThrows: toggleMember(manualSaves, ability),
            }
        })
    }

    const toggleSkill = (skill: SkillName) => {
        setCharacter((current) => {
            const ctx = resolveProficiencyContext(
                current,
                editableClasses,
                editableLineages,
                editableBackgrounds,
            )

            if (!isSkillsMigrated(current)) {
                return {
                    ...current,
                    manualSkills: migrateSkillsOnToggle(current, ctx, skill),
                }
            }

            const manualSkillPicks = current.manualSkills ?? []
            const grantedSkillPicks = resolveGrantedSkills(current, ctx)

            if (!manualSkillPicks.includes(skill) && grantedSkillPicks.includes(skill)) {
                return current
            }

            return {
                ...current,
                manualSkills: toggleMember(manualSkillPicks, skill),
            }
        })
    }

    const updateTools = (value: string) => {
        setCharacter((current) => {
            const ctx = resolveProficiencyContext(
                current,
                editableClasses,
                editableLineages,
                editableBackgrounds,
            )

            return {
                ...current,
                manualTools: migrateToolsOnEdit(current, ctx, value),
            }
        })
    }

    const updateLanguages = (value: string) => {
        setCharacter((current) => {
            const ctx = resolveProficiencyContext(
                current,
                editableClasses,
                editableLineages,
                editableBackgrounds,
            )

            return {
                ...current,
                manualLanguages: migrateLanguagesOnEdit(current, ctx, value),
            }
        })
    }

    const getSaveTotal = (ability: AbilityName) => {
        const score = Number(character[ability] ?? 0)
        const modifier = getAbilityModifier(score)
        const proficient = character.savingThrowProficiencies.includes(ability)

        return modifier + (proficient ? proficiencyBonus : 0)
    }

    const getSkillTotal = (skill: SkillName) => {
        const ability = skillAbilityMap[skill]
        const score = Number(character[ability] ?? 0)
        const modifier = getAbilityModifier(score)
        const proficient = character.skillProficiencies.includes(skill)

        return modifier + (proficient ? proficiencyBonus : 0)
    }

    const passivePerception = 10 + getSkillTotal('Perception')
    const passiveInvestigation = 10 + getSkillTotal('Investigation')
    const passiveInsight = 10 + getSkillTotal('Insight')

    return (
        <div className="grid">
            <SectionCard title="Proficiency Overview">
                <div className="two-col">
                    <div>
                        <p><strong>Proficiency Bonus</strong></p>
                        <p>+{proficiencyBonus}</p>
                    </div>

                    <div>
                        <p><strong>Level</strong></p>
                        <p>{character.level}</p>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Saving Throws">
                <div className="checkbox-list">
                    {savingThrowOptions.map((option) => {
                        const score = Number(character[option.key] ?? 0)
                        const baseModifier = getAbilityModifier(score)
                        const isProficient =
                            character.savingThrowProficiencies.includes(option.key)
                        const total = getSaveTotal(option.key)

                        return (
                            <label key={option.key} className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={isProficient}
                                    onChange={() => toggleSavingThrow(option.key)}
                                />
                                <span>
                                    <strong>{option.label}</strong> — {formatModifier(total)}
                                    <br />
                                    <small>
                                        Base {formatModifier(baseModifier)}
                                        {isProficient ? ` + proficiency (+${proficiencyBonus})` : ''}
                                    </small>
                                </span>
                            </label>
                        )
                    })}
                </div>
            </SectionCard>

            <SectionCard title="Skills">
                <div className="checkbox-list">
                    {skillOptions.map((skill) => {
                        const ability = skillAbilityMap[skill]
                        const score = Number(character[ability] ?? 0)
                        const baseModifier = getAbilityModifier(score)
                        const isProficient = character.skillProficiencies.includes(skill)
                        const total = getSkillTotal(skill)

                        return (
                            <label key={skill} className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={isProficient}
                                    onChange={() => toggleSkill(skill)}
                                />
                                <span>
                                    <strong>{skill}</strong> — {formatModifier(total)}
                                    <br />
                                    <small>
                                        {formatAbilityName(ability)} · Base {formatModifier(baseModifier)}
                                        {isProficient ? ` + proficiency (+${proficiencyBonus})` : ''}
                                    </small>
                                </span>
                            </label>
                        )
                    })}
                </div>
            </SectionCard>

            <SectionCard title="Passive Scores">
                <ul className="stats">
                    <li>
                        <strong>Passive Perception</strong> — {passivePerception}
                    </li>
                    <li>
                        <strong>Passive Investigation</strong> — {passiveInvestigation}
                    </li>
                    <li>
                        <strong>Passive Insight</strong> — {passiveInsight}
                    </li>
                </ul>
            </SectionCard>

            <SectionCard title="Tools and Languages">
                <div className="proficiency-section">
                    <label>
                        Tools
                        <textarea
                            rows={3}
                            value={character.toolProficiencies.join(', ')}
                            onChange={(event) => updateTools(event.target.value)}
                            placeholder="Herbalism kit, calligrapher's tools, navigator's tools"
                        />
                    </label>
                    {isToolsMigrated(character) && (
                        <p>
                            <small>
                                Background and lineage grants are included automatically.
                                Removing a granted entry here does not remove the grant;
                                change its source to remove it.
                            </small>
                        </p>
                    )}
                </div>

                <div className="proficiency-section">
                    <label>
                        Languages
                        <textarea
                            rows={3}
                            value={character.languages.join(', ')}
                            onChange={(event) => updateLanguages(event.target.value)}
                            placeholder="Common, Primordial, Fire Nation dialect"
                        />
                    </label>
                    {isLanguagesMigrated(character) && (
                        <p>
                            <small>
                                Background and lineage grants are included automatically.
                                Removing a granted entry here does not remove the grant;
                                change its source to remove it.
                            </small>
                        </p>
                    )}
                </div>
            </SectionCard>
        </div>
    )
}