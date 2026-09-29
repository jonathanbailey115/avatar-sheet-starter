/** Returns a number in [0, 1). Injectable so tests are deterministic. */
export type Rng = () => number

/** Cryptographically strong random number in [0, 1). */
export function secureRandom(): number {
    const buffer = new Uint32Array(1)
    globalThis.crypto.getRandomValues(buffer)
    return buffer[0] / 0x1_0000_0000
}

/** Roll one die with the given number of sides: 1..sides. */
export function rollDie(sides: number, rng: Rng = secureRandom): number {
    if (!Number.isInteger(sides) || sides < 1) throw new RangeError(`Invalid die: d${sides}`)
    return 1 + Math.min(sides - 1, Math.floor(rng() * sides))
}

export function rollDice(count: number, sides: number, rng: Rng = secureRandom): number[] {
    return Array.from({ length: Math.max(0, count) }, () => rollDie(sides, rng))
}
