import { averageHitDieRoll } from '../engine/hitPoints'
import { rollDie } from '../engine/dice'
import { getAbilityModifier } from '../engine/abilities'
import { abilityScoresOf } from '../engine/abilityScores'
import type { Sheet } from '../engine/sheet'
import type { Character } from '../types/schema'

type HitPointSetupProps = {
    character: Character
    sheet: Sheet
    onChange: (update: (current: Character) => Character) => void
}

/** Level 1 is a full hit die. Each later level is the average or a roll, chosen by the player. */
export function HitPointSetup({ character, sheet, onChange }: HitPointSetupProps) {
    const { hitDie } = sheet
    const con = getAbilityModifier(abilityScoresOf(character).constitution)
    const levels = Array.from({ length: Math.max(0, character.level - 1) }, (_, i) => i + 2)

    const setRoll = (level: number, roll: number | null) =>
        onChange((current) => {
            const rolls = [...current.hpRolls]
            while (rolls.length < level - 1) rolls.push(null)
            rolls[level - 2] = roll
            return { ...current, hpRolls: rolls }
        })

    return (
        <details className="hp-setup">
            <summary>Hit point setup</summary>

            {hitDie ? (
                <>
                    <p>
                        Level 1: full d{hitDie} ({hitDie}) + Constitution ({con >= 0 ? `+${con}` : con}).
                    </p>

                    {levels.map((level) => {
                        const roll = character.hpRolls[level - 2] ?? null
                        return (
                            <div key={level} className="hp-level-row">
                                <span>Level {level}</span>
                                <select
                                    value={roll === null ? 'average' : 'rolled'}
                                    onChange={(event) =>
                                        setRoll(
                                            level,
                                            event.target.value === 'average' ? null : (roll ?? rollDie(hitDie)),
                                        )
                                    }
                                    aria-label={`Level ${level} hit points method`}
                                >
                                    <option value="average">Average ({averageHitDieRoll(hitDie)})</option>
                                    <option value="rolled">Rolled</option>
                                </select>
                                {roll !== null && (
                                    <>
                                        <strong>{roll}</strong>
                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={() => setRoll(level, rollDie(hitDie))}
                                        >
                                            Reroll
                                        </button>
                                    </>
                                )}
                            </div>
                        )
                    })}
                </>
            ) : (
                <p>Choose a lineage to get a hit die, or set Max HP below.</p>
            )}

            <div className="two-col">
                <label>
                    Max HP adjustment
                    <input
                        type="number"
                        value={character.maxHpAdjustment}
                        onChange={(event) =>
                            onChange((current) => ({
                                ...current,
                                maxHpAdjustment: Math.round(Number(event.target.value) || 0),
                            }))
                        }
                    />
                </label>
                <label>
                    Set Max HP (blank = calculated)
                    <input
                        type="number"
                        min={1}
                        value={character.maxHpOverride ?? ''}
                        onChange={(event) =>
                            onChange((current) => ({
                                ...current,
                                maxHpOverride:
                                    event.target.value === ''
                                        ? null
                                        : Math.max(1, Math.round(Number(event.target.value) || 1)),
                            }))
                        }
                    />
                </label>
            </div>
        </details>
    )
}
