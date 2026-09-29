// Draws the app icons into public/ with no image library.
//
//   node scripts/make-icons.mjs
//
// The icons are simple on purpose: a dark tile with an orange ring and dot, the app's colours.
// Replace the PNG files in public/ any time; nothing else depends on how they were made.

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public')
mkdirSync(outDir, { recursive: true })

const BACKGROUND = [17, 22, 34]
const ORANGE = [245, 146, 46]

const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
})
const crc32 = (buffer) => {
    let c = 0xffffffff
    for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
    const body = Buffer.concat([Buffer.from(type), data])
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body))
    return Buffer.concat([length, body, crc])
}

function png(size, pixel) {
    const rows = []
    for (let y = 0; y < size; y += 1) {
        const row = Buffer.alloc(1 + size * 4)
        for (let x = 0; x < size; x += 1) {
            const [r, g, b, a] = pixel(x + 0.5, y + 0.5)
            row.set([r, g, b, a], 1 + x * 4)
        }
        rows.push(row)
    }
    const header = Buffer.alloc(13)
    header.writeUInt32BE(size, 0)
    header.writeUInt32BE(size, 4)
    header.set([8, 6, 0, 0, 0], 8) // 8-bit RGBA
    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', header),
        chunk('IDAT', deflateSync(Buffer.concat(rows))),
        chunk('IEND', Buffer.alloc(0)),
    ])
}

const mix = (from, to, t) => from.map((value, i) => Math.round(value + (to[i] - value) * t))
/** 1 inside the shape, 0 outside, with a one-pixel soft edge. */
const edge = (distance) => Math.min(1, Math.max(0, 0.5 - distance))

/** `bleed` true fills the whole square (for maskable icons); false rounds the corners. */
function icon(size, { bleed, scale }) {
    const c = size / 2
    return png(size, (x, y) => {
        const radius = size * 0.22
        const dx = Math.abs(x - c) - (c - radius)
        const dy = Math.abs(y - c) - (c - radius)
        const cornerDistance = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - radius
        const tile = bleed ? 1 : edge(cornerDistance)

        const d = Math.hypot(x - c, y - c)
        const outer = size * 0.36 * scale
        const inner = size * 0.27 * scale
        const dot = size * 0.1 * scale
        const ring = Math.min(edge(d - outer), edge(inner - d))
        const centre = edge(d - dot)
        const orange = Math.max(ring, centre)

        const [r, g, b] = mix(BACKGROUND, ORANGE, orange)
        return [r, g, b, Math.round(tile * 255)]
    })
}

const files = {
    'icon-192.png': icon(192, { bleed: false, scale: 1 }),
    'icon-512.png': icon(512, { bleed: false, scale: 1 }),
    // Maskable icons get cropped to a circle or squircle, so the art stays inside the middle 80%.
    'icon-maskable-512.png': icon(512, { bleed: true, scale: 0.8 }),
    'apple-touch-icon.png': icon(180, { bleed: true, scale: 0.9 }),
}
for (const [name, data] of Object.entries(files)) {
    writeFileSync(join(outDir, name), data)
    console.log(`public/${name} (${data.length} bytes)`)
}
