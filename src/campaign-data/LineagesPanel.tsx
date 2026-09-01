import type { FormEvent } from 'react'
import type { Character } from '../types/schema'
import SectionCard from '../components/SectionCard'

type Lineage = {
    id: string
    name: string
    nation: Character['nation'] | 'Any'
    description: string
}

type LineagesPanelProps = {
    nations: Character['nation'][]
    editableLineages: Lineage[]
    editingLineageId: string | null
    setEditableLineages: React.Dispatch<React.SetStateAction<Lineage[]>>
    setEditingLineageId: React.Dispatch<React.SetStateAction<string | null>>
    setEditingStyleId: React.Dispatch<React.SetStateAction<string | null>>
    setEditingTechniqueId: React.Dispatch<React.SetStateAction<string | null>>
    setEditingNpcTemplateRole: React.Dispatch<React.SetStateAction<string | null>>
    saveLineageEdit: (
        lineageId: string,
        updates: {
            name: string
            nation: Character['nation'] | 'Any'
            description: string
        },
    ) => void
    deleteLineage: (lineageId: string) => void
}

export function LineagesPanel({
    nations,
    editableLineages,
    editingLineageId,
    setEditableLineages,
    setEditingLineageId,
    setEditingStyleId,
    setEditingTechniqueId,
    setEditingNpcTemplateRole,
    saveLineageEdit,
    deleteLineage,
}: LineagesPanelProps) {
    return (
        <SectionCard title="Lineages">
            <form
                className="editor-form"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault()
                    const form = event.currentTarget
                    const name = (form.elements.namedItem('lineage-name') as HTMLInputElement).value.trim()
                    const nationValue = (
                        form.elements.namedItem('lineage-nation') as HTMLSelectElement
                    ).value as Character['nation'] | 'Any'
                    const description = (
                        form.elements.namedItem('lineage-description') as HTMLTextAreaElement
                    ).value.trim()

                    if (!name) return

                    const id = name.toLowerCase().replace(/\s+/g, '-')

                    setEditableLineages((current) => [
                        ...current,
                        { id, name, nation: nationValue, description },
                    ])

                    form.reset()
                }}
            >
                <h3>Add lineage</h3>

                <label>
                    Name
                    <input name="lineage-name" />
                </label>

                <label>
                    Nation
                    <select name="lineage-nation" defaultValue="Any">
                        <option value="Any">Any</option>
                        {nations.map((nation) => (
                            <option key={nation} value={nation}>
                                {nation}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Description
                    <textarea name="lineage-description" rows={3} />
                </label>

                <div className="actions">
                    <button className="primary-button" type="submit">
                        Add lineage
                    </button>
                </div>
            </form>

            <div className="npc-list">
                {editableLineages.map((lineage) => (
                    <article key={lineage.id} className="npc-item">
                        {editingLineageId === lineage.id ? (
                            <form
                                className="editor-form"
                                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                                    event.preventDefault()
                                    const form = event.currentTarget
                                    const name = (
                                        form.elements.namedItem('edit-lineage-name') as HTMLInputElement
                                    ).value.trim()
                                    const nationValue = (
                                        form.elements.namedItem('edit-lineage-nation') as HTMLSelectElement
                                    ).value as Character['nation'] | 'Any'
                                    const description = (
                                        form.elements.namedItem('edit-lineage-description') as HTMLTextAreaElement
                                    ).value.trim()

                                    if (!name) return

                                    saveLineageEdit(lineage.id, {
                                        name,
                                        nation: nationValue,
                                        description,
                                    })
                                }}
                            >
                                <label>
                                    Name
                                    <input name="edit-lineage-name" defaultValue={lineage.name} />
                                </label>

                                <label>
                                    Nation
                                    <select name="edit-lineage-nation" defaultValue={lineage.nation}>
                                        <option value="Any">Any</option>
                                        {nations.map((nation) => (
                                            <option key={nation} value={nation}>
                                                {nation}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Description
                                    <textarea
                                        name="edit-lineage-description"
                                        rows={3}
                                        defaultValue={lineage.description}
                                    />
                                </label>

                                <div className="actions inline-actions">
                                    <button className="primary-button" type="submit">
                                        Save
                                    </button>
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => setEditingLineageId(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <h3>{lineage.name}</h3>
                                <p>{lineage.nation}</p>
                                <p>{lineage.description}</p>

                                <div className="actions inline-actions">
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => {
                                            setEditingStyleId(null)
                                            setEditingTechniqueId(null)
                                            setEditingLineageId(lineage.id)
                                            setEditingNpcTemplateRole(null)
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => deleteLineage(lineage.id)}
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