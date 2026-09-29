import type { RollModifiers } from './effects'

/** A number the sheet shows, with the reason for it and how it should be rolled. */
export interface StatLine {
    total: number
    breakdown: Array<{ label: string; value: number }>
    roll: RollModifiers
}
