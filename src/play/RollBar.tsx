import { useState } from 'react'
import type { FormEvent } from 'react'
import { useCampaignStore } from '../store/campaign'
import { useRollLog } from '../store/rollLog'
import type { RollMode } from '../engine/rolls'
import { RollResult } from './RollResult'
import { useRoll } from './RollContext'

const MODES: Array<{ mode: RollMode; label: string }> = [
    { mode: 'normal', label: 'Normal' },
    { mode: 'advantage', label: 'Advantage' },
    { mode: 'disadvantage', label: 'Disadvantage' },
]

/** The strip above the sheet: choose how the next roll is made, roll any dice, see the latest result. */
export function RollBar({ characterId }: { characterId: string }) {
    const { nextMode, setNextMode, rollCustom } = useRoll()
    const latest = useRollLog((state) => state.entries.find((entry) => entry.characterId === characterId))
    const [expression, setExpression] = useState('')
    const campaignId = useCampaignStore((state) => state.bindings[characterId])
    const campaignName = useCampaignStore((state) => state.campaigns.find((item) => item.id === campaignId)?.name)
    const privateRolls = useCampaignStore((state) => state.privateRolls)
    const setPrivateRolls = useCampaignStore((state) => state.setPrivateRolls)
    const [error, setError] = useState('')

    const submit = (event: FormEvent) => {
        event.preventDefault()
        if (rollCustom(expression)) {
            setExpression('')
            setError('')
        } else {
            setError('Use dice like 2d6+3 or d20.')
        }
    }

    return (
        <section className="roll-bar" aria-label="Rolling">
            <div className="roll-bar-controls">
                <div className="segmented" role="group" aria-label="How to make the next roll">
                    {MODES.map(({ mode, label }) => (
                        <button
                            key={mode}
                            type="button"
                            aria-pressed={nextMode === mode}
                            className={nextMode === mode ? `seg seg-on seg-${mode}` : 'seg'}
                            onClick={() => setNextMode(mode)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <form className="roll-custom" onSubmit={submit}>
                    <input
                        aria-label="Roll dice"
                        placeholder="Roll dice: 2d6+3"
                        value={expression}
                        onChange={(event) => setExpression(event.target.value)}
                    />
                    <button className="secondary-button" type="submit">
                        Roll
                    </button>
                </form>
            </div>

            {campaignId && (
                <div className="roll-share">
                    <span>
                        Sharing rolls with <strong>{campaignName ?? 'your campaign'}</strong>
                    </span>
                    <label className="inline-check">
                        <input
                            type="checkbox"
                            checked={privateRolls}
                            onChange={(event) => setPrivateRolls(event.target.checked)}
                        />
                        GM only
                    </label>
                </div>
            )}

            <p className="muted roll-hint">
                Click any modifier to roll it. Shift-click for advantage, Alt-click for disadvantage.
                {nextMode !== 'normal' && ` The next roll will be made with ${nextMode}.`}
                {error && <span className="roll-error"> {error}</span>}
            </p>

            <div className="latest-roll" aria-live="polite">
                {latest ? <RollResult entry={latest} /> : <p className="muted">No rolls yet.</p>}
            </div>
        </section>
    )
}
