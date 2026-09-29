import SectionCard from '../components/SectionCard'
import { ABILITY_ABBREVIATIONS, SKILLS, formatModifier } from '../engine/abilities'
import type { Sheet } from '../engine/sheet'
import type { StatLine } from '../engine/statLine'
import { RollBadge } from './RollBadge'
import { useRoll } from './RollContext'

function explain(line: StatLine): string {
    return `${line.breakdown
        .map((part) => `${part.label} ${formatModifier(part.value)}`)
        .join(', ')}. Click to roll.`
}

function Row({
    name,
    detail,
    line,
    proficient,
    onRoll,
}: {
    name: string
    detail?: string
    line: StatLine
    proficient?: boolean
    onRoll: (event: React.MouseEvent) => void
}) {
    return (
        <li>
            <button type="button" className="stat-row" title={explain(line)} onClick={onRoll}>
                <span
                    className={proficient ? 'prof-dot prof-dot-on' : 'prof-dot'}
                    aria-label={proficient ? 'Proficient' : 'Not proficient'}
                />
                <span className="stat-name">
                    {name}
                    {detail && <small className="muted"> {detail}</small>}
                </span>
                <RollBadge roll={line.roll} />
                <strong className="stat-total">{formatModifier(line.total)}</strong>
            </button>
        </li>
    )
}

export function StatsPanel({ sheet }: { sheet: Sheet }) {
    const { rollCheck } = useRoll()

    return (
        <>
            <SectionCard title="Abilities">
                <div className="ability-grid">
                    {sheet.abilities.map((ability) => {
                        const line = sheet.checks[ability.key]
                        const abbreviation = ABILITY_ABBREVIATIONS[ability.key]
                        return (
                            <button
                                key={ability.key}
                                type="button"
                                className="ability-tile"
                                title={explain(line)}
                                onClick={(event) => rollCheck(`${abbreviation} check`, 'check', line, event)}
                            >
                                <span>{abbreviation}</span>
                                <strong>{formatModifier(ability.modifier)}</strong>
                                <small>{ability.score}</small>
                                <RollBadge roll={line.roll} />
                            </button>
                        )
                    })}
                </div>
            </SectionCard>

            <SectionCard title="Saving Throws">
                <ul className="stat-list">
                    {sheet.abilities.map((ability) => {
                        const line = sheet.saves[ability.key]
                        const abbreviation = ABILITY_ABBREVIATIONS[ability.key]
                        return (
                            <Row
                                key={ability.key}
                                name={abbreviation}
                                line={line}
                                proficient={line.proficient}
                                onRoll={(event) => rollCheck(`${abbreviation} save`, 'save', line, event)}
                            />
                        )
                    })}
                </ul>
            </SectionCard>

            <SectionCard title="Skills">
                <ul className="stat-list">
                    {SKILLS.map((skill) => {
                        const line = sheet.skills[skill]
                        return (
                            <Row
                                key={skill}
                                name={skill}
                                detail={ABILITY_ABBREVIATIONS[line.ability]}
                                line={line}
                                proficient={line.proficient}
                                onRoll={(event) => rollCheck(`${skill} check`, 'check', line, event)}
                            />
                        )
                    })}
                </ul>
            </SectionCard>
        </>
    )
}
