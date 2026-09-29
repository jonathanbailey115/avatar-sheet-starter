// Extracts class and subclass feature text from the gmbinder source.
//
//   node scripts/extract-class-features.mjs
//
// Reads reference/atla-homebrew-gmbinder.txt (git-ignored, local only) and writes
// src/data/classText.generated.ts, which IS committed. The levels, feature types and effects
// are authored by hand in src/data/{waterbending,firebending,airbending,techEngineer}.ts;
// this file only carries the source wording so it is never retyped.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const TYPOS = [['Multidisicplinary', 'Multidisciplinary']]
let text = readFileSync(join(root, 'reference', 'atla-homebrew-gmbinder.txt'), 'utf8').replace(/\r\n/g, '\n')
for (const [wrong, right] of TYPOS) text = text.split(wrong).join(right)
const source = text.split('\n')

const find = (needle, from = 0) => {
    for (let i = from; i < source.length; i += 1) if (source[i].includes(needle)) return i
    throw new Error(`marker not found: ${needle}`)
}

/** Lines of the range with image blocks, layout commands and stray tags removed. */
function cleanLines(start, end) {
    const kept = []
    let inImage = false
    for (let i = start; i < end; i += 1) {
        const line = source[i]
        const trimmed = line.trim()
        if (inImage) {
            if (trimmed.endsWith('/>')) inImage = false
            continue
        }
        if (trimmed.startsWith('<img')) {
            if (!trimmed.endsWith('/>')) inImage = true
            continue
        }
        if (/^\\(pagebreakNum|columnbreak)/.test(trimmed) || /^<!--/.test(trimmed) || /^<(div|\/div|h[1-6]|\/h[1-6])\b/.test(trimmed)) continue
        if (/^(<br\/>\s*)+$/.test(trimmed) || trimmed === '') continue
        // Markdown headings (### Level 5 ... are handled by the caller) and class tables carry no feature text.
        if ((/^#/.test(trimmed) && !/^###\s/.test(trimmed)) || /^\|/.test(trimmed)) continue
        kept.push(line.replace(/<br\/>/g, ' ').replace(/\s+$/g, '').replace(/^\s+(?=[-*])/, ''))
    }
    return kept
}

/**
 * Split into features. A feature starts at a line that is only a bold name ("**Flow**"), or at
 * "**Name**: text" when `inline` is true (contraptions and specialization lists).
 */
function parseFeatures(start, end, { inline = false } = {}) {
    const lines = cleanLines(start, end)
    const features = []
    let current = null
    let group = ''
    const preface = []
    const headingOnly = /^\s*\*\*([^*]+?)\*\*\s*$/
    const inlineHeading = /^\s*\*\*([^*]+?)\*\*\s*:\s*(.*)$/

    for (const line of lines) {
        const level = line.match(/^###\s+(.*)$/)
        if (level) {
            group = level[1].trim()
            continue
        }
        const only = line.match(headingOnly)
        // In inline mode, bulleted options belong to the entry above them.
        const inl = inline && !/^\s*[*-]\s/.test(line) ? line.match(inlineHeading) : null
        if (only) {
            current = { name: only[1].replace(/[:\s]+$/, '').trim(), group, lines: [] }
            features.push(current)
        } else if (inl) {
            current = { name: inl[1].trim(), group, lines: [inl[2]] }
            features.push(current)
        } else if (current) {
            current.lines.push(line.trim())
        } else {
            preface.push(line.trim())
        }
    }
    if (preface.length > 0) features.unshift({ name: 'Introduction', group: '', lines: preface })
    return (
        features
            // Bold lines that are notes, not features of their own.
            .filter((feature) => feature.name.length <= 60 && !/^For every 3 chi points/.test(feature.name))
            .map((feature) => ({
                name: feature.name,
                ...(feature.group ? { group: feature.group } : {}),
                text: feature.lines.filter(Boolean).join('\n').trim(),
            }))
    )
}

const sections = {}
const section = (id, start, end, options) => {
    sections[id] = parseFeatures(start, end, options)
}

// Waterbending
const waterStart = find('<h4 id="Bwater"></h4>')
const waterPaths = find('<h4 id="Bwater1"></h4>', waterStart)
const healer = find('<h4 id="Bwater2"></h4>', waterPaths)
const bloodbender = find('<h4 id="Bwater3"></h4>', healer)
const earthStart = find('<h4 id="Bearth"></h4>', bloodbender)
section('waterbending', waterStart, waterPaths)
section('path-of-the-waterbender', waterPaths, healer)
section('path-of-the-healer', healer, bloodbender)
// The Bloodbender text ends at its build suggestions.
const waterBuild = find('#### Waterbending Build Suggestions', bloodbender)
section('path-of-the-bloodbender', bloodbender, waterBuild)

// Firebending
const fireStart = find('<h4 id="Bfire"></h4>')
const fireFirst = find('<h4 id="Bfire1"></h4>', fireStart)
const combustion = find('<h4 id="Bfire2"></h4>', fireFirst)
const fireBuild = find('#### Firebending Styles Build Suggestions', combustion)
section('firebending', fireStart, fireFirst)
section('principles-of-the-firebender', fireFirst, combustion)
section('principles-of-the-combustionbender', combustion, fireBuild)

// Airbending (no subclass in the source)
const airStart = find('<h4 id="Bair"></h4>')
const airBuild = find('#### Airbending Styles Build Suggestions', airStart)
section('airbending', airStart, airBuild)
// Spiritual Maledict is a plain heading, not a bold line, so pick it up separately.
const maledict = find('Spiritual Maledict', airStart)
const meditation = find('**Meditation**', maledict)
sections.airbending.unshift({ name: 'Spiritual Maledict', text: cleanLines(maledict + 1, meditation).join('\n').trim() })

// Tech-Engineer
const teStart = find('<h4 id="TEclass"></h4>')
const teContraptions = find('<h2 id="TECMC">', teStart)
const teSpec = find('<h2 id="TESpec">', teContraptions)
const teArmor = find('<h3 id="TEASpec">', teSpec)
const teWeapons = find('<h3 id="TEWSpec">', teArmor)
const teMulti = find('<h3 id="TEMDSpec">', teWeapons)
const teGadget = find('<h3 id="TEGSpec">', teMulti)
const teBuild = find('#### Tech-Engineer Build Suggestions', teGadget)
section('tech-engineer', teStart, teContraptions)
section('tech-engineer-contraptions', teContraptions, teSpec, { inline: true })
section('armor-specialist', teArmor, teWeapons)
section('weapons-specialist', teWeapons, teMulti)
section('multidisciplinary-specialist', teMulti, teGadget)
section('gadgeteering-specialist', teGadget, teBuild, { inline: true })

// Feats (homebrew and changed feats only; the source says the rest are unchanged 5e feats)
const featsStart = find('<h2 id="feats">')
const featsEnd = find('<h2 id="WMFT">', featsStart)
section('feats', featsStart, featsEnd)

const out = `// GENERATED by scripts/extract-class-features.mjs from the gmbinder source. Do not edit by hand.
// Source wording for class and subclass features. Levels and effects are authored in the class files.

export interface ClassTextEntry {
    name: string
    /** The heading it was printed under, e.g. "Level 5 Contraptions". */
    group?: string
    text: string
}

export const classText: Record<string, ClassTextEntry[]> = ${JSON.stringify(sections, null, 4)}
`
writeFileSync(join(root, 'src', 'data', 'classText.generated.ts'), out)
for (const [id, list] of Object.entries(sections)) console.log(`${id}: ${list.length} -> ${list.map((f) => f.name).join(' | ')}`)
