import type { TechniqueSlotRow } from '../types/schema'

/**
 * The Benders class table (gmbinder): known techniques and technique slots by level.
 * Index 0 is level 1. Benders may master at most 6 techniques (6 Mastered slots at 20th).
 */
const rows: Array<[known: number, practiced: number, trained: number, mastered: number]> = [
    [2, 3, 0, 0],
    [3, 3, 0, 0],
    [4, 4, 1, 0],
    [5, 4, 1, 1],
    [6, 4, 2, 1],
    [7, 5, 2, 1],
    [8, 5, 2, 2],
    [9, 5, 3, 2],
    [10, 6, 3, 2],
    [10, 6, 4, 2],
    [11, 7, 4, 3],
    [11, 7, 4, 3],
    [12, 8, 5, 3],
    [12, 8, 5, 4],
    [13, 8, 5, 4],
    [13, 9, 6, 4],
    [14, 9, 6, 5],
    [14, 10, 7, 5],
    [15, 11, 7, 5],
    [15, 12, 8, 6],
]

export const BENDER_TECHNIQUE_SLOTS: TechniqueSlotRow[] = rows.map(
    ([known, practiced, trained, mastered]) => ({ known, practiced, trained, mastered }),
)

/** Weaponsmaster class table columns (gmbinder). Index 0 is level 1. */
export const COMBAT_EXPERTISE_POINTS = [
    1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 8,
]

/** Universal Technique Slots: 3 at 1st, 4 at 5th, 5 at 9th, 6 at 13th, 7 at 17th. */
export const UNIVERSAL_TECHNIQUE_SLOTS = [
    3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7,
]

/** Action Surge: once from 3rd level, twice from 17th (Weaponsmaster). */
export const WEAPONSMASTER_ACTION_SURGE = [
    0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2,
]
