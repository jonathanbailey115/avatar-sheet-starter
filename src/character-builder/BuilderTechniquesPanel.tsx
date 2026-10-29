import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { classLevelsOf } from '../engine/classLevels'
import { disciplinesOf, limitStatus, slotSources, subclassLimits } from '../engine/techniques'
import { masteredCount, masteredLimit } from '../engine/training'
import { useCollection } from '../store/content'
import { DEFAULT_TRAINING } from '../types/schema'
import type { Character, CharacterClass, Technique, TechniqueLevel } from '../types/schema'
import { TechniqueLibrary } from './TechniqueLibrary'
import type { TechniqueGroup } from './TechniqueLibrary'

type BuilderTechniquesPanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    editableClasses: CharacterClass[]
    editableTechniques: Technique[]
}

const GROUP_TITLES: Record<string, string> = {
    Universal: 'Universal techniques',
    Fighting: 'Weaponsmaster fighting techniques',
    Dragon: 'Dragon techniques (spend a Training Die)',
}

export function BuilderTechniquesPanel({ character, setCharacter, editableClasses, editableTechniques }: BuilderTechniquesPanelProps) {
    const [query, setQuery] = useState('')
    const subclasses = useCollection('subclasses')
    const features = useCollection('features')
    const classLevels = classLevelsOf(character, editableClasses)
    const bendingLevel = classLevels.find((item) => item.characterClass.element)?.level ?? character.level
    const extraLimits = subclassLimits(character, subclasses)
    const limits = limitStatus(character, classLevels, editableTechniques, extraLimits)
    const disciplines = disciplinesOf(character, subclasses, features)

    // A class only offers the kinds its limits mention; custom techniques for a bender's element also show.
    const elements = [...new Set(classLevels.map((item) => item.characterClass.element))]
    const allowedKinds = new Set<string>(limits.flatMap((entry) => entry.limit.kinds))
    const matches = (technique: Technique) => technique.name.toLowerCase().includes(query.trim().toLowerCase())
    const available = editableTechniques.filter(
        (technique) =>
            (allowedKinds.size === 0 ? technique.element === 'Universal' || elements.some((element) => element === technique.element) : allowedKinds.has(technique.element)) &&
            matches(technique),
    )

    const dragonElements = extraLimits.flatMap((item) => item.limit.kinds)
    const kinds = [...new Set([...elements, ...dragonElements]), 'Universal', 'Fighting', 'Dragon'].filter((kind): kind is string => Boolean(kind))
    const groups: TechniqueGroup[] = kinds
        .map((kind) => ({
            kind,
            title: GROUP_TITLES[kind] ?? `${kind}bending techniques`,
            tab: GROUP_TITLES[kind] ? kind : `${kind}bending`,
            items: available.filter((technique) => technique.element === kind),
        }))
        .filter((group) => group.items.length > 0)

    const sources = slotSources(character, classLevels, subclasses)
    const total = sources.reduce(
        (sum, source) => ({ practiced: sum.practiced + source.practiced, trained: sum.trained + source.trained, mastered: sum.mastered + source.mastered }),
        { practiced: 0, trained: 0, mastered: 0 },
    )
    const masteredMax = masteredLimit(sources.length > 0 ? total : undefined)
    const capReached = masteredCount(character) >= masteredMax
    const pools = classLevels.flatMap(({ characterClass, level }) =>
        (characterClass.resources ?? [])
            .filter((pool) => pool.id.endsWith('universal-slots'))
            .map((pool) => ({ pool, max: pool.maxByLevel[Math.min(20, Math.max(1, level)) - 1] })),
    )
    const knownAt = (level: TechniqueLevel) => character.knownTechniques.filter((known) => known.level === level).length
    const overSlots = sources.length > 0 ? ([['Trained', total.trained], ['Mastered', total.mastered]] as const).filter(([level, max]) => knownAt(level) > max) : []

    const learn = (techniqueId: string) =>
        setCharacter((current) => ({
            ...current,
            knownTechniques: [...current.knownTechniques, { techniqueId, level: 'Practiced', training: { ...DEFAULT_TRAINING } }],
        }))
    const forget = (techniqueId: string) =>
        setCharacter((current) => ({ ...current, knownTechniques: current.knownTechniques.filter((known) => known.techniqueId !== techniqueId) }))
    const setLevel = (techniqueId: string, level: TechniqueLevel) =>
        setCharacter((current) => ({
            ...current,
            knownTechniques: current.knownTechniques.map((known) => (known.techniqueId === techniqueId ? { ...known, level, training: { ...DEFAULT_TRAINING } } : known)),
        }))

    return (
        <div className="grid">
            <SectionCard title="Technique slots">
                {classLevels.length === 0 ? (
                    <p>Choose a class on the Class tab. Your bending and techniques come from your class.</p>
                ) : sources.length === 0 ? (
                    <p className="muted">Your classes give no technique slots.</p>
                ) : (
                    <table className="slot-table">
                        <thead>
                            <tr>
                                <th scope="col">From</th>
                                <th scope="col">Practiced</th>
                                <th scope="col">Trained</th>
                                <th scope="col">Mastered</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sources.map((source) => (
                                <tr key={source.label}>
                                    <th scope="row">{source.label}</th>
                                    <td>{source.practiced}</td>
                                    <td>{source.trained}</td>
                                    <td>{source.mastered}</td>
                                </tr>
                            ))}
                            {sources.length > 1 && (
                                <tr className="slot-total">
                                    <th scope="row">Total</th>
                                    <td>{total.practiced}</td>
                                    <td>{total.trained}</td>
                                    <td>{total.mastered}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                {pools.map(({ pool, max }) => (
                    <p key={pool.id}>
                        <strong>{pool.name}:</strong> {max}
                    </p>
                ))}
                <p className="muted">Slots at bending level {bendingLevel}. Slots return after a long rest.</p>
            </SectionCard>

            <SectionCard title="Techniques known">
                <ul className="stats">
                    {limits.map((entry) => (
                        <li key={entry.limit.id}>
                            <strong>{entry.limit.label}:</strong> {entry.used} of {entry.max}
                            {entry.used > entry.max && ' (over the limit for your level)'}
                        </li>
                    ))}
                    <li>
                        <strong>At each level:</strong> Practiced {knownAt('Practiced')} · Trained {knownAt('Trained')} · Mastered {knownAt('Mastered')}
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
                    {bendingLevel < 8 && <li className="muted">Rare techniques (marked *) unlock at level 8.</li>}
                </ul>
            </SectionCard>

            <TechniqueLibrary
                groups={groups}
                query={query}
                onQuery={setQuery}
                character={character}
                classLevels={classLevels}
                all={editableTechniques}
                disciplines={disciplines}
                extraLimits={extraLimits}
                capReached={capReached}
                onLearn={learn}
                onForget={forget}
                onSetLevel={setLevel}
            />
        </div>
    )
}
