import { fitLevels, primaryLevelOf } from '../engine/classLevels'
import { ClassPicker } from './ClassPicker'
import { MulticlassCard } from './MulticlassCard'
import { useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { ClassNotices } from './ClassNotices'
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

    const chooseClass = (classId: string) => {
        if (classId === character.classId) return
        setCharacter((current) => ({
            ...current,
            classId,
            subclassId: undefined,
            classSkillChoices: [],
            selectedFeatureIds: current.selectedFeatureIds.filter((featureId) => !subclassFeatureIds.has(featureId)),
        }))
    }

    return (
        <div className="grid">
            <SectionCard title="Class Setup" className="class-setup">
                <ClassPicker classes={editableClasses} value={character.classId} onChoose={chooseClass} />

                <label>
                    Level
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={primaryLevelOf(character)}
                        onChange={(event) =>
                            setCharacter((current) => {
                                const wanted = Number.isNaN(event.target.valueAsNumber) ? 1 : Math.round(event.target.valueAsNumber)
                                const next = { ...current, level: Math.min(20, Math.max(1, wanted)) + (current.level - primaryLevelOf(current)) }
                                return { ...next, ...fitLevels(next) }
                            })
                        }
                    />
                </label>

                {selectedClass ? (
                    <>
                        <p className="class-description">{selectedClass.description}</p>
                        <dl className="fact-list">
                            <div>
                                <dt>Hit Die</dt>
                                <dd>{selectedClass.hitDie}</dd>
                            </div>
                            <div>
                                <dt>Primary ability</dt>
                                <dd>{selectedClass.primaryAbility}</dd>
                            </div>
                            <div>
                                <dt>Class saving throws</dt>
                                <dd>{selectedClass.savingThrows.join(', ') || 'None'}</dd>
                            </div>
                            <div>
                                <dt>Your saving throws</dt>
                                <dd>
                                    {character.savingThrowProficiencies.length > 0
                                        ? character.savingThrowProficiencies.join(', ')
                                        : 'None'}
                                </dd>
                            </div>
                        </dl>
                        <ClassNotices character={character} setCharacter={setCharacter} selectedClass={selectedClass} />
                    </>
                ) : null}
            </SectionCard>

            <MulticlassCard character={character} setCharacter={setCharacter} classes={editableClasses} subclasses={editableSubclasses} />

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
                                <article key={`${feature.id}-${feature.grantedLevel}`} className="npc-item">
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
                                <li key={`${feature.id}-${feature.grantedLevel}`}>
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