import type { RollEntry } from '../engine/rolls'

/** One roll, shown the same way in the "latest roll" banner and in the log. */
export function RollResult({ entry, showWho = false }: { entry: RollEntry; showWho?: boolean }) {
    const className = [
        'roll-result',
        entry.crit || entry.critical ? 'roll-crit' : '',
        entry.fumble ? 'roll-fumble' : '',
    ].join(' ')

    const modifier = entry.modifier === 0 ? '' : entry.modifier > 0 ? ` + ${entry.modifier}` : ` − ${Math.abs(entry.modifier)}`

    return (
        <article className={className}>
            <div className="roll-result-head">
                <strong>{entry.label}</strong>
                {showWho && <small className="muted"> · {entry.characterName}</small>}
                {entry.mode === 'advantage' && <span className="roll-badge roll-badge-adv">A</span>}
                {entry.mode === 'disadvantage' && <span className="roll-badge roll-badge-dis">D</span>}
                {entry.kind === 'attack' && entry.crit && <span className="roll-tag roll-tag-crit">CRIT</span>}
                {entry.kind === 'damage' && entry.critical && <span className="roll-tag roll-tag-crit">CRIT</span>}
                {entry.fumble && entry.kind !== 'damage' && <span className="roll-tag roll-tag-fumble">NAT 1</span>}
                {entry.kind === 'death-save' && entry.crit && <span className="roll-tag roll-tag-crit">NAT 20</span>}
            </div>

            <div className="roll-result-body" hidden={entry.kind === 'technique'}>
                <span className="roll-total" aria-label={`Total ${entry.total}`}>
                    {entry.total}
                </span>
                <span className="roll-detail">
                    {entry.dice.map((die, index) => (
                        <span key={index} className="die">
                            {die}
                        </span>
                    ))}
                    {entry.discarded.map((die, index) => (
                        <span key={`dropped-${index}`} className="die die-dropped" title="Dropped die">
                            {die}
                        </span>
                    ))}
                    {modifier}
                    {entry.damageType ? <em> {entry.damageType}</em> : null}
                </span>
                <small className="muted roll-formula">{entry.formula}</small>
            </div>

            {entry.notes.length > 0 && (
                <ul className="roll-notes">
                    {entry.notes.map((note) => (
                        <li key={note}>{note}</li>
                    ))}
                </ul>
            )}
        </article>
    )
}
