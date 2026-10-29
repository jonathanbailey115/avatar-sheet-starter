import { useState } from 'react'
import SectionCard from '../components/SectionCard'
import type { ClassLevel } from '../engine/classLevels'
import { learnBlocker } from '../engine/techniques'
import type { ExtraLimit } from '../engine/techniques'
import { TECHNIQUE_LEVELS } from '../types/schema'
import type { Character, Technique, TechniqueDiscipline, TechniqueLevel } from '../types/schema'

export interface TechniqueGroup {
    kind: string
    title: string
    /** Short name for the tab. */
    tab: string
    items: Technique[]
}

interface Props {
    groups: TechniqueGroup[]
    query: string
    onQuery: (value: string) => void
    character: Character
    classLevels: ClassLevel[]
    all: Technique[]
    disciplines: TechniqueDiscipline[]
    extraLimits: ExtraLimit[]
    /** The Mastered cap has been reached, so no more can be raised to Mastered. */
    capReached: boolean
    onLearn: (techniqueId: string) => void
    onForget: (techniqueId: string) => void
    onSetLevel: (techniqueId: string, level: TechniqueLevel) => void
}

/** The technique library, one tab per bending style (and Universal, Fighting, Dragon) instead of one long list. */
export function TechniqueLibrary({
    groups,
    query,
    onQuery,
    character,
    classLevels,
    all,
    disciplines,
    extraLimits,
    capReached,
    onLearn,
    onForget,
    onSetLevel,
}: Props) {
    const [kind, setKind] = useState('')
    const active = groups.find((group) => group.kind === kind) ?? groups[0]
    const levelOf = (techniqueId: string): TechniqueLevel | null =>
        character.knownTechniques.find((known) => known.techniqueId === techniqueId)?.level ?? null
    const knownIn = (group: TechniqueGroup) => group.items.filter((item) => levelOf(item.id)).length

    return (
        <SectionCard title="Technique Library">
            <label>
                Search
                <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Tremors" />
            </label>

            {groups.length === 0 || !active ? (
                <p>
                    No techniques are available. Pick a class first, or your GM can add custom techniques under Campaign Data.
                </p>
            ) : (
                <>
                    <div className="builder-tabs technique-tabs" role="tablist" aria-label="Technique styles">
                        {groups.map((group) => (
                            <button
                                key={group.kind}
                                type="button"
                                role="tab"
                                aria-selected={group.kind === active.kind}
                                className={group.kind === active.kind ? 'active' : ''}
                                onClick={() => setKind(group.kind)}
                            >
                                {group.tab}
                                <small className="muted">
                                    {' '}
                                    {knownIn(group) > 0 ? `${knownIn(group)} known · ` : ''}
                                    {group.items.length}
                                </small>
                            </button>
                        ))}
                    </div>

                    <div className="technique-group">
                        <h3>{active.title}</h3>
                        <div className="checkbox-list">
                            {active.items.map((technique) => {
                                const level = levelOf(technique.id)
                                const blocker = level ? null : learnBlocker(character, technique, classLevels, all, disciplines, extraLimits)

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
                                                {technique.description.length > 220 ? `${technique.description.slice(0, 220)}…` : technique.description}
                                            </small>
                                            {technique.prerequisite && <small className="muted"> Requires {technique.prerequisite}.</small>}
                                        </span>

                                        {level ? (
                                            <span className="actions inline-actions">
                                                {technique.element !== 'Dragon' && (
                                                    <select
                                                        value={level}
                                                        aria-label={`${technique.name} level`}
                                                        onChange={(event) => onSetLevel(technique.id, event.target.value as TechniqueLevel)}
                                                    >
                                                        {TECHNIQUE_LEVELS.map((option) => (
                                                            <option key={option} value={option} disabled={option === 'Mastered' && level !== 'Mastered' && capReached}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                <button className="secondary-button" type="button" onClick={() => onForget(technique.id)}>
                                                    Forget
                                                </button>
                                            </span>
                                        ) : (
                                            <button
                                                className="primary-button"
                                                type="button"
                                                disabled={blocker !== null}
                                                title={blocker ?? 'Learn this technique'}
                                                onClick={() => onLearn(technique.id)}
                                            >
                                                {blocker ?? 'Learn'}
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </SectionCard>
    )
}
