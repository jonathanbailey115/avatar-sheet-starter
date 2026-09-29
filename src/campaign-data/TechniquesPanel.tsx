import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { Technique } from '../types/schema'
import SectionCard from '../components/SectionCard'

const ELEMENT_OPTIONS: Technique['element'][] = ['Universal', 'Air', 'Water', 'Earth', 'Fire']

type TechniquesPanelProps = {
    editableTechniques: Technique[]
    editingTechniqueId: string | null
    setEditableTechniques: Dispatch<SetStateAction<Technique[]>>
    setEditingTechniqueId: Dispatch<SetStateAction<string | null>>
    setEditingLineageId: Dispatch<SetStateAction<string | null>>
    setEditingNpcTemplateRole: Dispatch<SetStateAction<string | null>>
    saveTechniqueEdit: (
        techniqueId: string,
        updates: { name: string; element: Technique['element']; description: string },
    ) => void
    deleteTechnique: (techniqueId: string) => void
}

function slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function field(form: HTMLFormElement, name: string): string {
    return (form.elements.namedItem(name) as HTMLInputElement).value.trim()
}

export function TechniquesPanel({
    editableTechniques,
    editingTechniqueId,
    setEditableTechniques,
    setEditingTechniqueId,
    setEditingLineageId,
    setEditingNpcTemplateRole,
    saveTechniqueEdit,
    deleteTechnique,
}: TechniquesPanelProps) {
    return (
        <SectionCard title="Techniques">
            <p className="lede">
                Custom techniques added here can be learned by characters at Practiced, Trained, or
                Mastered level. The gmbinder technique list arrives with the rules engine.
            </p>

            <form
                className="editor-form"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault()
                    const form = event.currentTarget
                    const name = field(form, 'tech-name')
                    const element = field(form, 'tech-element') as Technique['element']
                    const description = field(form, 'tech-description')
                    const baseId = slugify(name)

                    if (!baseId) return

                    setEditableTechniques((current) => {
                        let id = baseId
                        for (let n = 2; current.some((item) => item.id === id); n += 1) {
                            id = `${baseId}-${n}`
                        }
                        return [...current, { id, name, element, description }]
                    })

                    form.reset()
                }}
            >
                <h3>Add technique</h3>

                <label>
                    Name
                    <input name="tech-name" />
                </label>

                <label>
                    Element
                    <select name="tech-element" defaultValue="Universal">
                        {ELEMENT_OPTIONS.map((element) => (
                            <option key={element} value={element}>
                                {element}
                            </option>
                        ))}
                    </select>
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
                {editableTechniques.length === 0 && <p>No techniques yet.</p>}

                {editableTechniques.map((technique) => (
                    <article key={technique.id} className="npc-item">
                        {editingTechniqueId === technique.id ? (
                            <form
                                className="editor-form"
                                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                                    event.preventDefault()
                                    const form = event.currentTarget
                                    const name = field(form, 'edit-tech-name')
                                    if (!name) return

                                    saveTechniqueEdit(technique.id, {
                                        name,
                                        element: field(form, 'edit-tech-element') as Technique['element'],
                                        description: field(form, 'edit-tech-description'),
                                    })
                                }}
                            >
                                <label>
                                    Name
                                    <input name="edit-tech-name" defaultValue={technique.name} />
                                </label>

                                <label>
                                    Element
                                    <select name="edit-tech-element" defaultValue={technique.element}>
                                        {ELEMENT_OPTIONS.map((element) => (
                                            <option key={element} value={element}>
                                                {element}
                                            </option>
                                        ))}
                                    </select>
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
                                <p>{technique.element}</p>
                                <p>{technique.description}</p>

                                <div className="actions inline-actions">
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => {
                                            setEditingLineageId(null)
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
