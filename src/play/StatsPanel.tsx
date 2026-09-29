import SectionCard from '../components/SectionCard'
import { ABILITY_ABBREVIATIONS, SKILLS, formatModifier } from '../engine/abilities'
import type { StatLine, Sheet } from '../engine/sheet'
import { RollBadge } from './RollBadge'

function explain(line: StatLine): string {
    return line.breakdown
        .map((part) => `${part.label} ${formatModifier(part.value)}`)
        .join(', ')
}

function Row({
    name,
    detail,
    line,
    proficient,
}: {
    name: string
    detail?: string
    line: StatLine
    proficient?: boolean
}) {
    return (
        <li className="stat-row" title={explain(line)}>
            <span className={proficient ? 'prof-dot prof-dot-on' : 'prof-dot'} aria-label={proficient ? 'Proficient' : 'Not proficient'} />
            <span className="stat-name">
                {name}
                {detail && <small className="muted"> {detail}</small>}
            </span>
            <RollBadge roll={line.roll} />
            <strong className="stat-total">{formatModifier(line.total)}</strong>
        </li>
    )
}

export function StatsPanel({ sheet }: { sheet: Sheet }) {
    return (
        <>
            <SectionCard title="Abilities">
                <div className="ability-grid">
                    {sheet.abilities.map((ability) => (
                        <article key={ability.key} className="ability-tile">
                            <span>{ABILITY_ABBREVIATIONS[ability.key]}</span>
                            <strong>{formatModifier(ability.modifier)}</strong>
                            <small>{ability.score}</small>
                        </article>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Saving Throws">
                <ul className="stat-list">
                    {sheet.abilities.map((ability) => (
                        <Row
                            key={ability.key}
                            name={ABILITY_ABBREVIATIONS[ability.key]}
                            line={sheet.saves[ability.key]}
                            proficient={sheet.saves[ability.key].proficient}
                        />
                    ))}
                </ul>
            </SectionCard>

            <SectionCard title="Skills">
                <ul className="stat-list">
                    {SKILLS.map((skill) => (
                        <Row
                            key={skill}
                            name={skill}
                            detail={ABILITY_ABBREVIATIONS[sheet.skills[skill].ability]}
                            line={sheet.skills[skill]}
                            proficient={sheet.skills[skill].proficient}
                        />
                    ))}
                </ul>
            </SectionCard>
        </>
    )
}
