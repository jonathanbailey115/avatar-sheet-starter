import { useState } from 'react'
import type { FormEvent } from 'react'
import { newRollId, parseExpression, rollExpression } from '../engine/rolls'
import type { RollEntry } from '../engine/rolls'
import { RollResult } from '../play/RollResult'
import type { CampaignRoll } from './types'

type CampaignLogProps = {
    rolls: CampaignRoll[]
    isGm: boolean
    myName: string
    privateRolls: boolean
    onClear: () => void
    onRoll: (entry: RollEntry) => void
}

/** The shared game log: every roll from every player, live. */
export function CampaignLog({ rolls, isGm, myName, privateRolls, onClear, onRoll }: CampaignLogProps) {
    const [expression, setExpression] = useState('')
    const [error, setError] = useState('')

    const submit = (event: FormEvent) => {
        event.preventDefault()
        const parsed = parseExpression(expression)
        const result = parsed ? rollExpression(parsed) : null
        if (!result) {
            setError('Use dice like 2d6+3 or d20.')
            return
        }
        setError('')
        setExpression('')
        onRoll({
            id: newRollId(),
            at: Date.now(),
            characterId: null,
            characterName: myName || 'Table',
            kind: 'custom',
            label: isGm ? 'GM roll' : 'Table roll',
            formula: result.formula,
            dice: result.dice,
            discarded: [],
            modifier: result.flat,
            total: result.total,
            mode: 'normal',
            notes: privateRolls ? ['Only the GM sees this roll.'] : [],
        })
    }

    return (
        <div className="campaign-log">
            <form className="roll-custom" onSubmit={submit}>
                <input
                    aria-label="Roll dice for the table"
                    placeholder={isGm ? 'GM roll: 2d6+3' : 'Roll dice: 2d6+3'}
                    value={expression}
                    onChange={(event) => setExpression(event.target.value)}
                />
                <button className="secondary-button" type="submit">
                    Roll
                </button>
                {isGm && (
                    <button
                        className="link-button"
                        type="button"
                        disabled={rolls.length === 0}
                        onClick={() => {
                            if (window.confirm('Clear the campaign log for everyone?')) onClear()
                        }}
                    >
                        Clear log
                    </button>
                )}
            </form>
            {error && <p className="roll-error">{error}</p>}

            {rolls.length === 0 ? (
                <p className="muted">No rolls yet. Rolls from every player appear here as they happen.</p>
            ) : (
                <div className="roll-log">
                    {rolls.map((roll) => (
                        <RollResult key={roll.id} entry={roll.entry} who={roll.displayName} gmOnly={roll.visibility === 'gm'} />
                    ))}
                </div>
            )}
        </div>
    )
}
