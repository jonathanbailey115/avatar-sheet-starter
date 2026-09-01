import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { BendingType, Technique } from '../types/schema'
import SectionCard from '../components/SectionCard'

type TechniquesPanelProps = {
    bendingTypes: BendingType[]
    editableTechniques: Technique[]
    editingTechniqueId: string | null
    setEditableTechniques: Dispatch<SetStateAction<Technique[]>>
    setEditingTechniqueId: Dispatch<SetStateAction<string | null>>
    setEditingLineageId: Dispatch<SetStateAction<string | null>>
    setEditingStyleId: Dispatch<SetStateAction<string | null>>
    setEditingNpcTemplateRole: Dispatch<SetStateAction<string | null>>
    saveTechniqueEdit: (
        techniqueId: string,
        updates: {
            name: string
            bendingType: BendingType
            tier: 1 | 2 | 3 | 4
            description: string
        },
    ) => void
    deleteTechnique: (techniqueId: string) => void
}

export function TechniquesPanel({
    bendingTypes,
    editableTechniques,
    editingTechniqueId,
    setEditableTechniques,
    setEditingTechniqueId,
    setEditingLineageId,
    setEditingStyleId,
    setEditingNpcTemplateRole,
    saveTechniqueEdit,
    deleteTechnique,
}: TechniquesPanelProps) {
    return (
        <SectionCard title="Techniques">
            <form
                className="editor-form"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault()
                    const form = event.currentTarget
                    const name = (form.elements.namedItem('tech-name') as HTMLInputElement).value.trim()
                    const bendingTypeValue = (
                        form.elements.namedItem('tech-bending') as HTMLSelectElement
                    ).value as BendingType
                    const tierValue = Number(
                        (form.elements.namedItem('tech-tier') as HTMLInputElement).value,
                    )
                    const description = (
                        form.elements.namedItem('tech-description') as HTMLTextAreaElement
                    ).value.trim()

                    if (!name || Number.isNaN(tierValue) || tierValue < 1 || tierValue > 4) {
                        return
                    }

                    const id = name.toLowerCase().replace(/\s+/g, '-')

                    setEditableTechniques((current) => [
                        ...current,
                        {
                            id,
                            name,
                            tier: tierValue as 1 | 2 | 3 | 4,
                            bendingType: bendingTypeValue,
                            description,
                        },
                    ])

                    form.reset()
                }}
            >
                <h3>Add technique</h3>

                <label>
                    Name
                    <input name="tech-name" />
                </label>

                <label>
                    Bending type
                    <select name="tech-bending" defaultValue={bendingTypes[0]}>
                        {bendingTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Tier
                    <input name="tech-tier" type="number" min={1} max={4} defaultValue={1} />
                </label>

                <label>
                    Description
                    <textarea name="tech-description" rows={3} />
                </label>

                <div className="actions">
                    <button className="primary-button" type="submit">
                        Add technique
                    </button>
                </div>
            </form>

            <div className="npc-list">
                {editableTechniques.map((technique) => (
                    <article key={technique.id} className="npc-item">
                        {editingTechniqueId === technique.id ? (
                            <form
                                className="editor-form"
                                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                                    event.preventDefault()
                                    const form = event.currentTarget
                                    const name = (
                                        form.elements.namedItem('edit-tech-name') as HTMLInputElement
                                    ).value.trim()
                                    const bendingTypeValue = (
                                        form.elements.namedItem('edit-tech-bending') as HTMLSelectElement
                                    ).value as BendingType
                                    const tierValue = Number(
                                        (form.elements.namedItem('edit-tech-tier') as HTMLInputElement).value,
                                    )
                                    const description = (
                                        form.elements.namedItem('edit-tech-description') as HTMLTextAreaElement
                                    ).value.trim()

                                    if (!name || Number.isNaN(tierValue) || tierValue < 1 || tierValue > 4) {
                                        return
                                    }

                                    saveTechniqueEdit(technique.id, {
                                        name,
                                        bendingType: bendingTypeValue,
                                        tier: tierValue as 1 | 2 | 3 | 4,
                                        description,
                                    })
                                }}
                            >
                                <label>
                                    Name
                                    <input name="edit-tech-name" defaultValue={technique.name} />
                                </label>

                                <label>
                                    Bending type
                                    <select
                                        name="edit-tech-bending"
                                        defaultValue={technique.bendingType}
                                    >
                                        {bendingTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Tier
                                    <input
                                        name="edit-tech-tier"
                                        type="number"
                                        min={1}
                                        max={4}
                                        defaultValue={technique.tier}
                                    />
                                </label>

                                <label>
                                    Description
                                    <textarea
                                        name="edit-tech-description"
                                        rows={3}
                                        defaultValue={technique.description}
                                    />
                                </label>

                                <div className="actions inline-actions">
                                    <button className="primary-button" type="submit">
                                        Save
                                    </button>
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => setEditingTechniqueId(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <h3>{technique.name}</h3>
                                <p>{technique.bendingType} · Tier {technique.tier}</p>
                                <p>{technique.description}</p>

                                <div className="actions inline-actions">
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => {
                                            setEditingLineageId(null)
                                            setEditingStyleId(null)
                                            setEditingTechniqueId(technique.id)
                                            setEditingNpcTemplateRole(null)
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => deleteTechnique(technique.id)}
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