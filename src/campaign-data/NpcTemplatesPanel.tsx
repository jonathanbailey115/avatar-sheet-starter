import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { BendingType, Nation, NpcTemplate } from '../types/schema'
import SectionCard from '../components/SectionCard'
import { DEFAULT_COMBAT } from '../npc/types'

type NpcTemplatesPanelProps = {
    nations: Nation[]
    bendingTypes: BendingType[]
    editableNpcTemplates: NpcTemplate[]
    editingNpcTemplateRole: string | null
    setEditableNpcTemplates: Dispatch<SetStateAction<NpcTemplate[]>>
    setEditingNpcTemplateRole: Dispatch<SetStateAction<string | null>>
    setEditingLineageId: Dispatch<SetStateAction<string | null>>
    setEditingTechniqueId: Dispatch<SetStateAction<string | null>>
    setCampaignMessage: Dispatch<SetStateAction<string>>
    saveNpcTemplateEdit: (originalRole: string, updatedTemplate: NpcTemplate) => void
    deleteNpcTemplate: (role: string) => void
}

/** Read the add or edit form: both use the same field names. */
function readTemplateForm(form: HTMLFormElement, nations: Nation[], bendingTypes: BendingType[]): NpcTemplate | null {
    const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement
    const role = field('role').value.trim()
    if (!role) return null

    const weights = <K extends string>(prefix: string, keys: K[]) =>
        Object.fromEntries(keys.map((key) => [key, Number(field(`${prefix}:${key}`).value) || 0])) as Partial<Record<K, number>>

    const percent = field('combat').value.trim()
    const combat = percent === '' ? undefined : Math.min(1, Math.max(0, Number(percent) / 100))

    return {
        role,
        ...(combat === undefined || Number.isNaN(combat) ? {} : { combat }),
        nationWeights: weights('nation', nations),
        bendingWeights: weights('bending', bendingTypes),
    }
}

function TemplateFields({
    template,
    nations,
    bendingTypes,
}: {
    template?: NpcTemplate
    nations: Nation[]
    bendingTypes: BendingType[]
}) {
    return (
        <>
            <label>
                Role
                <input name="role" defaultValue={template?.role} />
            </label>

            <label>
                Chance to wear armor and carry weapons (%)
                <input
                    name="combat"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={template?.combat === undefined ? '' : Math.round(template.combat * 100)}
                    placeholder={`Blank = ${Math.round(DEFAULT_COMBAT * 100)}`}
                />
            </label>

            <div className="two-col">
                {nations.map((nation) => (
                    <label key={nation}>
                        {nation} weight
                        <input name={`nation:${nation}`} type="number" min={0} defaultValue={template?.nationWeights[nation] ?? 0} />
                    </label>
                ))}
            </div>

            <div className="two-col">
                {bendingTypes.map((type) => (
                    <label key={type}>
                        {type} weight
                        <input name={`bending:${type}`} type="number" min={0} defaultValue={template?.bendingWeights[type] ?? 0} />
                    </label>
                ))}
            </div>
        </>
    )
}

export function NpcTemplatesPanel({
    nations,
    bendingTypes,
    editableNpcTemplates,
    editingNpcTemplateRole,
    setEditableNpcTemplates,
    setEditingNpcTemplateRole,
    setEditingLineageId,
    setEditingTechniqueId,
    setCampaignMessage,
    saveNpcTemplateEdit,
    deleteNpcTemplate,
}: NpcTemplatesPanelProps) {
    const submitNew = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const form = event.currentTarget
        const template = readTemplateForm(form, nations, bendingTypes)

        if (!template) {
            setCampaignMessage('Template role is required.')
            return
        }
        if (editableNpcTemplates.some((item) => item.role.toLowerCase() === template.role.toLowerCase())) {
            setCampaignMessage('An NPC template with that role already exists.')
            return
        }

        setEditableNpcTemplates((current) => [...current, template])
        form.reset()
        setCampaignMessage('NPC template added.')
    }

    return (
        <SectionCard title="NPC templates">
            <form className="editor-form" onSubmit={submitNew}>
                <h3>Add NPC template</h3>
                <TemplateFields nations={nations} bendingTypes={bendingTypes} />
                <div className="actions">
                    <button className="primary-button" type="submit">
                        Add NPC template
                    </button>
                </div>
            </form>

            <div className="npc-list">
                {editableNpcTemplates.map((template) => (
                    <article key={template.role} className="npc-item">
                        {editingNpcTemplateRole === template.role ? (
                            <form
                                className="editor-form"
                                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                                    event.preventDefault()
                                    const updated = readTemplateForm(event.currentTarget, nations, bendingTypes)
                                    if (updated) saveNpcTemplateEdit(template.role, updated)
                                    else setCampaignMessage('Template role is required.')
                                }}
                            >
                                <TemplateFields template={template} nations={nations} bendingTypes={bendingTypes} />
                                <div className="actions inline-actions">
                                    <button className="primary-button" type="submit">
                                        Save
                                    </button>
                                    <button className="secondary-button" type="button" onClick={() => setEditingNpcTemplateRole(null)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <h3>{template.role}</h3>
                                <p>
                                    <strong>Armor and weapons:</strong> {Math.round((template.combat ?? DEFAULT_COMBAT) * 100)}% of the time
                                    {template.combat === undefined && ' (default)'}
                                </p>

                                <p>
                                    <strong>Nation weights:</strong>
                                </p>
                                <ul className="stats">
                                    {nations.map((nation) => (
                                        <li key={nation}>
                                            {nation}: {template.nationWeights[nation] ?? 0}
                                        </li>
                                    ))}
                                </ul>

                                <p>
                                    <strong>Bending weights:</strong>
                                </p>
                                <ul className="stats">
                                    {bendingTypes.map((type) => (
                                        <li key={type}>
                                            {type}: {template.bendingWeights[type] ?? 0}
                                        </li>
                                    ))}
                                </ul>

                                <div className="actions inline-actions">
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => {
                                            setEditingLineageId(null)
                                            setEditingTechniqueId(null)
                                            setEditingNpcTemplateRole(template.role)
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button className="secondary-button" type="button" onClick={() => deleteNpcTemplate(template.role)}>
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
