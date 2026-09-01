import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { Feature } from '../types/schema'
import SectionCard from '../components/SectionCard'

type FeaturesPanelProps = {
    editableFeatures: Feature[]
    editingFeatureId: string | null
    setEditableFeatures: Dispatch<SetStateAction<Feature[]>>
    setEditingFeatureId: Dispatch<SetStateAction<string | null>>
    setEditingLineageId: Dispatch<SetStateAction<string | null>>
    setEditingStyleId: Dispatch<SetStateAction<string | null>>
    setEditingTechniqueId: Dispatch<SetStateAction<string | null>>
    setEditingNpcTemplateRole: Dispatch<SetStateAction<string | null>>
    saveFeatureEdit: (
        featureId: string,
        updates: {
            name: string
            description: string
            source: Feature['source']
            featureType: Feature['featureType']
            levelRequirement: number
            isActiveByDefault: boolean
            uses?: number
            recharge?: Feature['recharge']
        },
    ) => void
    deleteFeature: (featureId: string) => void
}

const featureSources: Feature['source'][] = [
    'Class',
    'Subclass',
    'Background',
    'Lineage',
    'Feat',
    'Technique',
    'Custom',
]

const featureTypes: Feature['featureType'][] = [
    'Passive',
    'Action',
    'Bonus Action',
    'Reaction',
    'Limited Use',
]

const rechargeOptions: Array<NonNullable<Feature['recharge']> | 'None'> = [
    'None',
    'Short Rest',
    'Long Rest',
    'Manual',
]

export function FeaturesPanel({
    editableFeatures,
    editingFeatureId,
    setEditableFeatures,
    setEditingFeatureId,
    setEditingLineageId,
    setEditingStyleId,
    setEditingTechniqueId,
    setEditingNpcTemplateRole,
    saveFeatureEdit,
    deleteFeature,
}: FeaturesPanelProps) {
    return (
        <SectionCard title="Features">
            <form
                className="editor-form"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault()
                    const form = event.currentTarget

                    const name = (
                        form.elements.namedItem('feature-name') as HTMLInputElement
                    ).value.trim()

                    const description = (
                        form.elements.namedItem('feature-description') as HTMLTextAreaElement
                    ).value.trim()

                    const source = (
                        form.elements.namedItem('feature-source') as HTMLSelectElement
                    ).value as Feature['source']

                    const featureType = (
                        form.elements.namedItem('feature-type') as HTMLSelectElement
                    ).value as Feature['featureType']

                    const levelRequirementValue = (
                        form.elements.namedItem('feature-level') as HTMLInputElement
                    ).valueAsNumber

                    const isActiveByDefault = (
                        form.elements.namedItem('feature-active') as HTMLInputElement
                    ).checked

                    const usesRaw = (
                        form.elements.namedItem('feature-uses') as HTMLInputElement
                    ).value

                    const rechargeRaw = (
                        form.elements.namedItem('feature-recharge') as HTMLSelectElement
                    ).value as Feature['recharge'] | 'None'

                    if (!name) return

                    const id = name.toLowerCase().replace(/\s+/g, '-')
                    const levelRequirement = Number.isNaN(levelRequirementValue)
                        ? 1
                        : levelRequirementValue

                    const uses =
                        usesRaw.trim() === '' ? undefined : Number(usesRaw)

                    const recharge = rechargeRaw === 'None' ? null : rechargeRaw

                    setEditableFeatures((current) => [
                        ...current,
                        {
                            id,
                            name,
                            description,
                            source,
                            featureType,
                            levelRequirement,
                            isActiveByDefault,
                            uses: Number.isNaN(uses as number) ? undefined : uses,
                            recharge,
                        },
                    ])

                    form.reset()
                }}
            >
                <h3>Add feature</h3>

                <label>
                    Name
                    <input name="feature-name" />
                </label>

                <label>
                    Source
                    <select name="feature-source" defaultValue="Custom">
                        {featureSources.map((source) => (
                            <option key={source} value={source}>
                                {source}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Feature type
                    <select name="feature-type" defaultValue="Passive">
                        {featureTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Level requirement
                    <input name="feature-level" type="number" min={1} defaultValue={1} />
                </label>

                <label className="checkbox-item">
                    <input name="feature-active" type="checkbox" defaultChecked />
                    <span>Active by default</span>
                </label>

                <label>
                    Uses
                    <input
                        name="feature-uses"
                        type="number"
                        min={1}
                        placeholder="Leave blank for unlimited"
                    />
                </label>

                <label>
                    Recharge
                    <select name="feature-recharge" defaultValue="None">
                        {rechargeOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Description
                    <textarea name="feature-description" rows={3} />
                </label>

                <div className="actions">
                    <button className="primary-button" type="submit">
                        Add feature
                    </button>
                </div>
            </form>

            <div className="npc-list">
                {editableFeatures.map((feature) => (
                    <article key={feature.id} className="npc-item">
                        {editingFeatureId === feature.id ? (
                            <form
                                className="editor-form"
                                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                                    event.preventDefault()
                                    const form = event.currentTarget

                                    const name = (
                                        form.elements.namedItem('edit-feature-name') as HTMLInputElement
                                    ).value.trim()

                                    const description = (
                                        form.elements.namedItem('edit-feature-description') as HTMLTextAreaElement
                                    ).value.trim()

                                    const source = (
                                        form.elements.namedItem('edit-feature-source') as HTMLSelectElement
                                    ).value as Feature['source']

                                    const featureType = (
                                        form.elements.namedItem('edit-feature-type') as HTMLSelectElement
                                    ).value as Feature['featureType']

                                    const levelRequirementValue = (
                                        form.elements.namedItem('edit-feature-level') as HTMLInputElement
                                    ).valueAsNumber

                                    const isActiveByDefault = (
                                        form.elements.namedItem('edit-feature-active') as HTMLInputElement
                                    ).checked

                                    const usesRaw = (
                                        form.elements.namedItem('edit-feature-uses') as HTMLInputElement
                                    ).value

                                    const rechargeRaw = (
                                        form.elements.namedItem('edit-feature-recharge') as HTMLSelectElement
                                    ).value as Feature['recharge'] | 'None'

                                    if (!name) return

                                    const uses =
                                        usesRaw.trim() === '' ? undefined : Number(usesRaw)

                                    const recharge = rechargeRaw === 'None' ? null : rechargeRaw

                                    saveFeatureEdit(feature.id, {
                                        name,
                                        description,
                                        source,
                                        featureType,
                                        levelRequirement: Number.isNaN(levelRequirementValue)
                                            ? 1
                                            : levelRequirementValue,
                                        isActiveByDefault,
                                        uses: Number.isNaN(uses as number) ? undefined : uses,
                                        recharge,
                                    })
                                }}
                            >
                                <label>
                                    Name
                                    <input name="edit-feature-name" defaultValue={feature.name} />
                                </label>

                                <label>
                                    Source
                                    <select
                                        name="edit-feature-source"
                                        defaultValue={feature.source}
                                    >
                                        {featureSources.map((source) => (
                                            <option key={source} value={source}>
                                                {source}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Feature type
                                    <select
                                        name="edit-feature-type"
                                        defaultValue={feature.featureType}
                                    >
                                        {featureTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Level requirement
                                    <input
                                        name="edit-feature-level"
                                        type="number"
                                        min={1}
                                        defaultValue={feature.levelRequirement}
                                    />
                                </label>

                                <label className="checkbox-item">
                                    <input
                                        name="edit-feature-active"
                                        type="checkbox"
                                        defaultChecked={feature.isActiveByDefault}
                                    />
                                    <span>Active by default</span>
                                </label>

                                <label>
                                    Uses
                                    <input
                                        name="edit-feature-uses"
                                        type="number"
                                        min={1}
                                        defaultValue={feature.uses ?? ''}
                                        placeholder="Leave blank for unlimited"
                                    />
                                </label>

                                <label>
                                    Recharge
                                    <select
                                        name="edit-feature-recharge"
                                        defaultValue={feature.recharge ?? 'None'}
                                    >
                                        {rechargeOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Description
                                    <textarea
                                        name="edit-feature-description"
                                        rows={3}
                                        defaultValue={feature.description}
                                    />
                                </label>

                                <div className="actions inline-actions">
                                    <button className="primary-button" type="submit">
                                        Save
                                    </button>
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => setEditingFeatureId(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <h3>{feature.name}</h3>
                                <p>
                                    {feature.source} · {feature.featureType}
                                </p>
                                <p>Level {feature.levelRequirement}</p>
                                <p>
                                    {feature.uses ? `Uses: ${feature.uses}` : 'Unlimited use'}
                                    {' · '}
                                    {feature.recharge ?? 'No recharge'}
                                </p>
                                <p>
                                    {feature.isActiveByDefault ? 'Active by default' : 'Optional'}
                                </p>
                                <p>{feature.description}</p>

                                <div className="actions inline-actions">
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => {
                                            setEditingLineageId(null)
                                            setEditingStyleId(null)
                                            setEditingTechniqueId(null)
                                            setEditingFeatureId(feature.id)
                                            setEditingNpcTemplateRole(null)
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => deleteFeature(feature.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </article>
                ))}
            </div>
        </SectionCard>
    )
}