/** Join codes are 8 characters. People type them with spaces, dashes and lowercase. */
export function normalizeCode(text: string): string {
    return text.replace(/[^0-9a-zA-Z]/g, '').toUpperCase()
}

/** ABCD1234 -> ABCD-1234 for reading aloud. */
export function formatCode(code: string): string {
    const clean = normalizeCode(code)
    return clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean
}

export function isPlausibleCode(text: string): boolean {
    return normalizeCode(text).length === 8
}

export function randomCode(random: () => number = () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 0x1_0000_0000): string {
    const alphabet = '0123456789ABCDEF'
    return Array.from({ length: 8 }, () => alphabet[Math.floor(random() * 16)]).join('')
}
