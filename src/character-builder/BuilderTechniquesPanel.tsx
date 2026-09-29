import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { getBendingElement } from '../engine/bending'
import { learnBlocker, limitStatus } from '../engine/techniques'
import { masteredCount } from '../engine/training'
import { DEFAULT_TRAINING, MAX_MASTERED_TECHNIQUES, TECHNIQUE_LEVELS } from '../types/schema'
import type { Character, CharacterClass, Technique, TechniqueLevel } from '../types/schema'

type BuilderTechniquesPanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    editableClasses: CharacterClass[]
    editableTechniques: Technique[]
}

const GROUP_TITLES: Record<string, string> = {
    Universal: 'Universal techniques',
    Fighting: 'Weaponsmaster fighting techniques',
}

export function BuilderTechniquesPanel({
    character,
    setCharacter,
    editableClasses,
    editableTechniques,
}: BuilderTechniquesPanelProps) {
    const [query, setQuery] = useState('')
    const selectedClass = editableClasses.find((item) => item.id === character.classId)
    const element = getBendingElement(character, editableClasses)
    const limits = limitStatus(character, selectedClass, editableTechniques)

    // A class only offers the kinds its limits mention; custom techniques for the bender's element also show.
    const allowedKinds = new Set(limits.flatMap((entry) => entry.limit.kinds))
    const available = editableTechniques.filter(
        (technique) =>
            (allowedKinds.size === 0
                ? technique.element === 'Universal' || technique.element === element
                : allowedKinds.has(technique.element)) &&
            technique.name.toLowerCase().includes(query.trim().toLowerCase()),
    )

    const levelOf = (techniqueId: string): TechniqueLevel | null =>
        character.knownTechniques.find((known) => known.techniqueId === techniqueId)?.level ?? null

    const learn = (techniqueId: string) =>
        setCharacter((current) => ({
            ...current,
            knownTechniques: [
                ...current.knownTechniques,
                { techniqueId, level: 'Practiced', training: { ...DEFAULT_TRAINING } },
            ],
        }))

    const forget = (techniqueId: string) =>
        setCharacter((current) => ({
            ...current,
            knownTechniques: current.knownTechniques.filter((known) => known.techniqueId !== techniqueId),
        }))

    const setLevel = (techniqueId: string, level: TechniqueLevel) =>
        setCharacter((current) => ({
            ...current,
            knownTechniques: current.knownTechniques.map((known) =>
                known.techniqueId === techniqueId
                    ? { ...known, level, training: { ...DEFAULT_TRAINING } }
                    : known,
            ),
        }))

    const groups = ['Earth', 'Universal', 'Fighting']
        .map((kind) => ({
            kind,
            title: GROUP_TITLES[kind] ?? `${kind}bending techniques`,
            items: available.filter((technique) => technique.element === kind),
        }))
        .filter((group) => group.items.length > 0)

    const capReached = masteredCount(character) >= MAX_MASTERED_TECHNIQUES

    return (
        <div className="grid">
            <SectionCard title="Bending and limits">
                {!selectedClass ? (
                    <p>Choose a class on the Class tab. Your bending and techniques come from your class.</p>
                ) : element ? (
                    <p>
                        <strong>{element}bending</strong> (from {selectedClass.name}).
                    </p>
                ) : (
                    <p>
                        <strong>Non-bender</strong> ({selectedClass.name}).
                    </p>
                )}

                <ul className="stats">
                    {limits.map((entry) => (
                        <li key={entry.limit.id}>
                            <strong>{entry.limit.label}:</strong> {entry.used} of {entry.max}
                            {entry.used > entry.max && ' (over the limit for your level)'}
                        </li>
                    ))}
                    <li>
                        <strong>Mastered:</strong> {masteredCount(character)} of {MAX_MASTERED_TECHNIQUES}
                    </li>
                    {character.level < 8 && (
                        <li className="muted">Rare techniques (marked *) unlock at level 8.</li>
                    )}
                </ul>
            </SectionCard>

            <SectionCard title="Technique Library">
                <label>
                    Search
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tremors" />
                </label>

                {groups.length === 0 ? (
                    <p>
                        No techniques are available. Pick a class first, or your GM can add custom techniques under
                        Campaign Data.
                    </p>
                ) : (
                    groups.map((group) => (
                        <div key={group.kind} className="technique-group">
                            <h3>{group.title}</h3>
                            <div className="checkbox-list">
                                {group.items.map((technique) => {
                                    const level = levelOf(technique.id)
                                    const blocker = level
                                        ? null
                                        : learnBlocker(character, technique, selectedClass, editableTechniques)

                                    return (
                                        <div key={technique.id} className="checkbox-item">
                                            <span>
                                                <strong>
                                                    {technique.name}
                                                    {technique.rare ? ' *' : ''}
                                                </strong>
                                                {technique.castingTime ? ` — ${technique.castingTime}` : ''}
                                                <br />
                                                <small>
                                                    {technique.description.length > 220
                                                        ? `${technique.description.slice(0, 220)}…`
                                                        : technique.description}
                                                </small>
                                                {technique.prerequisite && (
                                                    <small className="muted"> Requires {technique.prerequisite}.</small>
                                                )}
                                            </span>

                                            {level ? (
                                                <span className="actions inline-actions">
                                                    <select
                                                        value={level}
                                                        aria-label={`${technique.name} level`}
                                                        onChange={(event) =>
                                                            setLevel(technique.id, event.target.value as TechniqueLevel)
                                                        }
                                                    >
                                                        {TECHNIQUE_LEVELS.map((option) => (
                                                            <option
                                                                key={option}
                                                                value={option}
                                                                disabled={option === 'Mastered' && level !== 'Mastered' && capReached}
                                                            >
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        className="secondary-button"
                                                        type="button"
                                                        onClick={() => forget(technique.id)}
                                                    >
                                                        Forget
                                                    </button>
                                                </span>
                                            ) : (
                                                <button
                                                    className="primary-button"
                                                    type="button"
                                                    disabled={blocker !== null}
                                                    title={blocker ?? 'Learn this technique'}
                                                    onClick={() => learn(technique.id)}
                                                >
                                                    {blocker ?? 'Learn'}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                )}
            </SectionCard>
        </div>
    )
}
