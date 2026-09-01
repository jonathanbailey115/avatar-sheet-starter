import { useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import type {
    Character,
    CharacterClass,
    CharacterSubclass,
    Feature,
    SkillName,
} from '../types/schema'

type BuilderClassPanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    editableClasses: CharacterClass[]
    editableSubclasses: CharacterSubclass[]
    editableFeatures: Feature[]
}

export function BuilderClassPanel({
    character,
    setCharacter,
    editableClasses,
    editableSubclasses,
    editableFeatures,
}: BuilderClassPanelProps) {
    const selectedClass =
        editableClasses.find((item) => item.id === character.classId) ?? null

    const availableSubclasses = useMemo(() => {
        if (!selectedClass) return []

        return editableSubclasses.filter(
            (subclass) => subclass.classId === selectedClass.id,
        )
    }, [selectedClass, editableSubclasses])

    const selectedSubclass =
        availableSubclasses.find((item) => item.id === character.subclassId) ?? null

    const nextSubclassUnlockLevel =
        availableSubclasses.length > 0
            ? Math.min(...availableSubclasses.map((item) => item.unlockLevel))
            : null

    const subclassUnlocked =
        nextSubclassUnlockLevel != null
            ? character.level >= nextSubclassUnlockLevel
            : false

    const activeFeatureGrants = useMemo(() => {
        if (!selectedClass) return []

        const classGrants = selectedClass.featureGrants
        const subclassGrants = selectedSubclass?.featureGrants ?? []

        return [...classGrants, ...subclassGrants]
    }, [selectedClass, selectedSubclass])

    const unlockedFeatureGrants = useMemo(() => {
        return activeFeatureGrants.filter((grant) => grant.level <= character.level)
    }, [activeFeatureGrants, character.level])

    const futureFeatureGrants = useMemo(() => {
        return activeFeatureGrants.filter((grant) => grant.level > character.level)
    }, [activeFeatureGrants, character.level])

    const unlockedFeatures = unlockedFeatureGrants
        .map((grant) => {
            const feature = editableFeatures.find((item) => item.id === grant.featureId)
            return feature ? { ...feature, grantedLevel: grant.level } : null
        })
        .filter(
            (feature): feature is Feature & { grantedLevel: number } => feature !== null,
        )

    const futureFeatures = futureFeatureGrants
        .map((grant) => {
            const feature = editableFeatures.find((item) => item.id === grant.featureId)
            return feature ? { ...feature, grantedLevel: grant.level } : null
        })
        .filter(
            (feature): feature is Feature & { grantedLevel: number } => feature !== null,
        )

    const classSkillSelections = useMemo(() => {
        if (!selectedClass) return []

        return character.classSkillChoices.filter((skill) =>
            selectedClass.skillChoices.options.includes(skill),
        )
    }, [selectedClass, character.classSkillChoices])

    const toggleClassSkill = (skill: SkillName) => {
        if (!selectedClass) return

        setCharacter((current) => {
            const currentSelections = current.classSkillChoices.filter((item) =>
                selectedClass.skillChoices.options.includes(item),
            )

            const alreadySelected = currentSelections.includes(skill)

            if (alreadySelected) {
                return {
                    ...current,
                    classSkillChoices: current.classSkillChoices.filter(
                        (item) => item !== skill,
                    ),
                }
            }

            if (currentSelections.length >= selectedClass.skillChoices.choose) {
                return current
            }

            return {
                ...current,
                classSkillChoices: [...current.classSkillChoices, skill],
            }
        })
    }

    const subclassFeatureIds = useMemo(
        () =>
            new Set(
                editableSubclasses.flatMap((subclass) =>
                    subclass.featureGrants.map((grant) => grant.featureId),
                ),
            ),
        [editableSubclasses],
    )

    return (
        <div className="grid">
            <SectionCard title="Class Setup">
                <label>
                    Class
                    <select
                        value={character.classId}
                        onChange={(event) => {
                            const classId = event.target.value

                            setCharacter((current) => ({
                                ...current,
                                classId,
                                subclassId: undefined,
                                classSkillChoices: [],
                                selectedFeatureIds: current.selectedFeatureIds.filter(
                                    (featureId) => !subclassFeatureIds.has(featureId),
                                ),
                            }))
                        }}
                    >
                        <option value="">Select a class</option>
                        {editableClasses.map((characterClass) => (
                            <option key={characterClass.id} value={characterClass.id}>
                                {characterClass.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Level
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={character.level}
                        onChange={(event) =>
                            setCharacter((current) => ({
                                ...current,
                                level: Number.isNaN(event.target.valueAsNumber)
                                    ? 1
                                    : event.target.valueAsNumber,
                            }))
                        }
                    />
                </label>

                {selectedClass ? (
                    <>
                        <p><strong>{selectedClass.name}</strong></p>
                        <p>{selectedClass.description}</p>
                        <p>Hit Die: {selectedClass.hitDie}</p>
                        <p>Primary Ability: {selectedClass.primaryAbility}</p>
                        <p>
                            Class Saving Throws:{' '}
                            {selectedClass.savingThrows.join(', ')}
                        </p>
                        <p>
                            Current Character Saving Throws:{' '}
                            {character.savingThrowProficiencies.length > 0
                                ? character.savingThrowProficiencies.join(', ')
                                : 'None'}
                        </p>
                    </>
                ) : (
                    <p>Select a class to begin class progression.</p>
                )}
            </SectionCard>

            <SectionCard title="Subclass">
                {!selectedClass ? (
                    <p>Select a class first.</p>
                ) : availableSubclasses.length === 0 ? (
                    <p>No subclass options available yet for this class.</p>
                ) : !subclassUnlocked && nextSubclassUnlockLevel != null ? (
                    <p>Subclass unlocks at level {nextSubclassUnlockLevel}.</p>
                ) : (
                    <>
                        <label>
                            {selectedClass.subclassName ?? 'Subclass'}
                            <select
                                value={character.subclassId ?? ''}
                                onChange={(event) =>
                                    setCharacter((current) => ({
                                        ...current,
                                        subclassId: event.target.value || undefined,
                                    }))
                                }
                            >
                                <option value="">Select a subclass</option>
                                {availableSubclasses.map((subclass) => (
                                    <option key={subclass.id} value={subclass.id}>
                                        {subclass.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {selectedSubclass ? (
                            <>
                                <p><strong>{selectedSubclass.name}</strong></p>
                                <p>{selectedSubclass.description}</p>
                            </>
                        ) : (
                            <p>Select a subclass to continue progression.</p>
                        )}
                    </>
                )}
            </SectionCard>

            <SectionCard title="Class Skill Choices">
                {!selectedClass ? (
                    <p>Select a class to choose class skills.</p>
                ) : (
                    <>
                        <p>
                            Choose {selectedClass.skillChoices.choose} skill
                            {selectedClass.skillChoices.choose === 1 ? '' : 's'}:
                        </p>
                        <p>
                            Selected: {classSkillSelections.length} /{' '}
                            {selectedClass.skillChoices.choose}
                        </p>

                        <div className="checkbox-list">
                            {selectedClass.skillChoices.options.map((skill) => {
                                const isChecked = classSkillSelections.includes(skill)
                                const disableUnchecked =
                                    !isChecked &&
                                    classSkillSelections.length >=
                                    selectedClass.skillChoices.choose

                                return (
                                    <label key={skill} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            disabled={disableUnchecked}
                                            onChange={() => toggleClassSkill(skill)}
                                        />
                                        <span>{skill}</span>
                                    </label>
                                )
                            })}
                        </div>
                    </>
                )}
            </SectionCard>

            <SectionCard title="Unlocked Features">
                {!selectedClass ? (
                    <p>No class selected yet.</p>
                ) : unlockedFeatures.length === 0 ? (
                    <p>No class or subclass features unlocked yet.</p>
                ) : (
                    <div className="npc-list">
                        {unlockedFeatures.map((feature) => {
                            if (!feature) return null

                            return (
                                <article key={feature.id} className="npc-item">
                                    <h3>{feature.name}</h3>
                                    <p>Level {feature.grantedLevel}</p>
                                    <p>
                                        {feature.source} · {feature.featureType}
                                    </p>
                                    <p>{feature.description}</p>
                                </article>
                            )
                        })}
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Available Later">
                {!selectedClass ? (
                    <p>No class selected yet.</p>
                ) : futureFeatures.length === 0 ? (
                    <p>No additional class or subclass features remain.</p>
                ) : (
                    <ul className="stats">
                        {futureFeatures.map((feature) => {
                            if (!feature) return null

                            return (
                                <li key={feature.id}>
                                    <strong>{feature.name}</strong> — Level{' '}
                                    {feature.grantedLevel}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </SectionCard>
        </div>
    )
}