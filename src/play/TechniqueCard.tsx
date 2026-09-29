import { ConfirmButton } from '../components/ConfirmButton'
import { useState } from 'react'
import { applyCast, describePlan, planCast } from '../engine/casting'
import { castLevels, damageOptions, saveSummary, textAtLevel } from '../engine/techniques'
import type { DamageOption } from '../engine/techniques'
import { canStartTraining, startTraining, stopTraining, TRAINING_POINTS_NEEDED } from '../engine/training'
import type { Sheet } from '../engine/sheet'
import type { Character, KnownTechnique, Technique, TechniqueLevel } from '../types/schema'
import { useRoll } from './RollContext'

type TechniqueCardProps = {
    character: Character
    sheet: Sheet
    technique: Technique
    known: KnownTechnique
    onChange: (update: (current: Character) => Character) => void
}

const ON_SAVE_TEXT: Record<DamageOption['onSave'], string> = {
    half: 'Half damage on a successful save.',
    negates: 'No damage on a successful save.',
    unaffected: 'The save does not change this.',
}

export function TechniqueCard({ character, sheet, technique, known, onChange }: TechniqueCardProps) {
    const { logEntry, rollFormula, rollTraining } = useRoll()
    const [castLevel, setCastLevel] = useState<TechniqueLevel>(known.level)
    const [masterTaught, setMasterTaught] = useState(false)

    // The chosen cast level can never fall below the level the technique is known at.
    const options = castLevels(known.level)
    const level = options.includes(castLevel) ? castLevel : known.level

    const plan = planCast(character, sheet.resources, technique, level)
    const isFighting = technique.element === 'Fighting'
    const bending = sheet.bending
    const damage = damageOptions(technique, level, bending?.modifier ?? 0)
    const saveText = saveSummary(technique)
    const trainingBlocker = canStartTraining(character, known)

    const setKnown = (change: (current: KnownTechnique) => KnownTechnique) =>
        onChange((current) => ({
            ...current,
            knownTechniques: current.knownTechniques.map((item) =>
                item.techniqueId === known.techniqueId ? change(item) : item,
            ),
        }))

    const cast = () => {
        if (!plan) return
        onChange((current) => applyCast(current, sheet.resources, plan, level))
        logEntry({
            kind: 'technique',
            label: `Cast ${technique.name} at ${level}`,
            formula: '',
            dice: [],
            discarded: [],
            modifier: 0,
            total: 0,
            mode: 'normal',
            notes: [
                plan.kind === 'free' ? 'No slots spent.' : `Spent ${describePlan(plan)}.`,
                ...(saveText && bending ? [`Save: ${saveText}. DC ${bending.saveDc}.`] : []),
            ],
        })
    }

    return (
        <details className="feature-item technique-card">
            <summary>
                <strong>{technique.name}</strong>
                <small className="muted">
                    {' '}
                    · {known.level}
                    {technique.rare ? ' · Rare' : ''}
                    {technique.castingTime ? ` · ${technique.castingTime}` : ''}
                </small>
                {known.training.active && <span className="roll-tag roll-tag-crit">TRAINING</span>}
            </summary>

            <p className="technique-text">{textAtLevel(technique, known.level)}</p>
            {(technique.range || technique.duration) && (
                <p className="muted technique-meta">
                    {[technique.range, technique.components && `Components ${technique.components}`, technique.duration]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
            )}

            {!isFighting && (
                <div className="technique-cast">
                    <label className="technique-cast-level">
                        Cast at
                        <select value={level} onChange={(event) => setCastLevel(event.target.value as TechniqueLevel)}>
                            {options.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                    {option !== known.level ? ' (upcast)' : ''}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        className="btn-roll"
                        type="button"
                        disabled={!plan}
                        title={plan ? `Costs ${describePlan(plan)}` : 'Not enough slots'}
                        onClick={cast}
                    >
                        Cast {plan && plan.kind !== 'free' ? `(${describePlan(plan)})` : ''}
                    </button>
                </div>
            )}

            {saveText && bending && (
                <p className="technique-save">
                    <strong>Save DC {bending.saveDc}</strong> · {saveText}
                </p>
            )}
            {technique.mechanicsNote && <p className="muted">{technique.mechanicsNote}</p>}

            {damage.length > 0 && (
                <div className="technique-damage">
                    {damage.map((option) => (
                        <button
                            key={`${option.label}-${option.formula}`}
                            className="btn-roll"
                            type="button"
                            title={ON_SAVE_TEXT[option.onSave]}
                            onClick={() =>
                                rollFormula(`${technique.name}: ${option.label} (${level})`, option.formula, {
                                    damageType: option.type,
                                    notes: saveText ? [ON_SAVE_TEXT[option.onSave]] : [],
                                })
                            }
                        >
                            {option.label} {option.formula}
                            {option.type ? ` ${option.type}` : ''}
                        </button>
                    ))}
                </div>
            )}

            {bending && known.level !== 'Mastered' && (
                <div className="technique-training">
                    {!known.training.active ? (
                        <button
                            className="secondary-button"
                            type="button"
                            disabled={trainingBlocker !== null}
                            title={trainingBlocker ?? 'Start training this technique'}
                            onClick={() => setKnown(startTraining)}
                        >
                            Train this technique
                        </button>
                    ) : (
                        <>
                            {known.level === 'Practiced' ? (
                                <>
                                    <div className="pip-row" aria-label={`Training points ${known.training.points} of ${TRAINING_POINTS_NEEDED}`}>
                                        {Array.from({ length: TRAINING_POINTS_NEEDED }, (_, index) => (
                                            <span
                                                key={index}
                                                className={index < known.training.points ? 'pip pip-on' : 'pip'}
                                            />
                                        ))}
                                    </div>
                                    <button
                                        className="btn-roll"
                                        type="button"
                                        onClick={() => rollTraining(known.techniqueId, technique.name, 'training')}
                                    >
                                        Training check (DC {known.training.dc})
                                    </button>
                                </>
                            ) : (
                                <>
                                    <label className="inline-check">
                                        <input
                                            type="checkbox"
                                            checked={masterTaught}
                                            onChange={(event) => setMasterTaught(event.target.checked)}
                                        />
                                        A master has finished teaching me
                                    </label>
                                    <button
                                        className="btn-roll"
                                        type="button"
                                        disabled={!masterTaught}
                                        onClick={() => rollTraining(known.techniqueId, technique.name, 'mastery')}
                                    >
                                        Attempt mastery (DC {known.training.masteryDc})
                                    </button>
                                </>
                            )}
                            <ConfirmButton
                                className="link-button"
                                question="Stop training? You lose your progress."
                                onConfirm={() => setKnown(stopTraining)}
                            >
                                Stop training
                            </ConfirmButton>
                        </>
                    )}
                </div>
            )}
        </details>
    )
}
