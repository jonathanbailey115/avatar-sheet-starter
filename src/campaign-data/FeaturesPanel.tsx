import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { Feature } from '../types/schema'
import SectionCard from '../components/SectionCard'

type FeatureEdits = {
    name: string
    description: string
    source: Feature['source']
    featureType: Feature['featureType']
    levelRequirement: number
    isActiveByDefault: boolean
    uses?: number
    recharge?: Feature['recharge']
}

type FeaturesPanelProps = {
    editableFeatures: Feature[]
    editingFeatureId: string | null
    setEditableFeatures: Dispatch<SetStateAction<Feature[]>>
    setEditingFeatureId: Dispatch<SetStateAction<string | null>>
    setEditingLineageId: Dispatch<SetStateAction<string | null>>
    setEditingTechniqueId: Dispatch<SetStateAction<string | null>>
    setEditingNpcTemplateRole: Dispatch<SetStateAction<string | null>>
    saveFeatureEdit: (featureId: string, updates: FeatureEdits) => void
    deleteFeature: (featureId: string) => void
}

const featureSources: Feature['source'][] = ['Class', 'Subclass', 'Background', 'Lineage', 'Feat', 'Technique', 'Custom']
const featureTypes: Feature['featureType'][] = ['Passive', 'Action', 'Bonus Action', 'Reaction', 'Limited Use']
const rechargeOptions: Array<NonNullable<Feature['recharge']> | 'None'> = ['None', 'Short Rest', 'Long Rest', 'Manual']

/** Read the fields of a feature form (the add form and the edit form use the same field names). */
function readFeatureForm(form: HTMLFormElement): FeatureEdits | null {
    const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement
    const name = field('name').value.trim()
    if (!name) return null

    const level = field('level').valueAsNumber
    const usesRaw = field('uses').value.trim()
    const uses = usesRaw === '' ? undefined : Number(usesRaw)
    const rechargeRaw = field('recharge').value as Feature['recharge'] | 'None'

    return {
        name,
        description: (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim(),
        source: field('source').value as Feature['source'],
        featureType: field('type').value as Feature['featureType'],
        levelRequirement: Number.isNaN(level) ? 1 : level,
        isActiveByDefault: field('active').checked,
        uses: Number.isNaN(uses as number) ? undefined : uses,
        recharge: rechargeRaw === 'None' ? null : rechargeRaw,
    }
}

/** The fields of a feature, filled from `feature` when editing and empty for a new one. */
function FeatureFields({ feature }: { feature?: Feature }) {
    return (
        <>
            <label>
                Name
                <input name="name" defaultValue={feature?.name} />
            </label>

            <label>
                Source
                <select name="source" defaultValue={feature?.source ?? 'Custom'}>
                    {featureSources.map((source) => (
                        <option key={source} value={source}>
                            {source}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                Feature type
                <select name="type" defaultValue={feature?.featureType ?? 'Passive'}>
                    {featureTypes.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                Level requirement
                <input name="level" type="number" min={1} defaultValue={feature?.levelRequirement ?? 1} />
            </label>

            <label className="checkbox-item">
                <input name="active" type="checkbox" defaultChecked={feature?.isActiveByDefault ?? true} />
                <span>Active by default</span>
            </label>

            <label>
                Uses
                <input name="uses" type="number" min={1} defaultValue={feature?.uses ?? ''} placeholder="Leave blank for unlimited" />
            </label>

            <label>
                Recharge
                <select name="recharge" defaultValue={feature?.recharge ?? 'None'}>
                    {rechargeOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                Description
                <textarea name="description" rows={3} defaultValue={feature?.description} />
            </label>
        </>
    )
}

export function FeaturesPanel({
    editableFeatures,
    editingFeatureId,
    setEditableFeatures,
    setEditingFeatureId,
    setEditingLineageId,
    setEditingTechniqueId,
    setEditingNpcTemplateRole,
    saveFeatureEdit,
    deleteFeature,
}: FeaturesPanelProps) {
    const submitNew = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const form = event.currentTarget
        const values = readFeatureForm(form)
        if (!values) return

        const id = values.name.toLowerCase().replace(/\s+/g, '-')
        setEditableFeatures((current) => [...current, { id, ...values }])
        form.reset()
    }

    return (
        <SectionCard title="Features">
            <form className="editor-form" onSubmit={submitNew}>
                <h3>Add feature</h3>
                <FeatureFields />
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
                                    const values = readFeatureForm(event.currentTarget)
                                    if (values) saveFeatureEdit(feature.id, values)
                                }}
                            >
                                <FeatureFields feature={feature} />
                                <div className="actions inline-actions">
                                    <button className="primary-button" type="submit">
                                        Save
                                    </button>
                                    <button className="secondary-button" type="button" onClick={() => setEditingFeatureId(null)}>
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
                                <p>{feature.isActiveByDefault ? 'Active by default' : 'Optional'}</p>
                                <p>{feature.description}</p>

                                <div className="actions inline-actions">
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => {
                                            setEditingLineageId(null)
                                            setEditingTechniqueId(null)
                                            setEditingFeatureId(feature.id)
                                            setEditingNpcTemplateRole(null)
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button className="secondary-button" type="button" onClick={() => deleteFeature(feature.id)}>
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
