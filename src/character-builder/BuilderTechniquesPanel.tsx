import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { getBendingElement } from '../engine/bending'
import { disciplinesOf, learnBlocker, limitStatus } from '../engine/techniques'
import { masteredCount, masteredLimit } from '../engine/training'
import { useCollection } from '../store/content'
import { DEFAULT_TRAINING, TECHNIQUE_LEVELS } from '../types/schema'
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
    const subclasses = useCollection('subclasses')
    const features = useCollection('features')
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

    // The class's own element first, then Universal, then Fighting techniques.
    const kinds = [element, 'Universal', 'Fighting'].filter((kind): kind is string => Boolean(kind))
    const groups = kinds
        .map((kind) => ({
            kind,
            title: GROUP_TITLES[kind] ?? `${kind}bending techniques`,
            items: available.filter((technique) => technique.element === kind),
        }))
        .filter((group) => group.items.length > 0)

    // What the class table gives at this level, next to what the character actually knows.
    const levelIndex = Math.min(20, Math.max(1, character.level)) - 1
    const slots = selectedClass?.techniqueSlots?.[levelIndex]
    const masteredMax = masteredLimit(slots)
    const capReached = masteredCount(character) >= masteredMax
    const pools = (selectedClass?.resources ?? []).filter((pool) => pool.id.endsWith('universal-slots'))
    const knownAt = (level: TechniqueLevel) => character.knownTechniques.filter((known) => known.level === level).length
    const overSlots = slots
        ? ([['Trained', slots.trained], ['Mastered', slots.mastered]] as const).filter(([level, max]) => knownAt(level) > max)
        : []

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
                    {slots && (
                        <li>
                            <strong>Technique slots at level {character.level}:</strong> Practiced {slots.practiced} · Trained {slots.trained} ·
                            Mastered {slots.mastered}
                        </li>
                    )}
                    {pools.map((pool) => (
                        <li key={pool.id}>
                            <strong>{pool.name}:</strong> {pool.maxByLevel[levelIndex]}
                        </li>
                    ))}
                    <li>
                        <strong>Known at each level:</strong> Practiced {knownAt('Practiced')} · Trained {knownAt('Trained')} · Mastered{' '}
                        {knownAt('Mastered')}
                        {overSlots.map(([level]) => (
                            <span key={level} className="roll-error">
                                {' '}
                                More {level} techniques than {level} slots at this level.
                            </span>
                        ))}
                    </li>
                    <li>
                        <strong>Mastered:</strong> {masteredCount(character)} of {masteredMax}
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
                                        : learnBlocker(character, technique, selectedClass, editableTechniques, disciplinesOf(character, subclasses, features))

                                    return (
                                        <div key={technique.id} className="technique-item">
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
