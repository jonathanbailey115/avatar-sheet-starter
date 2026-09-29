import { useState } from 'react'
import type { SituationalOption } from '../engine/effects'

type SituationPromptProps = {
    title: string
    options: SituationalOption[]
    onRoll: (chosen: SituationalOption[]) => void
    onCancel: () => void
}

const KIND_LABEL = { advantage: 'Advantage', disadvantage: 'Disadvantage', bonus: 'Bonus' } as const

/** Asks which situational rules apply before a roll (e.g. "vs a creature that acts before you"). */
export function SituationPrompt({ title, options, onRoll, onCancel }: SituationPromptProps) {
    const [selected, setSelected] = useState<Set<number>>(new Set())

    const toggle = (index: number) =>
        setSelected((current) => {
            const next = new Set(current)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })

    return (
        <div className="modal-backdrop" role="presentation" onClick={onCancel}>
            <div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-label={`Roll ${title}`}
                onClick={(event) => event.stopPropagation()}
            >
                <h3>{title}</h3>
                <p className="muted">Which of these apply to this roll?</p>

                {options.map((option, index) => (
                    <label key={`${option.source}-${index}`} className="inline-check modal-option">
                        <input type="checkbox" checked={selected.has(index)} onChange={() => toggle(index)} />
                        <span>
                            <strong>{option.source}</strong>: {option.situation}
                            <small className="muted">
                                {' '}
                                ({KIND_LABEL[option.kind]}
                                {option.kind === 'bonus' ? ` ${option.value >= 0 ? '+' : ''}${option.value}` : ''})
                            </small>
                        </span>
                    </label>
                ))}

                <div className="actions inline-actions">
                    <button
                        className="primary-button"
                        type="button"
                        autoFocus
                        onClick={() => onRoll(options.filter((_, index) => selected.has(index)))}
                    >
                        Roll
                    </button>
                    <button className="secondary-button" type="button" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
