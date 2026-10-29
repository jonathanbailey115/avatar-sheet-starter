import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import {
    MAX_CLASS_LEVEL,
    classEntries,
    fitLevels,
    maxTotalLevel,
    multiclassWarnings,
    primaryLevelOf,
} from '../engine/classLevels'
import { newId } from '../lib/character'
import type { Character, CharacterClass, CharacterSubclass, ExtraClass } from '../types/schema'

interface Props {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    classes: CharacterClass[]
    subclasses: CharacterSubclass[]
}

/** Apply a change, then keep the levels legal (each class 1-20, total 20 unless the GM lifted the cap). */
const change = (setCharacter: Props['setCharacter'], update: (current: Character) => Character) =>
    setCharacter((current) => {
        const next = update(current)
        return { ...next, ...fitLevels(next) }
    })

const toLevel = (value: number) => (Number.isNaN(value) ? 1 : Math.round(value))

/** More classes for the same character: levels, subclasses, the master who taught them, and the GM's approval. */
export function MulticlassCard({ character, setCharacter, classes, subclasses }: Props) {
    if (!character.classId) return null

    const warnings = multiclassWarnings(character, classes, subclasses)
    const entries = classEntries(character)
    const cap = maxTotalLevel(character)
    const primaryClass = classes.find((item) => item.id === character.classId)

    const updateExtra = (id: string, patch: Partial<ExtraClass>) =>
        change(setCharacter, (current) => ({
            ...current,
            level: patch.level === undefined ? current.level : current.level + (patch.level - (current.extraClasses.find((item) => item.id === id)?.level ?? 0)),
            extraClasses: current.extraClasses.map((extra) => (extra.id === id ? { ...extra, ...patch } : extra)),
        }))

    const addClass = (classId: string) =>
        change(setCharacter, (current) => ({
            ...current,
            level: current.level + 1,
            extraClasses: [...current.extraClasses, { id: newId(), classId, level: 1, master: '', gmApproved: false }],
        }))

    const removeExtra = (id: string) =>
        change(setCharacter, (current) => ({
            ...current,
            level: current.level - (current.extraClasses.find((item) => item.id === id)?.level ?? 0),
            extraClasses: current.extraClasses.filter((extra) => extra.id !== id),
        }))

    return (
        <SectionCard title="Multiclass">
            <p className="muted">
                Total level {character.level} of {cap}. {primaryClass?.name} has {primaryLevelOf(character)} level
                {primaryLevelOf(character) === 1 ? '' : 's'}. A bender can take their own class again for another
                {primaryClass?.subclassName ? ` ${primaryClass.subclassName}` : ' subclass'}, but only after finding a master.
            </p>

            <label className="inline-check">
                <input
                    type="checkbox"
                    checked={character.levelCapLifted}
                    onChange={(event) => change(setCharacter, (current) => ({ ...current, levelCapLifted: event.target.checked }))}
                />
                <span>
                    GM approved: no level cap
                    <small className="muted"> Up to 20 levels in every class, so the total can pass 20.</small>
                </span>
            </label>

            <label>
                {primaryClass?.name ?? 'First class'} level
                <input
                    type="number"
                    min={1}
                    max={MAX_CLASS_LEVEL}
                    value={primaryLevelOf(character)}
                    onChange={(event) =>
                        change(setCharacter, (current) => ({
                            ...current,
                            level: Math.min(MAX_CLASS_LEVEL, Math.max(1, toLevel(event.target.valueAsNumber))) + (current.level - primaryLevelOf(current)),
                        }))
                    }
                />
            </label>

            {character.extraClasses.map((extra) => {
                const characterClass = classes.find((item) => item.id === extra.classId)
                const options = subclasses.filter((item) => item.classId === extra.classId)
                const sameClass = extra.classId === character.classId || entries.some((entry) => !entry.primary && entry.key !== extra.id && entry.classId === extra.classId)
                return (
                    <article key={extra.id} className="npc-item">
                        <h3>{characterClass?.name ?? extra.classId}</h3>
                        <div className="two-col">
                            <label>
                                Level
                                <input
                                    type="number"
                                    min={1}
                                    max={MAX_CLASS_LEVEL}
                                    value={extra.level}
                                    onChange={(event) => updateExtra(extra.id, { level: Math.min(MAX_CLASS_LEVEL, Math.max(1, toLevel(event.target.valueAsNumber))) })}
                                />
                            </label>
                            {options.length > 0 && (
                                <label>
                                    {characterClass?.subclassName ?? 'Subclass'}
                                    <select
                                        value={extra.subclassId ?? ''}
                                        onChange={(event) => updateExtra(extra.id, { subclassId: event.target.value || undefined })}
                                    >
                                        <option value="">None yet</option>
                                        {options.map((subclass) => (
                                            <option key={subclass.id} value={subclass.id}>
                                                {subclass.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                        </div>
                        <label>
                            {sameClass ? 'Master who taught this' : 'Teacher or story reason (optional)'}
                            <input value={extra.master} onChange={(event) => updateExtra(extra.id, { master: event.target.value })} />
                        </label>
                        <label className="inline-check">
                            <input
                                type="checkbox"
                                checked={extra.gmApproved}
                                onChange={(event) => updateExtra(extra.id, { gmApproved: event.target.checked })}
                            />
                            <span>My GM approved this</span>
                        </label>
                        <div className="actions inline-actions">
                            <button className="secondary-button" type="button" onClick={() => removeExtra(extra.id)}>
                                Remove this class
                            </button>
                        </div>
                    </article>
                )
            })}

            <label>
                Add a class
                <select
                    value=""
                    disabled={character.level >= cap}
                    onChange={(event) => event.target.value && addClass(event.target.value)}
                >
                    <option value="">{character.level >= cap ? 'At the level cap' : 'Choose a class to add'}</option>
                    {classes.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                            {item.id === character.classId ? ' (another subclass of your class)' : ''}
                        </option>
                    ))}
                </select>
            </label>

            {warnings.length > 0 && (
                <ul className="status-message" role="note">
                    {warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                    ))}
                </ul>
            )}
        </SectionCard>
    )
}
