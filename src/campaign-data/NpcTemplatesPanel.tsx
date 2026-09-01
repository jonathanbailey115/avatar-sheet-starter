import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { BendingType, Nation, NpcTemplate } from '../types/schema'
import SectionCard from '../components/SectionCard'

type NpcTemplatesPanelProps = {
    nations: Nation[]
    bendingTypes: BendingType[]
    editableNpcTemplates: NpcTemplate[]
    editingNpcTemplateRole: string | null
    setEditableNpcTemplates: Dispatch<SetStateAction<NpcTemplate[]>>
    setEditingNpcTemplateRole: Dispatch<SetStateAction<string | null>>
    setEditingLineageId: Dispatch<SetStateAction<string | null>>
    setEditingStyleId: Dispatch<SetStateAction<string | null>>
    setEditingTechniqueId: Dispatch<SetStateAction<string | null>>
    setCampaignMessage: Dispatch<SetStateAction<string>>
    saveNpcTemplateEdit: (originalRole: string, updatedTemplate: NpcTemplate) => void
    deleteNpcTemplate: (role: string) => void
}

export function NpcTemplatesPanel({
    nations,
    bendingTypes,
    editableNpcTemplates,
    editingNpcTemplateRole,
    setEditableNpcTemplates,
    setEditingNpcTemplateRole,
    setEditingLineageId,
    setEditingStyleId,
    setEditingTechniqueId,
    setCampaignMessage,
    saveNpcTemplateEdit,
    deleteNpcTemplate,
}: NpcTemplatesPanelProps) {
    return (
        <SectionCard title="NPC templates">
            <form
                className="editor-form"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault()
                    const form = event.currentTarget

                    const role = (
                        form.elements.namedItem('npc-template-role') as HTMLInputElement
                    ).value.trim()

                    if (!role) {
                        setCampaignMessage('Template role is required.')
                        return
                    }

                    const alreadyExists = editableNpcTemplates.some(
                        (template) => template.role.toLowerCase() === role.toLowerCase(),
                    )

                    if (alreadyExists) {
                        setCampaignMessage('An NPC template with that role already exists.')
                        return
                    }

                    const nationWeights: Partial<Record<Nation, number>> = {
                        'Air Nomads': Number(
                            (form.elements.namedItem('npc-nation-air-nomads') as HTMLInputElement).value,
                        ) || 0,
                        'Water Tribe': Number(
                            (form.elements.namedItem('npc-nation-water-tribe') as HTMLInputElement).value,
                        ) || 0,
                        'Earth Kingdom': Number(
                            (form.elements.namedItem('npc-nation-earth-kingdom') as HTMLInputElement).value,
                        ) || 0,
                        'Fire Nation': Number(
                            (form.elements.namedItem('npc-nation-fire-nation') as HTMLInputElement).value,
                        ) || 0,
                        Mixed: Number(
                            (form.elements.namedItem('npc-nation-mixed') as HTMLInputElement).value,
                        ) || 0,
                    }

                    const bendingWeights: Partial<Record<BendingType, number>> = {
                        Air: Number(
                            (form.elements.namedItem('npc-bending-air') as HTMLInputElement).value,
                        ) || 0,
                        Water: Number(
                            (form.elements.namedItem('npc-bending-water') as HTMLInputElement).value,
                        ) || 0,
                        Earth: Number(
                            (form.elements.namedItem('npc-bending-earth') as HTMLInputElement).value,
                        ) || 0,
                        Fire: Number(
                            (form.elements.namedItem('npc-bending-fire') as HTMLInputElement).value,
                        ) || 0,
                        'Non-Bender': Number(
                            (form.elements.namedItem('npc-bending-non-bender') as HTMLInputElement).value,
                        ) || 0,
                    }

                    setEditableNpcTemplates((current) => [
                        ...current,
                        {
                            role,
                            nationWeights,
                            bendingWeights,
                        },
                    ])

                    form.reset()
                    setCampaignMessage('NPC template added.')
                }}
            >
                <h3>Add NPC template</h3>

                <label>
                    Role
                    <input name="npc-template-role" />
                </label>

                <div className="two-col">
                    <label>
                        Air Nomads weight
                        <input name="npc-nation-air-nomads" type="number" min={0} defaultValue={0} />
                    </label>
                    <label>
                        Water Tribe weight
                        <input name="npc-nation-water-tribe" type="number" min={0} defaultValue={0} />
                    </label>
                    <label>
                        Earth Kingdom weight
                        <input name="npc-nation-earth-kingdom" type="number" min={0} defaultValue={0} />
                    </label>
                    <label>
                        Fire Nation weight
                        <input name="npc-nation-fire-nation" type="number" min={0} defaultValue={0} />
                    </label>
                    <label>
                        Mixed weight
                        <input name="npc-nation-mixed" type="number" min={0} defaultValue={0} />
                    </label>
                </div>

                <div className="two-col">
                    <label>
                        Air weight
                        <input name="npc-bending-air" type="number" min={0} defaultValue={0} />
                    </label>
                    <label>
                        Water weight
                        <input name="npc-bending-water" type="number" min={0} defaultValue={0} />
                    </label>
                    <label>
                        Earth weight
                        <input name="npc-bending-earth" type="number" min={0} defaultValue={0} />
                    </label>
                    <label>
                        Fire weight
                        <input name="npc-bending-fire" type="number" min={0} defaultValue={0} />
                    </label>
                    <label>
                        Non-Bender weight
                        <input name="npc-bending-non-bender" type="number" min={0} defaultValue={0} />
                    </label>
                </div>

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
                                    const form = event.currentTarget

                                    const role = (
                                        form.elements.namedItem('edit-npc-template-role') as HTMLInputElement
                                    ).value.trim()

                                    if (!role) {
                                        setCampaignMessage('Template role is required.')
                                        return
                                    }

                                    saveNpcTemplateEdit(template.role, {
                                        role,
                                        nationWeights: {
                                            'Air Nomads': Number(
                                                (form.elements.namedItem('edit-npc-nation-air-nomads') as HTMLInputElement)
                                                    .value,
                                            ) || 0,
                                            'Water Tribe': Number(
                                                (form.elements.namedItem('edit-npc-nation-water-tribe') as HTMLInputElement)
                                                    .value,
                                            ) || 0,
                                            'Earth Kingdom': Number(
                                                (form.elements.namedItem('edit-npc-nation-earth-kingdom') as HTMLInputElement)
                                                    .value,
                                            ) || 0,
                                            'Fire Nation': Number(
                                                (form.elements.namedItem('edit-npc-nation-fire-nation') as HTMLInputElement)
                                                    .value,
                                            ) || 0,
                                            Mixed: Number(
                                                (form.elements.namedItem('edit-npc-nation-mixed') as HTMLInputElement).value,
                                            ) || 0,
                                        },
                                        bendingWeights: {
                                            Air: Number(
                                                (form.elements.namedItem('edit-npc-bending-air') as HTMLInputElement).value,
                                            ) || 0,
                                            Water: Number(
                                                (form.elements.namedItem('edit-npc-bending-water') as HTMLInputElement).value,
                                            ) || 0,
                                            Earth: Number(
                                                (form.elements.namedItem('edit-npc-bending-earth') as HTMLInputElement).value,
                                            ) || 0,
                                            Fire: Number(
                                                (form.elements.namedItem('edit-npc-bending-fire') as HTMLInputElement).value,
                                            ) || 0,
                                            'Non-Bender': Number(
                                                (form.elements.namedItem('edit-npc-bending-non-bender') as HTMLInputElement)
                                                    .value,
                                            ) || 0,
                                        },
                                    })
                                }}
                            >
                                <label>
                                    Role
                                    <input
                                        name="edit-npc-template-role"
                                        defaultValue={template.role}
                                    />
                                </label>

                                <div className="two-col">
                                    <label>
                                        Air Nomads weight
                                        <input
                                            name="edit-npc-nation-air-nomads"
                                            type="number"
                                            min={0}
                                            defaultValue={template.nationWeights['Air Nomads'] ?? 0}
                                        />
                                    </label>
                                    <label>
                                        Water Tribe weight
                                        <input
                                            name="edit-npc-nation-water-tribe"
                                            type="number"
                                            min={0}
                                            defaultValue={template.nationWeights['Water Tribe'] ?? 0}
                                        />
                                    </label>
                                    <label>
                                        Earth Kingdom weight
                                        <input
                                            name="edit-npc-nation-earth-kingdom"
                                            type="number"
                                            min={0}
                                            defaultValue={template.nationWeights['Earth Kingdom'] ?? 0}
                                        />
                                    </label>
                                    <label>
                                        Fire Nation weight
                                        <input
                                            name="edit-npc-nation-fire-nation"
                                            type="number"
                                            min={0}
                                            defaultValue={template.nationWeights['Fire Nation'] ?? 0}
                                        />
                                    </label>
                                    <label>
                                        Mixed weight
                                        <input
                                            name="edit-npc-nation-mixed"
                                            type="number"
                                            min={0}
                                            defaultValue={template.nationWeights.Mixed ?? 0}
                                        />
                                    </label>
                                </div>

                                <div className="two-col">
                                    <label>
                                        Air weight
                                        <input
                                            name="edit-npc-bending-air"
                                            type="number"
                                            min={0}
                                            defaultValue={template.bendingWeights.Air ?? 0}
                                        />
                                    </label>
                                    <label>
                                        Water weight
                                        <input
                                            name="edit-npc-bending-water"
                                            type="number"
                                            min={0}
                                            defaultValue={template.bendingWeights.Water ?? 0}
                                        />
                                    </label>
                                    <label>
                                        Earth weight
                                        <input
                                            name="edit-npc-bending-earth"
                                            type="number"
                                            min={0}
                                            defaultValue={template.bendingWeights.Earth ?? 0}
                                        />
                                    </label>
                                    <label>
                                        Fire weight
                                        <input
                                            name="edit-npc-bending-fire"
                                            type="number"
                                            min={0}
                                            defaultValue={template.bendingWeights.Fire ?? 0}
                                        />
                                    </label>
                                    <label>
                                        Non-Bender weight
                                        <input
                                            name="edit-npc-bending-non-bender"
                                            type="number"
                                            min={0}
                                            defaultValue={template.bendingWeights['Non-Bender'] ?? 0}
                                        />
                                    </label>
                                </div>

                                <div className="actions inline-actions">
                                    <button className="primary-button" type="submit">
                                        Save
                                    </button>
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => setEditingNpcTemplateRole(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <h3>{template.role}</h3>

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
                                            setEditingStyleId(null)
                                            setEditingTechniqueId(null)
                                            setEditingNpcTemplateRole(template.role)
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => deleteNpcTemplate(template.role)}
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