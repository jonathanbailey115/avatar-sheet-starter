import { useState } from 'react'
import SectionCard from '../components/SectionCard'
import { formatModifier } from '../engine/abilities'
import { damageFormula } from '../engine/attacks'
import type { AttackOption } from '../engine/attacks'
import type { Sheet } from '../engine/sheet'
import { RollBadge } from './RollBadge'
import { useRoll } from './RollContext'

function explain(attack: AttackOption): string {
    return attack.attack.breakdown.map((part) => `${part.label} ${formatModifier(part.value)}`).join(', ')
}

function AttackRow({ attack }: { attack: AttackOption }) {
    const { rollAttack, rollDamage, lastAttack } = useRoll()
    const [criticalOverride, setCriticalOverride] = useState(false)
    const [twoHanded, setTwoHanded] = useState(false)

    const last = lastAttack(attack.id)
    const critical = criticalOverride || Boolean(last?.crit)
    const details = [attack.range && `Range ${attack.range}`, ...attack.properties].filter(Boolean).join(', ')

    return (
        <article className="attack-row">
            <div className="attack-title">
                <strong>{attack.name}</strong>
                <small className="muted">
                    {' '}
                    · {attack.source}
                    {!attack.proficient && ' · not proficient'}
                </small>
                {details && <div className="muted attack-details">{details}</div>}
                {attack.note && <div className="muted attack-details">{attack.note}</div>}
            </div>

            <div className="attack-buttons">
                <button
                    className="btn-roll"
                    type="button"
                    title={explain(attack)}
                    onClick={(event) => rollAttack(attack, event)}
                >
                    To hit {formatModifier(attack.attack.total)}
                    <RollBadge roll={attack.attack.roll} />
                </button>

                {attack.noDamage ? (
                    <small className="muted">No damage.</small>
                ) : (
                    <button
                        className={critical ? 'btn-roll btn-roll-crit' : 'btn-roll'}
                        type="button"
                        title={attack.damageBreakdown.map((part) => `${part.label} ${formatModifier(part.value)}`).join(', ')}
                        onClick={() => rollDamage(attack, { critical, twoHanded })}
                    >
                        {critical ? 'Critical damage' : 'Damage'} {damageFormula(attack, twoHanded)}
                    </button>
                )}
            </div>

            <div className="attack-options">
                {attack.versatileDice && (
                    <label className="inline-check">
                        <input
                            type="checkbox"
                            checked={twoHanded}
                            onChange={(event) => setTwoHanded(event.target.checked)}
                        />
                        Two-handed ({attack.versatileDice})
                    </label>
                )}
                <label className="inline-check">
                    <input
                        type="checkbox"
                        checked={criticalOverride}
                        onChange={(event) => setCriticalOverride(event.target.checked)}
                    />
                    Critical (auto-hit target)
                </label>
                {last?.crit && !criticalOverride && (
                    <span className="roll-tag roll-tag-crit">Last attack was a critical hit</span>
                )}
                {attack.critMin < 20 && (
                    <small className="muted">Crits on {attack.critMin}-20</small>
                )}
            </div>
        </article>
    )
}

export function AttackPanel({ sheet }: { sheet: Sheet }) {
    const { bending, attacks } = sheet

    return (
        <SectionCard title="Attacks">
            {bending && (
                <div className="bending-summary">
                    <div>
                        <span>Bending ability</span>
                        <strong>{bending.ability[0].toUpperCase() + bending.ability.slice(1)}</strong>
                    </div>
                    <div>
                        <span>Save DC</span>
                        <strong>{bending.saveDc}</strong>
                    </div>
                    <div>
                        <span>Attack modifier</span>
                        <strong>{formatModifier(bending.attackModifier)}</strong>
                    </div>
                </div>
            )}

            {attacks.map((attack) => (
                <AttackRow key={attack.id} attack={attack} />
            ))}

            {attacks.length === 1 && (
                <p className="muted">Add weapons on the Equipment tab to attack with them.</p>
            )}
        </SectionCard>
    )
}
