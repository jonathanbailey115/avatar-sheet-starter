import { useMemo, useState } from 'react'
import { formatModifier } from '../engine/abilities'
import { computeSheet } from '../engine/sheet'
import type { Sheet, StatLine } from '../engine/sheet'
import type { RulesContent } from '../lib/normalize'
import { characterDisplayName } from '../lib/character'
import { AttackPanel } from '../play/AttackPanel'
import { DetailsPanel } from '../play/DetailsPanel'
import { HitPointSetup } from '../play/HitPointSetup'
import { HpPanel } from '../play/HpPanel'
import { PlayHeader } from '../play/PlayHeader'
import { RollToast } from '../play/RollToast'
import { elementTheme } from '../lib/element'
import { RestPanel } from '../play/RestPanel'
import { ResourcesPanel } from '../play/ResourcesPanel'
import { RollBadge } from '../play/RollBadge'
import { RollProvider, useRoll } from '../play/RollContext'
import { RollBar } from '../play/RollBar'
import { RollLog } from '../play/RollLog'
import { StatsPanel } from '../play/StatsPanel'
import { TechniquesPanel } from '../play/TechniquesPanel'
import { useActiveCharacter } from '../store/active'
import { useRulesContent } from '../store/rules'
import type { Character } from '../types/schema'
import { EmptyState } from '../components/EmptyState'

function explain(line: StatLine): string {
    return line.breakdown.map((part) => `${part.label} ${formatModifier(part.value)}`).join(', ')
}

type PlaySheetProps = {
    character: Character
    sheet: Sheet
    content: RulesContent
    change: (update: (current: Character) => Character) => void
    onEdit: () => void
}

/** On phones the sheet shows one of these at a time; on wider screens all of them, in columns. */
const PANES = [
    { id: 'stats', label: 'Stats' },
    { id: 'actions', label: 'Actions' },
    { id: 'techniques', label: 'Techniques' },
    { id: 'details', label: 'Details' },
] as const
type Pane = (typeof PANES)[number]['id']

function PlaySheet({ character, sheet, content, change, onEdit }: PlaySheetProps) {
    const { rollCheck } = useRoll()
    const [pane, setPane] = useState<Pane>('stats')

    const characterClass = content.classes.find((item) => item.id === character.classId)
    const lineage = content.lineages.find((item) => item.id === character.lineageId)
    const element = elementTheme(character, content.classes)
    const subclass = content.subclasses.find((item) => item.id === character.subclassId)
    const subtitle = [
        `Level ${character.level} ${characterClass?.name ?? 'No class'}`,
        subclass?.name,
        lineage?.name ?? character.nation,
    ]
        .filter(Boolean)
        .join(' · ')

    return (
        <section
            id="panel-play"
            role="tabpanel"
            className="tab-panel play-sheet"
            data-element={element}
            data-life={sheet.lifeState}
        >
            <PlayHeader
                name={characterDisplayName(character)}
                subtitle={subtitle}
                element={element}
                sheet={sheet}
                onEdit={onEdit}
            />

            {character.migrationNotes.length > 0 && (
                <p className="status-message">
                    This character needs attention: {character.migrationNotes.length} note
                    {character.migrationNotes.length === 1 ? '' : 's'} in the builder.
                </p>
            )}

            <RollBar characterId={character.id} />

            <div className="vitals-bar">
                <article className="vital" title={explain(sheet.armorClass)}>
                    <span>Armor Class</span>
                    <strong>{sheet.armorClass.total}</strong>
                    <small>{sheet.armor ? sheet.armor.name : 'Unarmored'}</small>
                </article>
                <button
                    type="button"
                    className="vital vital-roll"
                    title={`${explain(sheet.initiative)}. Click to roll.`}
                    onClick={(event) => rollCheck('Initiative', 'initiative', sheet.initiative, event)}
                >
                    <span>Initiative</span>
                    <strong>
                        {formatModifier(sheet.initiative.total)} <RollBadge roll={sheet.initiative.roll} />
                    </strong>
                </button>
                <article className="vital">
                    <span>Proficiency</span>
                    <strong>{formatModifier(sheet.proficiencyBonus)}</strong>
                </article>
                <article className="vital">
                    <span>Passive Perception</span>
                    <strong>{sheet.passives.perception}</strong>
                </article>
                <article className="vital">
                    <span>Passive Insight</span>
                    <strong>{sheet.passives.insight}</strong>
                </article>
                <article className="vital">
                    <span>Passive Investigation</span>
                    <strong>{sheet.passives.investigation}</strong>
                </article>
                <article className="vital">
                    <span>Exhaustion</span>
                    <div className="stepper">
                        <button
                            type="button"
                            aria-label="Reduce exhaustion"
                            disabled={character.exhaustion <= 0}
                            onClick={() => change((c) => ({ ...c, exhaustion: Math.max(0, c.exhaustion - 1) }))}
                        >
                            −
                        </button>
                        <strong>{character.exhaustion}</strong>
                        <button
                            type="button"
                            aria-label="Add exhaustion"
                            disabled={character.exhaustion >= 6}
                            onClick={() => change((c) => ({ ...c, exhaustion: Math.min(6, c.exhaustion + 1) }))}
                        >
                            +
                        </button>
                    </div>
                </article>
            </div>

            <nav className="pane-strip" aria-label="Sheet sections">
                {PANES.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        aria-pressed={pane === item.id}
                        className={pane === item.id ? 'pane-chip active' : 'pane-chip'}
                        onClick={() => setPane(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="play-grid" data-pane={pane}>
                <div className="play-col" data-pane="stats">
                    <StatsPanel sheet={sheet} />
                </div>

                <div className="play-col">
                    <div className="play-col" data-pane="actions">
                        <HpPanel character={character} sheet={sheet} onChange={change} />
                        <AttackPanel sheet={sheet} />
                    </div>
                    <div className="play-col" data-pane="techniques">
                        <TechniquesPanel
                            character={character}
                            sheet={sheet}
                            characterClass={characterClass}
                            techniques={content.techniques}
                            onChange={change}
                        />
                        <ResourcesPanel character={character} sheet={sheet} onChange={change} />
                    </div>
                    <div className="play-col" data-pane="actions">
                        <RestPanel character={character} sheet={sheet} content={content} onChange={change} />
                        <HitPointSetup character={character} sheet={sheet} onChange={change} />
                    </div>
                </div>

                <div className="play-col" data-pane="details">
                    <DetailsPanel
                        character={character}
                        sheet={sheet}
                        lineageProficiencies={{
                            armor: lineage?.armorProficiencies ?? [],
                            weapons: lineage?.weaponProficiencies ?? [],
                        }}
                    />
                    <RollLog />
                </div>
            </div>

            <RollToast characterId={character.id} />
        </section>
    )
}

export function PlayScreen({
    onEdit,
    onOpenLibrary,
}: {
    onEdit: () => void
    onOpenLibrary: () => void
}) {
    const { character, setCharacter } = useActiveCharacter()
    const content = useRulesContent()

    const sheet = useMemo(
        () => (character ? computeSheet(character, content) : null),
        [character, content],
    )

    if (!character || !sheet) {
        return (
            <section className="tab-panel">
                <EmptyState
                    title="No character is open"
                    action={
                        <button className="primary-button" type="button" onClick={onOpenLibrary}>
                            Go to My Characters
                        </button>
                    }
                >
                    Pick one from My Characters, or make a new one there.
                </EmptyState>
            </section>
        )
    }

    return (
        <RollProvider character={character} sheet={sheet} onChange={setCharacter}>
            <PlaySheet
                character={character}
                sheet={sheet}
                content={content}
                change={setCharacter}
                onEdit={onEdit}
            />
        </RollProvider>
    )
}
