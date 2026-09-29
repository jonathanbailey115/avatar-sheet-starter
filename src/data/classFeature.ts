import type { ClassFeatureGrant, Feature } from '../types/schema'
import { classText } from './classText.generated'

/**
 * Builds Feature records whose wording comes straight from the gmbinder text (classText.generated.ts,
 * made by scripts/extract-class-features.mjs). Only the level, type and any effects are authored here.
 */

export const slug = (text: string) =>
    text
        .toLowerCase()
        .replace(/[’']/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

/** Benders gain Ability Score Improvements at these levels (the Benders class table). */
export const BENDER_ASI_LEVELS = [4, 9, 12, 16, 19]

export function textOf(section: string, name: string): string {
    const entry = classText[section]?.find((item) => item.name === name)
    if (!entry) throw new Error(`No text for "${name}" in section "${section}"`)
    return entry.text
}

interface FeatureOptions {
    id: string
    source: Feature['source']
    level: number
    featureType?: Feature['featureType']
    /** Shown instead of the source heading. */
    name?: string
    /** Appended to the source wording (for example, where this app follows a table over the text). */
    note?: string
    extra?: Partial<Feature>
}

export function makeFeature(section: string, sourceName: string, options: FeatureOptions): Feature {
    const body = textOf(section, sourceName)
    return {
        id: options.id,
        name: options.name ?? sourceName,
        description: options.note ? `${body}\n(${options.note})` : body,
        source: options.source,
        featureType: options.featureType ?? 'Passive',
        levelRequirement: options.level,
        isActiveByDefault: true,
        ...options.extra,
    }
}

export const grantsOf = (pairs: Array<[featureId: string, level: number]>): ClassFeatureGrant[] =>
    pairs.map(([featureId, level]) => ({ featureId, level })).sort((a, b) => a.level - b.level)

export const asiNote = (text: string) =>
    `The ${text} text lists Ability Score Improvements at 4th, 8th, 12th, 16th and 19th level; the Benders class table says 9th instead of 8th. This app follows the table (decision in docs/RULES_QUESTIONS.md).`
