import { SavedBadge } from '../sync/SyncStatus'
import { ConfirmButton } from '../components/ConfirmButton'
import { useMemo, useState } from 'react'
import SectionCard from '../components/SectionCard'
import { downloadText, safeFileName, serializeCharacter } from '../lib/characterIO'
import { generateNpc, rerollPart } from '../npc/generate'
import { buildStatBlock, statBlockText } from '../npc/statBlock'
import type { NpcContext, NpcPart, NpcSpec } from '../npc/types'
import { SendToCampaign } from '../npc/ui/SendToCampaign'
import { QuickCreate } from '../npc/ui/QuickCreate'
import { StatBlockView } from '../npc/ui/StatBlockView'
import { getContent, useCollection, useContentStore } from '../store/content'
import { useNpcStore } from '../store/npcs'
import type { Character, NpcTemplate } from '../types/schema'
import { NpcEditor } from './NpcEditor'

export function NpcScreen() {
    const templates = useCollection('npcTemplates')
    const classes = useCollection('classes')
    // Recompute the stat block when GM edits change the rules content.
    const edits = useContentStore((state) => state.edits)

    const npcs = useNpcStore((state) => state.npcs)
    const quarantine = useNpcStore((state) => state.quarantine)
    const { addNpc, saveNpc, deleteNpc } = useNpcStore.getState()

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [templateRole, setTemplateRole] = useState<Record<string, string>>({})
    const [warnings, setWarnings] = useState<string[]>([])
    const [draft, setDraft] = useState<Character | null>(null)
    const [copied, setCopied] = useState(false)

    const selected = npcs.find((npc) => npc.id === selectedId) ?? null
    const block = useMemo(
        () => (selected ? buildStatBlock(selected, getContent()) : null),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [selected, edits],
    )

    const contextFor = (role: string | undefined): NpcContext | null => {
        const template: NpcTemplate | undefined = templates.find((item) => item.role === role) ?? templates[0]
        return template ? { template, content: getContent() } : null
    }

    const handleGenerate = (template: NpcTemplate, spec: NpcSpec) => {
        const result = generateNpc(spec, { template, content: getContent() })
        addNpc(result.character)
        setTemplateRole((current) => ({ ...current, [result.character.id]: template.role }))
        setSelectedId(result.character.id)
        setWarnings(result.warnings)
        setDraft(null)
    }

    const handleReroll = (part: NpcPart) => {
        if (!selected) return
        // Reroll with the role the NPC was made from, falling back to its background note.
        const ctx = contextFor(templateRole[selected.id] ?? selected.backgroundNotes)
        if (!ctx) return
        const result = rerollPart(selected, part, ctx)
        saveNpc(result.character)
        setWarnings(result.warnings)
    }

    const copy = async () => {
        if (!block) return
        try {
            await navigator.clipboard.writeText(statBlockText(block))
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
        } catch {
            setCopied(false)
        }
    }

    return (
        <section id="panel-npc" role="tabpanel" className="tab-panel">
            {quarantine.length > 0 && (
                <p className="status-message" role="alert">
                    {quarantine.length} saved NPC{quarantine.length === 1 ? '' : 's'} could not be loaded and were kept
                    aside, not deleted.
                </p>
            )}

            <div className="grid">
                <QuickCreate templates={templates} classes={classes} onGenerate={handleGenerate} />

                {draft ? (
                    <NpcEditor
                        draft={draft}
                        setDraft={setDraft}
                        onSave={() => {
                            saveNpc(draft)
                            setDraft(null)
                        }}
                        onCancel={() => setDraft(null)}
                    />
                ) : (
                    <SectionCard title="Stat block">
                        {block && selected ? (
                            <>
                                <StatBlockView block={block} warnings={warnings} onReroll={handleReroll} />
                                <div className="actions inline-actions">
                                    <button className="primary-button" type="button" onClick={() => setDraft({ ...selected })}>
                                        Edit details
                                    </button>
                                    <button className="secondary-button" type="button" onClick={() => void copy()}>
                                        {copied ? 'Copied' : 'Copy as text'}
                                    </button>
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => downloadText(serializeCharacter(selected), safeFileName(selected.name, 'npc'))}
                                    >
                                        Export
                                    </button>
                                </div>
                                <SendToCampaign npc={selected} />
                            </>
                        ) : (
                            <p>Generate an NPC, or pick one from your list.</p>
                        )}
                    </SectionCard>
                )}

                <SectionCard title="Your NPCs">
                    {npcs.length === 0 ? (
                        <p>No NPCs yet.</p>
                    ) : (
                        <div className="npc-list">
                            {npcs.map((npc) => (
                                <article key={npc.id} className={`npc-item${npc.id === selectedId ? ' selected' : ''}`}>
                                    <h3>{npc.name || 'Unnamed NPC'}</h3>
                                    <SavedBadge kind="npc" id={npc.id} />
                                    <p className="muted">
                                        Level {npc.level} · {classes.find((item) => item.id === npc.classId)?.name ?? 'No class'} · {npc.nation}
                                    </p>
                                    <div className="actions inline-actions">
                                        <button
                                            className="primary-button"
                                            type="button"
                                            onClick={() => {
                                                setSelectedId(npc.id)
                                                setWarnings([])
                                                setDraft(null)
                                            }}
                                        >
                                            View
                                        </button>
                                        <ConfirmButton
                                            className="secondary-button"
                                            question="Delete this NPC?"
                                            onConfirm={() => {
                                                deleteNpc(npc.id)
                                                if (selectedId === npc.id) setSelectedId(null)
                                            }}
                                        >
                                            Delete
                                        </ConfirmButton>
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
