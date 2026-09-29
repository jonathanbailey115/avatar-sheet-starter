import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { BuilderTechniquesPanel } from '../character-builder/BuilderTechniquesPanel'
import { computeMaxHp, getHitDie } from '../engine/hitPoints'
import { downloadText, safeFileName, serializeCharacter } from '../lib/characterIO'
import { useCollection } from '../store/content'
import { nations } from '../types/schema'
import type { Character } from '../types/schema'

type NpcEditorProps = {
    draft: Character
    setDraft: Dispatch<SetStateAction<Character | null>>
    onSave: () => void
    onCancel: () => void
}

function toNumber(value: number): number {
    return Number.isNaN(value) ? 0 : value
}

export function NpcEditor({ draft, setDraft, onSave, onCancel }: NpcEditorProps) {
    const lineages = useCollection('lineages')
    const classes = useCollection('classes')
    const backgrounds = useCollection('backgrounds')
    const techniques = useCollection('techniques')

    const update = useCallback<Dispatch<SetStateAction<Character>>>(
        (value) =>
            setDraft((current) =>
                current ? (typeof value === 'function' ? value(current) : value) : current,
            ),
        [setDraft],
    )

    const nationLineages = lineages.filter(
        (lineage) => lineage.nation === 'Any' || lineage.nation === draft.nation,
    )
    const lineageValue = nationLineages.some((item) => item.id === draft.lineageId)
        ? draft.lineageId
        : ''
    const background = backgrounds.find((item) => item.id === draft.backgroundId)

    return (
        <SectionCard title="NPC studio">
            <label>
                NPC name
                <input
                    value={draft.name}
                    onChange={(event) => update((current) => ({ ...current, name: event.target.value }))}
                />
            </label>

            <label>
                Nation
                <select
                    value={draft.nation}
                    onChange={(event) =>
                        update((current) => ({
                            ...current,
                            nation: event.target.value as Character['nation'],
                        }))
                    }
                >
                    {nations.map((nation) => (
                        <option key={nation} value={nation}>
                            {nation}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                Lineage
                <select
                    value={lineageValue}
                    onChange={(event) =>
                        update((current) => ({ ...current, lineageId: event.target.value }))
                    }
                >
                    <option value="">Select a lineage</option>
                    {nationLineages.map((lineage) => (
                        <option key={lineage.id} value={lineage.id}>
                            {lineage.name}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                Class
                <select
                    value={draft.classId}
                    onChange={(event) =>
                        update((current) => ({
                            ...current,
                            classId: event.target.value,
                            classSkillChoices: [],
                            subclassId: undefined,
                        }))
                    }
                >
                    <option value="">No class</option>
                    {classes.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </select>
            </label>

            <div className="two-col">
                <label>
                    Level
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={draft.level}
                        onChange={(event) =>
                            update((current) => ({
                                ...current,
                                level: Math.min(20, Math.max(1, toNumber(event.target.valueAsNumber))),
                            }))
                        }
                    />
                </label>

                <label>
                    Max HP (blank = calculated from lineage)
                    <input
                        type="number"
                        min={1}
                        placeholder={String(computeMaxHp({ ...draft, maxHpOverride: null }, getHitDie(draft, lineages)))}
                        value={draft.maxHpOverride ?? ''}
                        onChange={(event) =>
                            update((current) => ({
                                ...current,
                                maxHpOverride: Number.isNaN(event.target.valueAsNumber)
                                    ? null
                                    : Math.max(1, Math.round(event.target.valueAsNumber)),
                            }))
                        }
                    />
                </label>
            </div>

            <label>
                Background
                <select
                    value={draft.backgroundId ?? ''}
                    onChange={(event) =>
                        update((current) => ({
                            ...current,
                            backgroundId: event.target.value || undefined,
                        }))
                    }
                >
                    <option value="">Select a background</option>
                    {backgrounds.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))}
                </select>
            </label>

            {background && <p>{background.description}</p>}

            <label>
                Notes
                <textarea
                    rows={3}
                    value={draft.notes}
                    onChange={(event) => update((current) => ({ ...current, notes: event.target.value }))}
                />
            </label>

            <BuilderTechniquesPanel
                character={draft}
                setCharacter={update}
                editableClasses={classes}
                editableTechniques={techniques}
            />

            <div className="actions inline-actions">
                <button className="primary-button" type="button" onClick={onSave}>
                    Save NPC
                </button>
                <button className="secondary-button" type="button" onClick={onCancel}>
                    Cancel
                </button>
                <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                        downloadText(serializeCharacter(draft), safeFileName(draft.name, 'npc'))
                    }
                >
                    Export NPC JSON
                </button>
            </div>
        </SectionCard>
    )
}
