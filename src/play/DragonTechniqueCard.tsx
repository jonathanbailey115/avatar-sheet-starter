import { spendResource } from '../engine/resources'
import type { Sheet } from '../engine/sheet'
import type { Character, Technique } from '../types/schema'
import { useRoll } from './RollContext'

type Props = {
    character: Character
    sheet: Sheet
    technique: Technique
    onChange: (update: (current: Character) => Character) => void
}

/** A Dragon Technique: one level, paid for with a Training Die instead of a slot. */
export function DragonTechniqueCard({ sheet, technique, onChange }: Props) {
    const { rollFormula } = useRoll()
    const dice = sheet.resources.find((item) => item.id === 'dragon-trainer:training-dice')
    const die = sheet.dragon?.trainingDie ?? 8
    const dc = sheet.dragon?.techniqueDc

    return (
        <details className="feature-item technique-card">
            <summary>
                <span className="technique-head">
                    <strong className="technique-name">{technique.name}</strong>
                    <span className="source-tag">Dragon</span>
                </span>
                {technique.castingTime && <small className="muted technique-time">{technique.castingTime}</small>}
            </summary>
            <p className="technique-text">{technique.description}</p>
            {dc !== undefined && <p className="technique-save">Dragon Technique DC {dc}</p>}
            <div className="technique-cast">
                <button
                    className="btn-roll"
                    type="button"
                    disabled={!dice || dice.remaining < 1}
                    title={dice && dice.remaining < 1 ? 'No Training Dice left' : 'Spend a Training Die and roll it'}
                    onClick={() => {
                        if (dice) onChange((current) => spendResource(current, dice))
                        rollFormula(`${technique.name} (Training Die)`, `1d${die}`)
                    }}
                >
                    Spend a d{die}
                </button>
            </div>
        </details>
    )
}
