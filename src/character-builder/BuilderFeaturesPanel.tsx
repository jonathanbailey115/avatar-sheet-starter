import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import type {
    Background,
    Character,
    CharacterClass,
    CharacterSubclass,
    Feature,
} from '../types/schema'

type FeatureFilter = 'All' | Feature['featureType']

type BuilderFeaturesPanelProps = {
    character: Character
    editableClasses: CharacterClass[]
    editableSubclasses: CharacterSubclass[]
    editableBackgrounds: Background[]
    editableFeatures: Feature[]
    setCharacter: Dispatch<SetStateAction<Character>>
}

const filterOptions: FeatureFilter[] = [
    'All',
    'Passive',
    'Action',
    'Bonus Action',
    'Reaction',
    'Limited Use',
]

export function BuilderFeaturesPanel({
    character,
    editableClasses,
    editableSubclasses,
    editableBackgrounds,
    editableFeatures,
    setCharacter,
}: BuilderFeaturesPanelProps) {
    const [activeFilter, setActiveFilter] = useState<FeatureFilter>('All')
    const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
        editableFeatures[0]?.id ?? null,
    )

    const selectedClass =
        editableClasses.find((item) => item.id === character.classId) ?? null

    const selectedSubclass =
        editableSubclasses.find((item) => item.id === character.subclassId) ?? null

    const selectedBackground =
        editableBackgrounds.find((item) => item.id === character.backgroundId) ?? null

    const autoGrantedFeatureIds = useMemo(() => {
        const classFeatureIds =
            selectedClass?.featureGrants
                .filter((grant) => grant.level <= character.level)
                .map((grant) => grant.featureId) ?? []

        const subclassFeatureIds =
            selectedSubclass?.featureGrants
                .filter((grant) => grant.level <= character.level)
                .map((grant) => grant.featureId) ?? []

        const backgroundFeatureIds = selectedBackground?.featureIds ?? []

        return Array.from(
            new Set([
                ...classFeatureIds,
                ...subclassFeatureIds,
                ...backgroundFeatureIds,
            ]),
        )
    }, [selectedClass, selectedSubclass, selectedBackground, character.level])

    const autoGrantedFeatureIdSet = useMemo(
        () => new Set(autoGrantedFeatureIds),
        [autoGrantedFeatureIds],
    )

    const visibleFeatures = useMemo(() => {
        return editableFeatures.filter((feature) => {
            const passesFilter =
                activeFilter === 'All' || feature.featureType === activeFilter

            const passesLevel = feature.levelRequirement <= character.level

            return passesFilter && passesLevel
        })
    }, [activeFilter, editableFeatures, character.level])

    const selectedFeatures = useMemo(() => {
        const combinedFeatureIds = Array.from(
            new Set([...autoGrantedFeatureIds, ...character.selectedFeatureIds]),
        )

        return combinedFeatureIds
            .map((featureId) => editableFeatures.find((item) => item.id === featureId))
            .filter((feature): feature is Feature => Boolean(feature))
    }, [autoGrantedFeatureIds, character.selectedFeatureIds, editableFeatures])

    const grantedFeatures = useMemo(() => {
        return selectedFeatures.filter((feature) =>
            autoGrantedFeatureIdSet.has(feature.id),
        )
    }, [selectedFeatures, autoGrantedFeatureIds])

    const manualFeatures = useMemo(() => {
        return selectedFeatures.filter(
            (feature) => !autoGrantedFeatureIdSet.has(feature.id),
        )
    }, [selectedFeatures, autoGrantedFeatureIds])

    useEffect(() => {
        if (visibleFeatures.length === 0) {
            setSelectedFeatureId(null)
            return
        }

        const selectedStillVisible = visibleFeatures.some(
            (feature) => feature.id === selectedFeatureId,
        )

        if (!selectedStillVisible) {
            setSelectedFeatureId(visibleFeatures[0].id)
        }
    }, [selectedFeatureId, visibleFeatures])

    useEffect(() => {
        setCharacter((current) => {
            const validSelectedFeatureIds = current.selectedFeatureIds.filter((featureId) =>
                editableFeatures.some((feature) => feature.id === featureId),
            )

            if (validSelectedFeatureIds.length === current.selectedFeatureIds.length) {
                return current
            }

            return {
                ...current,
                selectedFeatureIds: validSelectedFeatureIds,
            }
        })
    }, [editableFeatures, setCharacter])

    const selectedFeature =
        visibleFeatures.find((feature) => feature.id === selectedFeatureId) ??
        editableFeatures.find((feature) => feature.id === selectedFeatureId) ??
        null

    const toggleFeature = (featureId: string) => {
        if (autoGrantedFeatureIds.includes(featureId)) {
            return
        }

        setCharacter((current) => {
            const alreadySelected = current.selectedFeatureIds.includes(featureId)

            return {
                ...current,
                selectedFeatureIds: alreadySelected
                    ? current.selectedFeatureIds.filter((id) => id !== featureId)
                    : [...current.selectedFeatureIds, featureId],
            }
        })
    }

    return (
        <div className="grid builder-features-layout">
            <SectionCard title="Feature Library">
                <div className="builder-tabs">
                    {filterOptions.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            className={activeFilter === filter ? 'active' : ''}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {visibleFeatures.length === 0 ? (
                    <p>No features available for this filter at the current level.</p>
                ) : (
                    <div className="npc-list">
                        {visibleFeatures.map((feature) => {
                            const isSelected = selectedFeatures.some(
                                (item) => item.id === feature.id,
                            )
                            const isFocused = selectedFeatureId === feature.id
                            const isGranted = autoGrantedFeatureIdSet.has(feature.id)

                            return (
                                <article
                                    key={feature.id}
                                    className={`npc-item ${isFocused ? 'is-focused' : ''}`}
                                >
                                    <div className="actions inline-actions">
                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={() => setSelectedFeatureId(feature.id)}
                                        >
                                            View
                                        </button>

                                        <button
                                            className={
                                                isSelected
                                                    ? 'secondary-button'
                                                    : 'primary-button'
                                            }
                                            type="button"
                                            onClick={() => toggleFeature(feature.id)}
                                            disabled={isGranted}
                                            title={
                                                isGranted
                                                    ? 'Granted by class, subclass, or background'
                                                    : undefined
                                            }
                                        >
                                            {isGranted
                                                ? 'Granted'
                                                : isSelected
                                                    ? 'Remove'
                                                    : 'Add'}
                                        </button>
                                    </div>

                                    <h3>{feature.name}</h3>
                                    <p>
                                        {feature.source} · {feature.featureType}
                                    </p>
                                    <p>Level {feature.levelRequirement}</p>
                                    <p>{feature.description}</p>
                                </article>
                            )
                        })}
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Selected Features">
                {selectedFeatures.length === 0 ? (
                    <p>No features selected yet.</p>
                ) : (
                    <>
                        <h3>Granted Features</h3>
                        {grantedFeatures.length === 0 ? (
                            <p>No granted features yet.</p>
                        ) : (
                            <ul className="stats">
                                {grantedFeatures.map((feature) => (
                                    <li key={feature.id}>
                                        <strong>{feature.name}</strong> — {feature.featureType}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <h3>Manual Features</h3>
                        {manualFeatures.length === 0 ? (
                            <p>No manual features selected.</p>
                        ) : (
                            <ul className="stats">
                                {manualFeatures.map((feature) => (
                                    <li key={feature.id}>
                                        <strong>{feature.name}</strong> — {feature.featureType}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </SectionCard>

            <SectionCard title="Feature Details">
                {!selectedFeature ? (
                    <p>Select a feature to inspect its details.</p>
                ) : (
                    <>
                        <h3>{selectedFeature.name}</h3>
                        <p>
                            {selectedFeature.source} · {selectedFeature.featureType}
                        </p>
                        <p>Required level: {selectedFeature.levelRequirement}</p>
                        <p>
                            Active by default:{' '}
                            {selectedFeature.isActiveByDefault ? 'Yes' : 'No'}
                        </p>
                        <p>Recharge: {selectedFeature.recharge ?? 'None'}</p>
                        <p>
                            Uses:{' '}
                            {typeof selectedFeature.uses === 'number'
                                ? selectedFeature.uses
                                : 'Unlimited'}
                        </p>
                        <p>{selectedFeature.description}</p>
                    </>
                )}
            </SectionCard>
        </div>
    )
}