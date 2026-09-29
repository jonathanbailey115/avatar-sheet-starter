/**
 * Rules content ships with the app (seed). Users can edit it in Campaign Data.
 * Only the user's changes are stored ("edits"), so app updates to the built-in
 * content still reach existing users while their own changes are kept.
 */
export interface Edits<T> {
    upserts: T[]
    removed: string[]
}

export function emptyEdits<T>(): Edits<T> {
    return { upserts: [], removed: [] }
}

export function applyEdits<T>(seed: T[], edits: Edits<T>, keyOf: (item: T) => string): T[] {
    const removed = new Set(edits.removed)
    const upserts = new Map(edits.upserts.map((item) => [keyOf(item), item]))
    const seedKeys = new Set(seed.map(keyOf))

    const result = seed
        .filter((item) => !removed.has(keyOf(item)))
        .map((item) => upserts.get(keyOf(item)) ?? item)

    for (const item of edits.upserts) {
        if (!seedKeys.has(keyOf(item))) result.push(item)
    }

    return result
}

/** Compute the edits that turn `seed` into `next`. */
export function diffEdits<T>(seed: T[], next: T[], keyOf: (item: T) => string): Edits<T> {
    const seedByKey = new Map(seed.map((item) => [keyOf(item), item]))
    const nextKeys = new Set(next.map(keyOf))

    return {
        removed: seed.map(keyOf).filter((key) => !nextKeys.has(key)),
        upserts: next.filter((item) => {
            const original = seedByKey.get(keyOf(item))
            return !original || JSON.stringify(original) !== JSON.stringify(item)
        }),
    }
}
