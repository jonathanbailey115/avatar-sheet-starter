import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { ABILITIES, ABILITY_ABBREVIATIONS } from '../engine/abilities'
import {
    POINT_BUY_BUDGET,
    POINT_BUY_MIN,
    STANDARD_ARRAY,
    baseScoresOf,
    canStep,
    pointBuyTotal,
    rollScoreSet,
    unassigned,
} from '../engine/abilityScores'
import type { AbilityName, Character } from '../types/schema'

export type Method = 'manual' | 'array' | 'pointbuy' | 'roll'

const NAMES: Record<AbilityName, string> = {
    strength: 'Strength',
    dexterity: 'Dexterity',
    constitution: 'Constitution',
    intelligence: 'Intelligence',
    wisdom: 'Wisdom',
    charisma: 'Charisma',
}

interface Props {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
}

const setScores = (setCharacter: Props['setCharacter'], scores: Partial<Record<AbilityName, number>>) =>
    setCharacter((current) => ({ ...current, ...scores }))

/** Give each ability one value from a pool (the standard array, or six rolled scores). */
function PoolAssigner({ pool, character, setCharacter }: Props & { pool: number[] }) {
    // Which abilities have been given a value yet: tracked here, since 10 is also a normal score.
    const [given, setGiven] = useState<Record<AbilityName, boolean>>(
        () => Object.fromEntries(ABILITIES.map((ability) => [ability, false])) as Record<AbilityName, boolean>,
    )
    const scores = baseScoresOf(character)
    const held = ABILITIES.map((ability) => (given[ability] ? scores[ability] : null))
    const free = unassigned(pool, held)

    const assign = (ability: AbilityName, raw: string) => {
        if (raw === '') {
            setGiven({ ...given, [ability]: false })
            setScores(setCharacter, { [ability]: 10 })
            return
        }
        setGiven({ ...given, [ability]: true })
        setScores(setCharacter, { [ability]: Number(raw) })
    }

    return (
        <div>
            <p>
                Values to hand out: <strong>{pool.join(', ')}</strong>. Left to assign:{' '}
                <strong>{free.length === 0 ? 'none' : free.join(', ')}</strong>
            </p>
            <div className="ability-grid">
                {ABILITIES.map((ability) => {
                    const options = given[ability] ? [scores[ability], ...free].sort((a, b) => b - a) : free
                    return (
                        <label key={ability} className="ability-card">
                            {NAMES[ability]}
                            <select value={given[ability] ? String(scores[ability]) : ''} onChange={(event) => assign(ability, event.target.value)}>
                                <option value="">—</option>
                                {[...new Set(options)].map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )
                })}
            </div>
        </div>
    )
}

function StandardArray(props: Props) {
    return <PoolAssigner {...props} pool={STANDARD_ARRAY} />
}

function RolledScores(props: Props) {
    const [pool, setPool] = useState<number[] | null>(null)
    return (
        <div>
            <p>Roll 4d6 six times, dropping the lowest die each time, then hand the six results out to your abilities.</p>
            <button
                className="secondary-button"
                type="button"
                onClick={() => {
                    setPool(rollScoreSet())
                    setScores(props.setCharacter, { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 })
                }}
            >
                {pool ? 'Roll again (replaces these)' : 'Roll six scores'}
            </button>
            {pool && <PoolAssigner key={pool.join('-')} {...props} pool={pool} />}
        </div>
    )
}

function PointBuy({ character, setCharacter }: Props) {
    const scores = baseScoresOf(character)
    const total = pointBuyTotal(scores)
    const started = total !== null

    if (!started) {
        return (
            <div>
                <p>
                    Spend {POINT_BUY_BUDGET} points. Every score starts at {POINT_BUY_MIN} and can reach 15 before your species bonus.
                </p>
                <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                        setScores(setCharacter, { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 })
                    }
                >
                    Start point buy (sets every score to 8)
                </button>
            </div>
        )
    }

    return (
        <div>
            <p>
                Points left: <strong>{POINT_BUY_BUDGET - total}</strong> of {POINT_BUY_BUDGET}
            </p>
            <div className="ability-grid">
                {ABILITIES.map((ability) => (
                    <div key={ability} className="ability-card">
                        <p className="ability-short-label">{ABILITY_ABBREVIATIONS[ability]}</p>
                        <div className="actions inline-actions">
                            <button
                                className="secondary-button"
                                type="button"
                                aria-label={`Lower ${NAMES[ability]}`}
                                disabled={!canStep(scores, ability, -1)}
                                onClick={() => setScores(setCharacter, { [ability]: scores[ability] - 1 })}
                            >
                                −
                            </button>
                            <strong>{scores[ability]}</strong>
                            <button
                                className="secondary-button"
                                type="button"
                                aria-label={`Raise ${NAMES[ability]}`}
                                disabled={!canStep(scores, ability, 1)}
                                onClick={() => setScores(setCharacter, { [ability]: scores[ability] + 1 })}
                            >
                                +
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function Manual({ character, setCharacter }: Props) {
    const scores = baseScoresOf(character)
    return (
        <div className="ability-grid">
            {ABILITIES.map((ability) => (
                <label key={ability} className="ability-card">
                    {NAMES[ability]}
                    <input
                        type="number"
                        min={1}
                        max={30}
                        value={scores[ability]}
                        onChange={(event) => setScores(setCharacter, { [ability]: Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber })}
                    />
                </label>
            ))}
        </div>
    )
}

const METHODS: Array<{ id: Method; label: string }> = [
    { id: 'manual', label: 'Type them in' },
    { id: 'array', label: 'Standard array' },
    { id: 'pointbuy', label: 'Point buy' },
    { id: 'roll', label: 'Roll 4d6' },
]

export function AbilityMethods({ character, setCharacter }: Props) {
    const [method, setMethod] = useState<Method>('manual')

    return (
        <div>
            <div className="builder-tabs" role="tablist" aria-label="How to set ability scores">
                {METHODS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={method === item.id}
                        className={method === item.id ? 'active' : ''}
                        onClick={() => setMethod(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            {method === 'manual' && <Manual character={character} setCharacter={setCharacter} />}
            {method === 'array' && <StandardArray character={character} setCharacter={setCharacter} />}
            {method === 'pointbuy' && <PointBuy character={character} setCharacter={setCharacter} />}
            {method === 'roll' && <RolledScores character={character} setCharacter={setCharacter} />}
        </div>
    )
}
