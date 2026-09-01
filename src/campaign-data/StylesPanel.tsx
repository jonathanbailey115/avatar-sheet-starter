import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { BendingType, Character, Nation, Style } from '../types/schema'
import SectionCard from '../components/SectionCard'

type StylesPanelProps = {
    nations: Nation[]
    bendingTypes: BendingType[]
    editableStyles: Style[]
    editingStyleId: string | null
    setEditableStyles: Dispatch<SetStateAction<Style[]>>
    setEditingStyleId: Dispatch<SetStateAction<string | null>>
    setEditingLineageId: Dispatch<SetStateAction<string | null>>
    setEditingTechniqueId: Dispatch<SetStateAction<string | null>>
    setEditingNpcTemplateRole: Dispatch<SetStateAction<string | null>>
    saveStyleEdit: (
        styleId: string,
        updates: {
            name: string
            nation: Character['nation'] | 'Any'
            bendingType: BendingType
            description: string
        },
    ) => void
    deleteStyle: (styleId: string) => void
}

export function StylesPanel({
    nations,
    bendingTypes,
    editableStyles,
    editingStyleId,
    setEditableStyles,
    setEditingStyleId,
    setEditingLineageId,
    setEditingTechniqueId,
    setEditingNpcTemplateRole,
    saveStyleEdit,
    deleteStyle,
}: StylesPanelProps) {
    return (
        <SectionCard title="Styles">
            <form
                className="editor-form"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault()
                    const form = event.currentTarget
                    const name = (form.elements.namedItem('style-name') as HTMLInputElement).value.trim()
                    const nationValue = (
                        form.elements.namedItem('style-nation') as HTMLSelectElement
                    ).value as Character['nation'] | 'Any'
                    const bendingTypeValue = (
                        form.elements.namedItem('style-bending') as HTMLSelectElement
                    ).value as BendingType
                    const description = (
                        form.elements.namedItem('style-description') as HTMLTextAreaElement
                    ).value.trim()

                    if (!name) return

                    const id = name.toLowerCase().replace(/\s+/g, '-')

                    setEditableStyles((current) => [
                        ...current,
                        {
                            id,
                            name,
                            bendingType: bendingTypeValue,
                            nation: nationValue,
                            description,
                        },
                    ])

                    form.reset()
                }}
            >
                <h3>Add style</h3>

                <label>
                    Name
                    <input name="style-name" />
                </label>

                <label>
                    Bending type
                    <select name="style-bending" defaultValue={bendingTypes[0]}>
                        {bendingTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Nation
                    <select name="style-nation" defaultValue="Any">
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
                    <textarea name="style-description" rows={3} />
                </label>

                <div className="actions">
                    <button className="primary-button" type="submit">
                        Add style
                    </button>
                </div>
            </form>

            <div className="npc-list">
                {editableStyles.map((style) => (
                    <article key={style.id} className="npc-item">
                        {editingStyleId === style.id ? (
                            <form
                                className="editor-form"
                                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                                    event.preventDefault()
                                    const form = event.currentTarget
                                    const name = (
                                        form.elements.namedItem('edit-style-name') as HTMLInputElement
                                    ).value.trim()
                                    const nationValue = (
                                        form.elements.namedItem('edit-style-nation') as HTMLSelectElement
                                    ).value as Character['nation'] | 'Any'
                                    const bendingTypeValue = (
                                        form.elements.namedItem('edit-style-bending') as HTMLSelectElement
                                    ).value as BendingType
                                    const description = (
                                        form.elements.namedItem('edit-style-description') as HTMLTextAreaElement
                                    ).value.trim()

                                    if (!name) return

                                    saveStyleEdit(style.id, {
                                        name,
                                        nation: nationValue,
                                        bendingType: bendingTypeValue,
                                        description,
                                    })
                                }}
                            >
                                <label>
                                    Name
                                    <input name="edit-style-name" defaultValue={style.name} />
                                </label>

                                <label>
                                    Bending type
                                    <select
                                        name="edit-style-bending"
                                        defaultValue={style.bendingType}
                                    >
                                        {bendingTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Nation
                                    <select name="edit-style-nation" defaultValue={style.nation}>
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
                                        name="edit-style-description"
                                        rows={3}
                                        defaultValue={style.description}
                                    />
                                </label>

                                <div className="actions inline-actions">
                                    <button className="primary-button" type="submit">
                                        Save
                                    </button>
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => setEditingStyleId(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <h3>{style.name}</h3>
                                <p>{style.nation} · {style.bendingType}</p>
                                <p>{style.description}</p>

                                <div className="actions inline-actions">
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => {
                                            setEditingLineageId(null)
                                            setEditingTechniqueId(null)
                                            setEditingStyleId(style.id)
                                            setEditingNpcTemplateRole(null)
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => deleteStyle(style.id)}
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