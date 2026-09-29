import type { SituationalOption } from '../engine/effects'
import type { RollMode } from '../engine/rolls'
import type { StatLine } from '../engine/statLine'

/** Combine automatic sources, a forced mode, and confirmed situational rules into one mode. */
export function mergeSources(line: StatLine, forced: RollMode, chosen: SituationalOption[] = []) {
    const advantage = [
        ...line.roll.advantage,
        ...chosen.filter((option) => option.kind === 'advantage').map((option) => option.source),
        ...(forced === 'advantage' ? ['Chosen when rolling'] : []),
    ]
    const disadvantage = [
        ...line.roll.disadvantage,
        ...chosen.filter((option) => option.kind === 'disadvantage').map((option) => option.source),
        ...(forced === 'disadvantage' ? ['Chosen when rolling'] : []),
    ]

    const mode: RollMode =
        advantage.length > 0 && disadvantage.length === 0
            ? 'advantage'
            : disadvantage.length > 0 && advantage.length === 0
              ? 'disadvantage'
              : 'normal'

    const notes = [
        ...advantage.map((source) => `Advantage: ${source}`),
        ...disadvantage.map((source) => `Disadvantage: ${source}`),
        ...(advantage.length > 0 && disadvantage.length > 0 ? ['Advantage and disadvantage cancel out.'] : []),
    ]

    return { mode, notes }
}

export function signed(value: number): string {
    return value === 0 ? '' : value > 0 ? `+${value}` : `${value}`
}
