import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { damageFormula } from '../engine/attacks'
import type { AttackOption } from '../engine/attacks'
import { recordDeathSave, reviveWithOneHp } from '../engine/hitPoints'
import { deathSaveOutcome, newRollId, parseExpression, rollD20, rollExpression } from '../engine/rolls'
import type { RollEntry, RollKind, RollMode } from '../engine/rolls'
import type { SituationalOption } from '../engine/effects'
import type { Sheet } from '../engine/sheet'
import type { StatLine } from '../engine/statLine'
import { useRollLog } from '../store/rollLog'
import type { Character } from '../types/schema'
import { SituationPrompt } from './SituationPrompt'

type CheckKind = Extract<RollKind, 'check' | 'save' | 'initiative'>

interface PendingRoll {
    label: string
    kind: CheckKind | 'attack'
    line: StatLine
    forced: RollMode
    attack?: AttackOption
}

export interface RollApi {
    /** Applies to the next roll only, then resets. */
    nextMode: RollMode
    setNextMode: (mode: RollMode) => void
    rollCheck: (label: string, kind: CheckKind, line: StatLine, event?: MouseEvent) => void
    rollAttack: (attack: AttackOption, event?: MouseEvent) => void
    rollDamage: (attack: AttackOption, options: { critical: boolean; twoHanded: boolean }) => void
    rollDeathSave: () => void
    rollCustom: (expression: string) => boolean
    logEntry: (entry: Omit<RollEntry, 'id' | 'at' | 'characterId' | 'characterName'>) => void
    /** The attack roll still waiting for its damage roll (so damage knows if it was a critical). */
    lastAttack: (attackId: string) => RollEntry | undefined
}

const RollContext = createContext<RollApi | null>(null)

export function useRoll(): RollApi {
    const api = useContext(RollContext)
    if (!api) throw new Error('useRoll must be used inside RollProvider')
    return api
}

function modeFromEvent(event?: MouseEvent): RollMode {
    if (event?.shiftKey) return 'advantage'
    if (event?.altKey || event?.ctrlKey) return 'disadvantage'
    return 'normal'
}

type RollProviderProps = {
    character: Character
    sheet: Sheet
    onChange: (update: (current: Character) => Character) => void
    children: ReactNode
}

export function RollProvider({ character, sheet, onChange, children }: RollProviderProps) {
    const entries = useRollLog((state) => state.entries)
    const add = useRollLog((state) => state.add)
    const [nextMode, setNextMode] = useState<RollMode>('normal')
    const [pending, setPending] = useState<PendingRoll | null>(null)

    const log = useCallback(
        (entry: Omit<RollEntry, 'id' | 'at' | 'characterId' | 'characterName'>) => {
            add({
                ...entry,
                id: newRollId(),
                at: Date.now(),
                characterId: character.id,
                characterName: character.name.trim() || 'Unnamed character',
            })
        },
        [add, character.id, character.name],
    )

    /** Roll a d20 with everything known: automatic sources, forced mode, and confirmed situations. */
    const executeD20 = useCallback(
        (roll: PendingRoll, chosen: SituationalOption[]) => {
            const advantage = [
                ...roll.line.roll.advantage,
                ...chosen.filter((option) => option.kind === 'advantage').map((option) => option.source),
                ...(roll.forced === 'advantage' ? ['Chosen when rolling'] : []),
            ]
            const disadvantage = [
                ...roll.line.roll.disadvantage,
                ...chosen.filter((option) => option.kind === 'disadvantage').map((option) => option.source),
                ...(roll.forced === 'disadvantage' ? ['Chosen when rolling'] : []),
            ]
            const bonuses = chosen.filter((option) => option.kind === 'bonus')
            const modifier = roll.line.total + bonuses.reduce((sum, option) => sum + option.value, 0)

            const mode: RollMode =
                advantage.length > 0 && disadvantage.length === 0
                    ? 'advantage'
                    : disadvantage.length > 0 && advantage.length === 0
                      ? 'disadvantage'
                      : 'normal'

            const result = rollD20({ modifier, mode, critMin: roll.attack?.critMin ?? 20 })
            const notes = [
                ...advantage.map((source) => `Advantage: ${source}`),
                ...disadvantage.map((source) => `Disadvantage: ${source}`),
                ...(advantage.length > 0 && disadvantage.length > 0 ? ['Advantage and disadvantage cancel out.'] : []),
                ...bonuses.map((option) => `${option.source} ${option.value >= 0 ? '+' : ''}${option.value}`),
            ]

            log({
                kind: roll.kind,
                label: roll.label,
                formula: `1d20${modifier === 0 ? '' : modifier > 0 ? `+${modifier}` : modifier}`,
                dice: [result.natural],
                discarded: result.discarded,
                modifier,
                total: result.total,
                mode,
                natural: result.natural,
                crit: roll.kind === 'attack' ? result.critical : result.natural === 20,
                fumble: result.fumble,
                attackId: roll.attack?.id,
                notes,
            })
            setNextMode('normal')
        },
        [log],
    )

    const start = useCallback(
        (roll: PendingRoll) => {
            if (roll.line.roll.situational.length > 0) setPending(roll)
            else executeD20(roll, [])
        },
        [executeD20],
    )

    const api = useMemo<RollApi>(
        () => ({
            nextMode,
            setNextMode,
            rollCheck: (label, kind, line, event) => {
                const fromClick = modeFromEvent(event)
                start({ label, kind, line, forced: fromClick !== 'normal' ? fromClick : nextMode })
            },
            rollAttack: (attack, event) => {
                const fromClick = modeFromEvent(event)
                start({
                    label: `${attack.name} attack`,
                    kind: 'attack',
                    line: attack.attack,
                    forced: fromClick !== 'normal' ? fromClick : nextMode,
                    attack,
                })
            },
            rollDamage: (attack, options) => {
                const formula = damageFormula(attack, options.twoHanded)
                const result = rollExpression(formula, { critical: options.critical })
                if (!result) return
                log({
                    kind: 'damage',
                    label: `${attack.name} damage${options.critical ? ' (critical)' : ''}`,
                    formula: result.formula,
                    dice: result.dice,
                    discarded: [],
                    modifier: result.flat,
                    total: Math.max(0, result.total),
                    mode: 'normal',
                    critical: options.critical,
                    damageType: attack.damageType,
                    attackId: attack.id,
                    notes: options.critical ? ['Critical hit: damage dice rolled twice.'] : [],
                })
            },
            rollDeathSave: () => {
                const forced = nextMode
                const result = rollD20({ modifier: 0, mode: forced })
                const outcome = deathSaveOutcome(result.natural)
                log({
                    kind: 'death-save',
                    label: 'Death saving throw',
                    formula: '1d20',
                    dice: [result.natural],
                    discarded: result.discarded,
                    modifier: 0,
                    total: result.total,
                    mode: forced,
                    natural: result.natural,
                    crit: result.natural === 20,
                    fumble: result.natural === 1,
                    notes: [
                        outcome === 'revive'
                            ? 'Natural 20: regain 1 HP and get up.'
                            : outcome === 'critical-failure'
                              ? 'Natural 1: two failures.'
                              : outcome === 'success'
                                ? 'Success.'
                                : 'Failure.',
                    ],
                })
                onChange((current) => {
                    if (outcome === 'revive') return reviveWithOneHp(current, sheet.maxHp)
                    if (outcome === 'success') return recordDeathSave(current, 'success', sheet.maxHp)
                    return recordDeathSave(current, 'failure', sheet.maxHp, {
                        critical: outcome === 'critical-failure',
                    })
                })
                setNextMode('normal')
            },
            rollCustom: (expression) => {
                const parsed = parseExpression(expression)
                const result = parsed ? rollExpression(parsed) : null
                if (!result) return false
                log({
                    kind: 'custom',
                    label: 'Custom roll',
                    formula: result.formula,
                    dice: result.dice,
                    discarded: [],
                    modifier: result.flat,
                    total: result.total,
                    mode: 'normal',
                    notes: [],
                })
                return true
            },
            logEntry: log,
            lastAttack: (attackId) => {
                // Newest first: the latest roll tied to this attack decides. If damage was
                // already rolled for it, the attack has been "used up".
                const latest = entries.find(
                    (entry) =>
                        entry.attackId === attackId &&
                        entry.characterId === character.id &&
                        (entry.kind === 'attack' || entry.kind === 'damage'),
                )
                return latest?.kind === 'attack' ? latest : undefined
            },
        }),
        [nextMode, start, log, onChange, sheet.maxHp, entries, character.id],
    )

    return (
        <RollContext.Provider value={api}>
            {children}
            {pending && (
                <SituationPrompt
                    title={pending.label}
                    options={pending.line.roll.situational}
                    onCancel={() => setPending(null)}
                    onRoll={(chosen) => {
                        const roll = pending
                        setPending(null)
                        executeD20(roll, chosen)
                    }}
                />
            )}
        </RollContext.Provider>
    )
}
