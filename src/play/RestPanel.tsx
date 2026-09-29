import { useState } from 'react'
import SectionCard from '../components/SectionCard'
import { longRest, shortRest } from '../engine/rests'
import type { Sheet } from '../engine/sheet'
import type { RulesContent } from '../lib/normalize'
import type { Character } from '../types/schema'
import { useRoll } from './RollContext'

type RestPanelProps = {
    character: Character
    sheet: Sheet
    content: RulesContent
    onChange: (update: (current: Character) => Character) => void
}

export function RestPanel({ character, sheet, content, onChange }: RestPanelProps) {
    const [open, setOpen] = useState(false)
    const [spend, setSpend] = useState(0)
    const [message, setMessage] = useState('')
    const { logEntry } = useRoll()

    const dead = sheet.lifeState === 'dead'
    const canSpend = sheet.hitDie !== null && sheet.hitDiceRemaining > 0

    const takeShortRest = () => {
        // Roll once against the current sheet, then apply the result, so the message matches.
        const result = shortRest(character, content, { spendHitDice: spend })
        onChange(() => result.character)

        const con = Math.floor((character.constitution - 10) / 2)
        if (result.rolls.length > 0 && sheet.hitDie) {
            logEntry({
                kind: 'hit-die',
                label: 'Short rest hit dice',
                formula: `${result.rolls.length}d${sheet.hitDie}${con === 0 ? '' : con > 0 ? `+${con * result.rolls.length}` : con * result.rolls.length}`,
                dice: result.rolls,
                discarded: [],
                modifier: con * result.rolls.length,
                total: result.healed,
                mode: 'normal',
                notes: ['Each die heals its roll plus Constitution, never below 0.'],
            })
        }
        setMessage(
            result.rolls.length > 0
                ? `Short rest: spent ${result.rolls.length} hit dice (rolled ${result.rolls.join(', ')}, ${con >= 0 ? '+' : ''}${con} each) and healed ${result.healed}.`
                : 'Short rest taken. Short-rest features recharged.',
        )
        setOpen(false)
        setSpend(0)
    }

    const takeLongRest = () => {
        if (!window.confirm('Take a long rest? This restores HP, hit dice, and long-rest features.')) return
        onChange((current) => longRest(current, content))
        setMessage('Long rest taken. HP, resources and half your hit dice restored.')
        setOpen(false)
    }

    return (
        <SectionCard title="Rest">
            <div className="actions inline-actions">
                <button className="secondary-button" type="button" disabled={dead} onClick={() => setOpen(!open)}>
                    Short Rest
                </button>
                <button className="secondary-button" type="button" disabled={dead} onClick={takeLongRest}>
                    Long Rest
                </button>
            </div>

            <p className="muted">
                Hit dice: {sheet.hitDiceRemaining} / {sheet.hitDiceTotal}
                {sheet.hitDie ? ` (d${sheet.hitDie})` : ''}
            </p>

            {open && (
                <div className="short-rest-box">
                    {canSpend ? (
                        <label>
                            Hit dice to spend (each heals d{sheet.hitDie} + Con)
                            <input
                                type="number"
                                min={0}
                                max={sheet.hitDiceRemaining}
                                value={spend}
                                onChange={(event) =>
                                    setSpend(
                                        Math.min(
                                            sheet.hitDiceRemaining,
                                            Math.max(0, Math.floor(Number(event.target.value) || 0)),
                                        ),
                                    )
                                }
                            />
                        </label>
                    ) : (
                        <p>No hit dice to spend.</p>
                    )}
                    <div className="actions inline-actions">
                        <button className="primary-button" type="button" onClick={takeShortRest}>
                            Take short rest
                        </button>
                        <button className="secondary-button" type="button" onClick={() => setOpen(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {message && (
                <p className="status-message" role="status">
                    {message}
                </p>
            )}
        </SectionCard>
    )
}
