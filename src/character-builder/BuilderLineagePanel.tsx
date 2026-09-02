import { useEffect, useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import {
    applyChoiceLimit,
    isSavesMigrated,
    isSkillsMigrated,
    isToolsMigrated,
} from '../lib/proficiencies'
import type {
    AbilityName,
    Character,
    Feature,
    Lineage,
    Nation,
    SkillName,
} from '../types/schema'

const LAY_OF_THE_LAND_FEATURE_ID = 'lineage-earth-kingdom-lay-of-the-land'

const FAVORED_TERRAINS = [
    'Arctic',
    'Forest',
    'Swamp',
    'Desert',
    'Savannah',
    'Hills',
    'Mountains',
    'Underground',
    'Volcanic',
] as const

function getMaxFavoredTerrains(level: number): number {
    if (level < 1) return 0
    if (level < 6) return 1
    if (level < 10) return 2
    return 3
}

type BuilderLineagePanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    nations: Nation[]
    filteredLineages: Lineage[]
    handleNationChange: (nation: Character['nation']) => void
    editableFeatures: Feature[]
}

function formatAbilityLabel(ability: AbilityName) {
    return ability.charAt(0).toUpperCase() + ability.slice(1)
}

export function BuilderLineagePanel({
    character,
    setCharacter,
    nations,
    filteredLineages,
    handleNationChange,
    editableFeatures,
}: BuilderLineagePanelProps) {
    const selectedLineage = useMemo(() => {
        return (
            filteredLineages.find((lineage) => lineage.id === character.lineageId) ??
            null
        )
    }, [filteredLineages, character.lineageId])

    const savingThrowChoiceSet = selectedLineage?.savingThrowChoices
    const skillChoiceSet = selectedLineage?.skillChoices

    const hasSavingThrowChoices =
        savingThrowChoiceSet !== undefined &&
        savingThrowChoiceSet.choose > 0 &&
        savingThrowChoiceSet.options.length > 0

    const hasSkillChoices =
        skillChoiceSet !== undefined &&
        skillChoiceSet.choose > 0 &&
        skillChoiceSet.options.length > 0

    const savingThrowChoiceCap = savingThrowChoiceSet?.choose ?? 0
    const savingThrowChoiceOptions = savingThrowChoiceSet?.options ?? []
    const skillChoiceCap = skillChoiceSet?.choose ?? 0
    const skillChoiceOptions = skillChoiceSet?.options ?? []

    const selectedLineageSaveChoices = applyChoiceLimit(
        character.lineageSavingThrowChoices,
        savingThrowChoiceSet,
    )

    const selectedLineageSkillChoices = applyChoiceLimit(
        character.lineageSkillChoices,
        skillChoiceSet,
    )

    const lineageSavingThrows = selectedLineage?.savingThrows ?? []
    const lineageLanguages = selectedLineage?.languageProficiencies ?? []

    const lineageFeatures = useMemo(() => {
        if (!selectedLineage?.featureIds) {
            return []
        }

        return selectedLineage.featureIds
            .map((featureId) => editableFeatures.find((item) => item.id === featureId))
            .filter((feature): feature is Feature => Boolean(feature))
    }, [selectedLineage, editableFeatures])

    const hasLayOfTheLand = useMemo(
        () => selectedLineage?.featureIds?.includes(LAY_OF_THE_LAND_FEATURE_ID) ?? false,
        [selectedLineage],
    )

    const maxFavoredTerrains = getMaxFavoredTerrains(character.level)

    const selectedFavoredTerrains = useMemo(() => {
        const cap = getMaxFavoredTerrains(character.level)
        const result: string[] = []
        for (const terrain of character.lineageFavoredTerrains ?? []) {
            if (FAVORED_TERRAINS.includes(terrain as typeof FAVORED_TERRAINS[number]) && !result.includes(terrain)) {
                result.push(terrain)
            }
            if (result.length >= cap) break
        }
        return result
    }, [character.lineageFavoredTerrains, character.level])

    useEffect(() => {
        if (!hasLayOfTheLand) return
        const sanitized = selectedFavoredTerrains
        const stored = character.lineageFavoredTerrains
        if (stored === undefined && sanitized.length === 0) return
        const same = stored !== undefined && stored.length === sanitized.length && stored.every((v, i) => v === sanitized[i])
        if (same) return
        setCharacter((current) => ({
            ...current,
            lineageFavoredTerrains: sanitized,
        }))
    }, [hasLayOfTheLand, selectedFavoredTerrains, character.lineageFavoredTerrains, setCharacter])

    const savesCaption = isSavesMigrated(character)
        ? 'These selections are included in your current saving throw proficiencies.'
        : 'Lineage choices are recorded here. Saving throw proficiency integration begins after you make a manual saving throw selection.'

    const skillsCaption = isSkillsMigrated(character)
        ? 'These selections are included in your current skill proficiencies.'
        : 'Lineage choices are recorded here. Skill proficiency integration begins after you make a manual skill selection.'

    const handleLineageChange = (lineageId: string) => {
        setCharacter((current) => ({
            ...current,
            lineageId,
            lineageSavingThrowChoices: [],
            lineageSkillChoices: [],
            lineageToolChoices: [],
            lineageFavoredTerrains: [],
        }))
    }

    const toggleLineageSavingThrowChoice = (ability: AbilityName) => {
        const choiceSet = selectedLineage?.savingThrowChoices

        if (!choiceSet) {
            return
        }

        setCharacter((current) => {
            const currentSelections = applyChoiceLimit(
                current.lineageSavingThrowChoices,
                choiceSet,
            )

            if (currentSelections.includes(ability)) {
                return {
                    ...current,
                    lineageSavingThrowChoices: (current.lineageSavingThrowChoices ?? []).filter(
                        (item) => item !== ability,
                    ),
                }
            }

            if (currentSelections.length >= choiceSet.choose) {
                return current
            }

            return {
                ...current,
                lineageSavingThrowChoices: [
                    ...(current.lineageSavingThrowChoices ?? []),
                    ability,
                ],
            }
        })
    }

    const toggleLineageSkillChoice = (skill: SkillName) => {
        const choiceSet = selectedLineage?.skillChoices

        if (!choiceSet) {
            return
        }

        setCharacter((current) => {
            const currentSelections = applyChoiceLimit(
                current.lineageSkillChoices,
                choiceSet,
            )

            if (currentSelections.includes(skill)) {
                return {
                    ...current,
                    lineageSkillChoices: (current.lineageSkillChoices ?? []).filter(
                        (item) => item !== skill,
                    ),
                }
            }

            if (currentSelections.length >= choiceSet.choose) {
                return current
            }

            return {
                ...current,
                lineageSkillChoices: [...(current.lineageSkillChoices ?? []), skill],
            }
        })
    }

    const toolChoiceSet = selectedLineage?.toolChoices

    const hasToolChoices =
        toolChoiceSet !== undefined &&
        toolChoiceSet.choose > 0 &&
        toolChoiceSet.options.length > 0

    const toolChoiceCap = toolChoiceSet?.choose ?? 0
    const toolChoiceOptions = toolChoiceSet?.options ?? []

    const selectedLineageToolChoices = applyChoiceLimit(
        character.lineageToolChoices,
        toolChoiceSet,
    )

    const toolsCaption = isToolsMigrated(character)
        ? 'These selections are included in your current tool proficiencies.'
        : 'Lineage tool choices are recorded here. Tool proficiency integration begins after you edit tools in the Proficiencies panel.'

    const toggleLineageToolChoice = (tool: string) => {
        const choiceSet = selectedLineage?.toolChoices

        if (!choiceSet) {
            return
        }

        setCharacter((current) => {
            const currentSelections = applyChoiceLimit(
                current.lineageToolChoices,
                choiceSet,
            )

            if (currentSelections.includes(tool)) {
                return {
                    ...current,
                    lineageToolChoices: (current.lineageToolChoices ?? []).filter(
                        (item) => item !== tool,
                    ),
                }
            }

            if (currentSelections.length >= choiceSet.choose) {
                return current
            }

            return {
                ...current,
                lineageToolChoices: [...(current.lineageToolChoices ?? []), tool],
            }
        })
    }

    const toggleFavoredTerrain = (terrain: string) => {
        if (!FAVORED_TERRAINS.includes(terrain as typeof FAVORED_TERRAINS[number])) return

        setCharacter((current) => {
            const currentSelections = (current.lineageFavoredTerrains ?? []).filter((t) =>
                FAVORED_TERRAINS.includes(t as typeof FAVORED_TERRAINS[number]),
            )

            if (currentSelections.includes(terrain)) {
                return {
                    ...current,
                    lineageFavoredTerrains: currentSelections.filter((t) => t !== terrain),
                }
            }

            if (currentSelections.length >= getMaxFavoredTerrains(current.level)) {
                return current
            }

            return {
                ...current,
                lineageFavoredTerrains: [...currentSelections, terrain],
            }
        })
    }

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
                        onChange={(event) => handleLineageChange(event.target.value)}
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

            {(lineageSavingThrows.length > 0 || hasSavingThrowChoices) && (
                <SectionCard title="Lineage Saving Throws">
                    {lineageSavingThrows.length > 0 && (
                        <p>
                            <strong>Lineage-granted saving throws:</strong>{' '}
                            {lineageSavingThrows.map(formatAbilityLabel).join(', ')}
                        </p>
                    )}

                    {hasSavingThrowChoices && (
                        <>
                            <p>
                                Choose {savingThrowChoiceCap} saving throw option
                                {savingThrowChoiceCap === 1 ? '' : 's'}:
                            </p>
                            <p>
                                Selected: {selectedLineageSaveChoices.length} /{' '}
                                {savingThrowChoiceCap}
                            </p>
                            <p>
                                <small>{savesCaption}</small>
                            </p>
                            <div className="checkbox-list">
                                {savingThrowChoiceOptions.map((ability) => {
                                    const isChecked =
                                        selectedLineageSaveChoices.includes(ability)
                                    const disableUnchecked =
                                        !isChecked &&
                                        selectedLineageSaveChoices.length >=
                                            savingThrowChoiceCap

                                    return (
                                        <label key={ability} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                disabled={disableUnchecked}
                                                onChange={() =>
                                                    toggleLineageSavingThrowChoice(ability)
                                                }
                                            />
                                            <span>{formatAbilityLabel(ability)}</span>
                                        </label>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </SectionCard>
            )}

            {hasSkillChoices && (
                <SectionCard title="Lineage Skill Choices">
                    <p>
                        Choose {skillChoiceCap} skill option
                        {skillChoiceCap === 1 ? '' : 's'}:
                    </p>
                    <p>
                        Selected: {selectedLineageSkillChoices.length} / {skillChoiceCap}
                    </p>
                    <p>
                        <small>{skillsCaption}</small>
                    </p>
                    <div className="checkbox-list">
                        {skillChoiceOptions.map((skill) => {
                            const isChecked = selectedLineageSkillChoices.includes(skill)
                            const disableUnchecked =
                                !isChecked &&
                                selectedLineageSkillChoices.length >= skillChoiceCap

                            return (
                                <label key={skill} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={disableUnchecked}
                                        onChange={() => toggleLineageSkillChoice(skill)}
                                    />
                                    <span>{skill}</span>
                                </label>
                            )
                        })}
                    </div>
                </SectionCard>
            )}

            {hasToolChoices && (
                <SectionCard title="Lineage Tool Choices">
                    <p>
                        Choose {toolChoiceCap} tool option
                        {toolChoiceCap === 1 ? '' : 's'}:
                    </p>
                    <p>
                        Selected: {selectedLineageToolChoices.length} / {toolChoiceCap}
                    </p>
                    <p>
                        <small>{toolsCaption}</small>
                    </p>
                    <div className="checkbox-list">
                        {toolChoiceOptions.map((tool) => {
                            const isChecked = selectedLineageToolChoices.includes(tool)
                            const disableUnchecked =
                                !isChecked &&
                                selectedLineageToolChoices.length >= toolChoiceCap

                            return (
                                <label key={tool} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={disableUnchecked}
                                        onChange={() => toggleLineageToolChoice(tool)}
                                    />
                                    <span>{tool}</span>
                                </label>
                            )
                        })}
                    </div>
                </SectionCard>
            )}

            {(lineageLanguages.length > 0 || lineageFeatures.length > 0) && (
                <SectionCard title="Lineage Details">
                    {lineageLanguages.length > 0 && (
                        <p>
                            <strong>Languages granted:</strong>{' '}
                            {lineageLanguages.join(', ')}
                        </p>
                    )}

                    {lineageFeatures.length > 0 && (
                        <>
                            <p><strong>Lineage Features</strong></p>
                            <ul className="stats">
                                {lineageFeatures.map((feature) => (
                                    <li key={feature.id}>
                                        <strong>{feature.name}</strong> — {feature.featureType}
                                        <br />
                                        <small>{feature.description}</small>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </SectionCard>
            )}

            {hasLayOfTheLand && (
                <SectionCard title="Favored Terrain">
                    {maxFavoredTerrains < 1 ? (
                        <p>Favored terrain selections unlock at level 1.</p>
                    ) : (
                        <>
                            <p>
                                Choose {maxFavoredTerrains} favored terrain
                                {maxFavoredTerrains === 1 ? '' : 's'}:
                            </p>
                            <p>
                                Selected: {selectedFavoredTerrains.length} / {maxFavoredTerrains}
                            </p>
                            <div className="checkbox-list">
                                {FAVORED_TERRAINS.map((terrain) => {
                                    const isChecked = selectedFavoredTerrains.includes(terrain)
                                    const disableUnchecked =
                                        !isChecked &&
                                        selectedFavoredTerrains.length >= maxFavoredTerrains

                                    return (
                                        <label key={terrain} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                disabled={disableUnchecked}
                                                onChange={() => toggleFavoredTerrain(terrain)}
                                            />
                                            <span>{terrain}</span>
                                        </label>
                                    )
                                })}
                            </div>
                            <p>
                                <small>
                                    Lay of the Land records your favored terrains here. Travel,
                                    foraging, and check benefits are not automated.
                                </small>
                            </p>
                        </>
                    )}
                </SectionCard>
            )}
        </div>
    )
}