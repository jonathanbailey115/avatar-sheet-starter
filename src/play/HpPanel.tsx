import { useState } from 'react'
import SectionCard from '../components/SectionCard'
import {
    applyDamage,
    applyHealing,
    recordDeathSave,
    resetDeathSaves,
    reviveWithOneHp,
    setTempHp,
} from '../engine/hitPoints'
import type { Sheet } from '../engine/sheet'
import type { Character } from '../types/schema'

type HpPanelProps = {
    character: Character
    sheet: Sheet
    onChange: (update: (current: Character) => Character) => void
}

function healthClass(current: number, max: number): string {
    if (max <= 0) return 'hp-bar-fill'
    const ratio = current / max
    if (ratio > 0.5) return 'hp-bar-fill hp-healthy'
    if (ratio > 0.25) return 'hp-bar-fill hp-hurt'
    return 'hp-bar-fill hp-critical'
}

const LIFE_LABEL = {
    conscious: '',
    dying: 'Unconscious and dying. Make death saving throws.',
    stable: 'Stable at 0 HP. Unconscious until healed.',
    dead: 'Dead. Gmbinder allows no mortal resurrection.',
} as const

export function HpPanel({ character, sheet, onChange }: HpPanelProps) {
    const [amount, setAmount] = useState('')
    const [critical, setCritical] = useState(false)

    const value = Math.max(0, Math.floor(Number(amount) || 0))
    const { maxHp, currentHp, lifeState } = sheet
    const percent = maxHp > 0 ? Math.round((currentHp / maxHp) * 100) : 0
    const noMax = maxHp <= 0
    const dead = lifeState === 'dead'

    const run = (update: (current: Character) => Character) => {
        onChange(update)
        setAmount('')
        setCritical(false)
    }

    return (
        <SectionCard title="Hit Points">
            <div className="hp-readout" aria-live="polite">
                <span className="hp-current">{currentHp}</span>
                <span className="hp-max"> / {maxHp}</span>
                {character.tempHp > 0 && <span className="hp-temp">+{character.tempHp} temp</span>}
            </div>

            <div
                className="hp-bar"
                role="progressbar"
                aria-label="Hit points"
                aria-valuemin={0}
                aria-valuemax={maxHp}
                aria-valuenow={currentHp}
            >
                <div className={healthClass(currentHp, maxHp)} style={{ width: `${percent}%` }} />
            </div>

            {noMax && (
                <p className="status-message">
                    Max HP is unknown. Choose a lineage in the builder, or set Max HP under Hit
                    point setup.
                </p>
            )}
            {LIFE_LABEL[lifeState] && <p className={`life-state life-${lifeState}`}>{LIFE_LABEL[lifeState]}</p>}

            <div className="hp-controls">
                <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    aria-label="Amount"
                    placeholder="Amount"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                />
                <button
                    className="btn-damage"
                    type="button"
                    disabled={noMax || dead || value === 0}
                    onClick={() => run((c) => applyDamage(c, value, maxHp, { critical }))}
                >
                    Damage
                </button>
                <button
                    className="btn-heal"
                    type="button"
                    disabled={noMax || dead || value === 0}
                    onClick={() => run((c) => applyHealing(c, value, maxHp))}
                >
                    Heal
                </button>
                <button
                    className="secondary-button"
                    type="button"
                    disabled={dead || value === 0}
                    title="Temp HP do not stack: only a higher amount replaces the current temp HP."
                    onClick={() => run((c) => setTempHp(c, value))}
                >
                    Temp HP
                </button>
            </div>

            <label className="inline-check">
                <input
                    type="checkbox"
                    checked={critical}
                    onChange={(event) => setCritical(event.target.checked)}
                />
                Critical hit (counts as 2 death save failures at 0 HP)
            </label>

            {(lifeState === 'dying' || lifeState === 'stable' || character.deathSaves.failures > 0) && (
                <div className="death-saves">
                    <h3>Death saves</h3>
                    <div className="death-row">
                        <span>Successes</span>
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className={i < character.deathSaves.successes ? 'pip pip-on pip-good' : 'pip'}
                            />
                        ))}
                    </div>
                    <div className="death-row">
                        <span>Failures</span>
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className={i < character.deathSaves.failures ? 'pip pip-on pip-bad' : 'pip'}
                            />
                        ))}
                    </div>

                    {lifeState === 'dying' && (
                        <div className="actions inline-actions">
                            <button
                                className="btn-heal"
                                type="button"
                                onClick={() => onChange((c) => recordDeathSave(c, 'success', maxHp))}
                            >
                                Success
                            </button>
                            <button
                                className="btn-damage"
                                type="button"
                                onClick={() => onChange((c) => recordDeathSave(c, 'failure', maxHp))}
                            >
                                Failure
                            </button>
                            <button
                                className="secondary-button"
                                type="button"
                                onClick={() => onChange((c) => reviveWithOneHp(c, maxHp))}
                            >
                                Natural 20 (1 HP)
                            </button>
                        </div>
                    )}
                    {lifeState !== 'dead' && (
                        <button
                            className="link-button"
                            type="button"
                            onClick={() => onChange((c) => resetDeathSaves(c))}
                        >
                            Clear death saves
                        </button>
                    )}
                </div>
            )}
        </SectionCard>
    )
}
