import { useState } from 'react'
import { ConfirmButton } from '../components/ConfirmButton'
import { EmptyState } from '../components/EmptyState'
import SectionCard from '../components/SectionCard'
import { formatModifier } from '../engine/abilities'
import { ABILITY_ABBREVIATIONS } from '../engine/abilities'
import {
    damageDragon,
    dragonDefiance,
    healDragon,
    killDragon,
    newDragon,
    reviveDragon,
    setDragonTempHp,
} from '../engine/dragon'
import type { DragonAttack, DragonSheet } from '../engine/dragon'
import { spendResource } from '../engine/resources'
import type { Sheet } from '../engine/sheet'
import type { StatLine } from '../engine/statLine'
import type { Character } from '../types/schema'
import { useRoll } from './RollContext'

type DragonPanelProps = {
    character: Character
    sheet: Sheet
    onChange: (update: (current: Character) => Character) => void
}

const BREATH_ID = 'dragon-trainer:breath-uses'
const DICE_ID = 'dragon-trainer:training-dice'

/** A d20 line for the dragon: its to-hit bonus and where it comes from. */
const attackLine = (dragon: DragonSheet, attack: DragonAttack): StatLine => ({
    total: attack.toHit,
    breakdown: [
        { label: 'Your Wisdom modifier', value: dragon.wisdomModifier },
        { label: 'Your proficiency bonus', value: dragon.proficiencyBonus },
    ],
    roll: { advantage: [], disadvantage: [], net: 'normal', situational: [] },
})

/** The Dragon Trainer's companion: stat block, Hit Points, attacks, breath and Training Dice. */
export function DragonPanel({ character, sheet, onChange }: DragonPanelProps) {
    const { rollCheck, rollFormula } = useRoll()
    const [amount, setAmount] = useState('')
    const dragon = sheet.dragon
    if (!dragon) return null

    const value = Math.max(0, Math.floor(Number(amount) || 0))
    const breath = sheet.resources.find((item) => item.id === BREATH_ID)
    const dice = sheet.resources.find((item) => item.id === DICE_ID)
    const run = (update: (current: Character) => Character) => {
        onChange(update)
        setAmount('')
    }

    if (!dragon.ancestry) {
        return (
            <SectionCard title="Dragon companion">
                <EmptyState title="Choose your dragon's ancestry">
                    Open the character builder, Class tab, and pick the dragon it will be. It decides the dragon's damage type.
                </EmptyState>
            </SectionCard>
        )
    }

    const state = dragon.dead ? 'Dead' : dragon.unconscious ? 'Unconscious (death saves)' : ''

    return (
        <SectionCard title="Dragon companion">
            <p className="muted">
                {dragon.ancestry.name} · {dragon.size} {dragon.stage.toLowerCase()} · Technique DC {dragon.techniqueDc}
            </p>
            {state && <p className={dragon.dead ? 'life-state life-dead' : 'life-state life-dying'}>{state}</p>}

            <div className="stat-row">
                <span>
                    AC <b>{dragon.armorClass}</b>
                </span>
                <span>
                    HP{' '}
                    <b>
                        {dragon.currentHp} / {dragon.maxHp}
                    </b>
                    {dragon.tempHp > 0 && <small className="hp-temp"> +{dragon.tempHp} temp</small>}
                </span>
                <span>
                    Init <b>{formatModifier(dragon.initiative)}</b>
                </span>
                <span>
                    Speed <b>{dragon.speed}</b> / Fly <b>{dragon.flySpeed}</b>
                </span>
            </div>

            <div className="hp-controls">
                <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="Amount"
                    aria-label="Dragon hit point amount"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                />
                <button className="btn-damage" type="button" disabled={value === 0 || dragon.dead} onClick={() => run((c) => damageDragon(c, value, dragon.maxHp))}>
                    Damage
                </button>
                <button className="btn-heal" type="button" disabled={value === 0 || dragon.dead} onClick={() => run((c) => healDragon(c, value))}>
                    Heal
                </button>
                <button className="secondary-button" type="button" disabled={value === 0 || dragon.dead} onClick={() => run((c) => setDragonTempHp(c, value))}>
                    Temp HP
                </button>
            </div>

            <div className="actions inline-actions">
                {dragon.trainerLevel >= 13 && dragon.unconscious && (
                    <button className="secondary-button" type="button" onClick={() => onChange((c) => dragonDefiance(c, dragon.maxHp, dragon.trainerLevel))}>
                        Dragon's Defiance (1 HP, temp HP {dragon.trainerLevel})
                    </button>
                )}
                {!dragon.dead && (
                    <ConfirmButton className="secondary-button" question="Mark your dragon as dead?" onConfirm={() => onChange(killDragon)}>
                        Dragon died
                    </ConfirmButton>
                )}
                {dragon.dead && (
                    <>
                        <button className="secondary-button" type="button" onClick={() => onChange((c) => reviveDragon(c, dragon.maxHp))}>
                            Revive within 24 hours (half HP)
                        </button>
                        <ConfirmButton className="secondary-button" question="Bond with a new dragon? You choose its ancestry again." onConfirm={() => onChange(newDragon)}>
                            Bond with a new dragon
                        </ConfirmButton>
                    </>
                )}
            </div>

            <div className="ability-mini-grid">
                {dragon.abilities.map((ability) => (
                    <span key={ability.key} title={`${ABILITY_ABBREVIATIONS[ability.key]} ${ability.score}, save ${formatModifier(ability.save)} (Lifelong Bond adds your proficiency bonus)`}>
                        {ABILITY_ABBREVIATIONS[ability.key]} <b>{ability.score}</b> ({formatModifier(ability.modifier)}) save {formatModifier(ability.save)}
                    </span>
                ))}
            </div>
            <p className="muted">
                Immune to {dragon.ancestry.damageType} damage. Darkvision 60 ft. Common and Draconic.
            </p>

            <div className="detail-list">
                {dragon.attacks.map((attack) => (
                    <article key={attack.name} className="feature-item">
                        <strong>{attack.name}</strong> <small className="muted">melee, reach {attack.reach}</small>
                        <div className="technique-damage">
                            <button
                                className="btn-roll"
                                type="button"
                                disabled={dragon.dead || dragon.unconscious}
                                onClick={(event) => rollCheck(`Dragon ${attack.name}: to hit`, 'check', attackLine(dragon, attack), event)}
                            >
                                To hit {formatModifier(attack.toHit)}
                            </button>
                            <button
                                className="btn-roll"
                                type="button"
                                onClick={() => rollFormula(`Dragon ${attack.name}: damage`, attack.formula, { damageType: attack.damageType })}
                            >
                                Damage {attack.formula} {attack.damageType}
                            </button>
                            {attack.extra && (
                                <button
                                    className="btn-roll"
                                    type="button"
                                    onClick={() => rollFormula(`Dragon ${attack.name}: ${attack.extra!.damageType}`, attack.extra!.formula, { damageType: attack.extra!.damageType })}
                                >
                                    + {attack.extra.formula} {attack.extra.damageType}
                                </button>
                            )}
                        </div>
                        {attack.note && <small className="muted">{attack.note}</small>}
                    </article>
                ))}

                {dragon.breath && (
                    <article className="feature-item">
                        <strong>Dragon Breath</strong>{' '}
                        <small className="muted">
                            {dragon.breath.cone}-ft cone, Dexterity save DC {dragon.breath.dc}, half on a success
                            {breath ? ` · ${breath.remaining}/${breath.max} uses` : ''}
                        </small>
                        <div className="technique-damage">
                            <button
                                className="btn-roll"
                                type="button"
                                disabled={!breath || breath.remaining < 1 || dragon.dead || dragon.unconscious}
                                onClick={() => {
                                    if (breath) onChange((c) => spendResource(c, breath))
                                    rollFormula('Dragon Breath', dragon.breath!.formula, {
                                        damageType: dragon.breath!.damageType,
                                        notes: [`Dexterity save DC ${dragon.breath!.dc} for half. ${dragon.breath!.cone}-foot cone.`],
                                    })
                                }}
                            >
                                Breathe: {dragon.breath.formula} {dragon.breath.damageType}
                            </button>
                        </div>
                    </article>
                )}
            </div>

            {dragon.trainingDiceMax > 0 && (
                <p>
                    <strong>Training Dice:</strong> {dice ? `${dice.remaining}/${dice.max}` : dragon.trainingDiceMax} d{dragon.trainingDie}{' '}
                    <button
                        className="btn-roll"
                        type="button"
                        disabled={!dice || dice.remaining < 1}
                        onClick={() => {
                            if (dice) onChange((c) => spendResource(c, dice))
                            rollFormula('Training Die', `1d${dragon.trainingDie}`)
                        }}
                    >
                        Spend and roll a d{dragon.trainingDie}
                    </button>
                </p>
            )}
        </SectionCard>
    )
}
