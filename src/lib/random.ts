/** Returns a number in [0, 1). Injectable so tests can be deterministic. */
export type Rng = () => number

export interface Weighted<T> {
    item: T
    weight: number
}

/**
 * Pick by weight. Entries with a weight that is not a positive finite number are ignored.
 * Returns null when nothing is pickable instead of throwing.
 */
export function weightedPick<T>(entries: Array<Weighted<T>>, rng: Rng = Math.random): T | null {
    const valid = entries.filter((entry) => Number.isFinite(entry.weight) && entry.weight > 0)
    if (valid.length === 0) return null

    const total = valid.reduce((sum, entry) => sum + entry.weight, 0)
    let roll = rng() * total

    for (const entry of valid) {
        roll -= entry.weight
        if (roll < 0) return entry.item
    }

    return valid[valid.length - 1].item
}

export function pickOne<T>(items: readonly T[], rng: Rng = Math.random): T | null {
    if (items.length === 0) return null
    return items[Math.min(items.length - 1, Math.floor(rng() * items.length))]
}

/** Fisher-Yates shuffle; returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
    const result = [...items]
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.min(i, Math.floor(rng() * (i + 1)))
        const held = result[i]
        result[i] = result[j]
        result[j] = held
    }
    return result
}

/** Up to `count` distinct items. */
export function pickMany<T>(items: readonly T[], count: number, rng: Rng = Math.random): T[] {
    return shuffle(items, rng).slice(0, Math.max(0, count))
}
