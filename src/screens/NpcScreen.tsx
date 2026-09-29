import { useState } from 'react'
import SectionCard from '../components/SectionCard'
import { downloadText, safeFileName, serializeCharacter } from '../lib/characterIO'
import { generateNpc } from '../lib/generator'
import { useCollection } from '../store/content'
import { useNpcStore } from '../store/npcs'
import { bendingTypes, nations } from '../types/schema'
import type { Character, NpcTemplate } from '../types/schema'
import { NpcEditor } from './NpcEditor'

function leadingWeights(weights: Partial<Record<string, number>>, keys: readonly string[]) {
    return keys
        .map((key) => [key, weights[key] ?? 0] as const)
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
}

function summarize(entries: ReadonlyArray<readonly [string, number]>): string {
    if (entries.length === 0) return 'No weights set (any result).'
    if (entries.length === 1) return `Strongly favors ${entries[0][0]}.`
    return `Leans ${entries[0][0]}, with ${entries[1][0]} as a secondary result.`
}

export function NpcScreen() {
    const templates = useCollection('npcTemplates')
    const lineages = useCollection('lineages')
    const classes = useCollection('classes')
    const backgrounds = useCollection('backgrounds')
    const techniques = useCollection('techniques')

    const npcs = useNpcStore((state) => state.npcs)
    const quarantine = useNpcStore((state) => state.quarantine)
    const { addNpc, saveNpc, deleteNpc } = useNpcStore.getState()

    const [selectedRole, setSelectedRole] = useState('')
    const [draft, setDraft] = useState<Character | null>(null)

    // Always read the live template, so edited weights take effect immediately.
    const template: NpcTemplate | undefined =
        templates.find((item) => item.role === selectedRole) ?? templates[0]

    const startEditing = (npc: Character) => setDraft({ ...npc })

    const handleSave = () => {
        if (!draft) return
        saveNpc(draft)
        setDraft(null)
    }

    return (
        <section id="panel-npc" role="tabpanel" className="tab-panel">
            {quarantine.length > 0 && (
                <p className="status-message" role="alert">
                    {quarantine.length} saved NPC{quarantine.length === 1 ? '' : 's'} could not be
                    loaded and were kept aside, not deleted.
                </p>
            )}

            <div className="grid">
                <SectionCard title="NPC generator starter">
                    {templates.length === 0 ? (
                        <p>No NPC templates. Add one under Campaign Data.</p>
                    ) : (
                        <>
                            <label>
                                NPC template
                                <select
                                    value={template?.role ?? ''}
                                    onChange={(event) => setSelectedRole(event.target.value)}
                                >
                                    {templates.map((item) => (
                                        <option key={item.role} value={item.role}>
                                            {item.role}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {template && (
                                <article className="npc-item template-preview">
                                    <h3>{template.role} preview</h3>
                                    <p className="lede">
                                        <strong>Nation profile:</strong>{' '}
                                        {summarize(leadingWeights(template.nationWeights, nations))}
                                        <br />
                                        <strong>Bending profile:</strong>{' '}
                                        {summarize(leadingWeights(template.bendingWeights, bendingTypes))}
                                    </p>
                                </article>
                            )}

                            <div className="actions inline-actions">
                                <button
                                    className="primary-button"
                                    type="button"
                                    disabled={!template}
                                    onClick={() =>
                                        template &&
                                        addNpc(generateNpc(template, { lineages, classes }))
                                    }
                                >
                                    Generate NPC
                                </button>
                            </div>
                        </>
                    )}
                </SectionCard>

                {draft ? (
                    <NpcEditor
                        draft={draft}
                        setDraft={setDraft}
                        onSave={handleSave}
                        onCancel={() => setDraft(null)}
                    />
                ) : (
                    <SectionCard title="NPC studio">
                        <p>Select an NPC from the generated list to edit it.</p>
                    </SectionCard>
                )}

                <SectionCard title="Generated NPCs">
                    {npcs.length === 0 ? (
                        <p>No NPCs generated yet.</p>
                    ) : (
                        <div className="npc-list">
                            {npcs.map((npc) => (
                                <article key={npc.id} className="npc-item">
                                    <h3>{npc.name || 'Unnamed NPC'}</h3>
                                    <p>
                                        {backgrounds.find((item) => item.id === npc.backgroundId)?.name ??
                                            'No background'}
                                    </p>
                                    <p>
                                        {npc.nation} ·{' '}
                                        {lineages.find((item) => item.id === npc.lineageId)?.name ??
                                            'No lineage'}{' '}
                                        · {classes.find((item) => item.id === npc.classId)?.name ?? 'No class'}
                                    </p>
                                    <p>HP {npc.hp}</p>
                                    {npc.knownTechniques.length > 0 && (
                                        <>
                                            <p>
                                                <strong>Techniques:</strong>
                                            </p>
                                            <ul className="stats">
                                                {npc.knownTechniques.map((known) => (
                                                    <li key={known.techniqueId}>
                                                        {techniques.find((item) => item.id === known.techniqueId)
                                                            ?.name ?? known.techniqueId}{' '}
                                                        — {known.level}
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}

                                    <div className="actions inline-actions">
                                        <button
                                            className="primary-button"
                                            type="button"
                                            onClick={() => startEditing(npc)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={() =>
                                                downloadText(
                                                    serializeCharacter(npc),
                                                    safeFileName(npc.name, 'npc'),
                                                )
                                            }
                                        >
                                            Export
                                        </button>
                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={() => {
                                                if (window.confirm(`Delete ${npc.name || 'this NPC'}?`)) {
                                                    deleteNpc(npc.id)
                                                    if (draft?.id === npc.id) setDraft(null)
                                                }
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>
        </section>
    )
}
