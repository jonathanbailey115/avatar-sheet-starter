import { useMemo } from 'react'
import { formatModifier } from '../engine/abilities'
import { computeSheet } from '../engine/sheet'
import type { Sheet, StatLine } from '../engine/sheet'
import type { RulesContent } from '../lib/normalize'
import { characterDisplayName } from '../lib/character'
import { AttackPanel } from '../play/AttackPanel'
import { DetailsPanel } from '../play/DetailsPanel'
import { HitPointSetup } from '../play/HitPointSetup'
import { HpPanel } from '../play/HpPanel'
import { RestPanel } from '../play/RestPanel'
import { ResourcesPanel } from '../play/ResourcesPanel'
import { RollBadge } from '../play/RollBadge'
import { RollProvider, useRoll } from '../play/RollContext'
import { RollBar } from '../play/RollBar'
import { RollLog } from '../play/RollLog'
import { StatsPanel } from '../play/StatsPanel'
import { useActiveCharacter } from '../store/active'
import { useRulesContent } from '../store/rules'
import type { Character } from '../types/schema'

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

function PlaySheet({ character, sheet, content, change, onEdit }: PlaySheetProps) {
    const { rollCheck } = useRoll()

    const characterClass = content.classes.find((item) => item.id === character.classId)
    const lineage = content.lineages.find((item) => item.id === character.lineageId)

    return (
        <section id="panel-play" role="tabpanel" className="tab-panel play-sheet">
            <header className="play-header">
                <div>
                    <h2>{characterDisplayName(character)}</h2>
                    <p className="muted">
                        Level {character.level} · {characterClass?.name ?? 'No class'} ·{' '}
                        {lineage?.name ?? character.nation}
                    </p>
                </div>
                <button className="secondary-button" type="button" onClick={onEdit}>
                    Edit character
                </button>
            </header>

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

            <div className="play-grid">
                <div className="play-col">
                    <StatsPanel sheet={sheet} />
                </div>

                <div className="play-col">
                    <HpPanel character={character} sheet={sheet} onChange={change} />
                    <AttackPanel sheet={sheet} />
                    <ResourcesPanel character={character} sheet={sheet} onChange={change} />
                    <RestPanel character={character} sheet={sheet} content={content} onChange={change} />
                    <HitPointSetup character={character} sheet={sheet} onChange={change} />
                </div>

                <div className="play-col">
                    <DetailsPanel
                        character={character}
                        sheet={sheet}
                        techniques={content.techniques}
                        lineageProficiencies={{
                            armor: lineage?.armorProficiencies ?? [],
                            weapons: lineage?.weaponProficiencies ?? [],
                        }}
                    />
                    <RollLog />
                </div>
            </div>
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
                <p>No character is open.</p>
                <button className="primary-button" type="button" onClick={onOpenLibrary}>
                    Go to My Characters
                </button>
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
