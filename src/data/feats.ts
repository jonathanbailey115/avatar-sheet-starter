import type { Feature, TechniqueDiscipline } from '../types/schema'
import { slug } from './classFeature'
import { classText } from './classText.generated'

/**
 * The feats gmbinder changes or adds (Feats). The source also says the feats it does not list are
 * kept from 5e unchanged, but it does not print them, so they are not included (docs/RULES_QUESTIONS.md).
 * Wording is extracted from the source. Feats are optional: a player adds them in the builder.
 */

/** Feats that unlock a sub-bending's techniques. */
const GRANTS: Record<string, TechniqueDiscipline> = {
    'Lightning Generation': 'Lightningbending',
}

/** "Once per day" feats. A day is one long rest, so they come back after one. */
const DAILY = new Set(['Efficient Bender', 'Spiritual Projection'])

/** Names the owner corrected from the printed text (docs/RULES_QUESTIONS.md M8). */
const RENAMES: Record<string, string> = { 'Bender Bender': 'Bender Slayer' }

/** "Precise Bender (Spell Sniper)" -> name "Precise Bender", 5e origin "Spell Sniper". */
function splitAlias(heading: string): { name: string; alias: string | null } {
    const match = /^(.*?)\s*\((.+)\)\s*$/.exec(heading)
    return match ? { name: match[1].trim(), alias: match[2].trim() } : { name: heading.trim(), alias: null }
}

export const featFeatures: Feature[] = classText.feats
    .filter((entry) => entry.name !== 'Introduction')
    .map((entry) => {
        const split = splitAlias(entry.name)
        const name = RENAMES[split.name] ?? split.name
        const alias = split.alias
        const grants = GRANTS[name]
        return {
            id: `feat-${slug(name)}`,
            name,
            description: alias ? `${entry.text}\n(The 5e feat this replaces: ${alias}.)` : entry.text,
            source: 'Feat' as const,
            featureType: 'Passive' as const,
            levelRequirement: 1,
            isActiveByDefault: false,
            ...(grants ? { grantsDiscipline: grants } : {}),
            ...(DAILY.has(name) ? { featureType: 'Limited Use' as const, uses: 1, recharge: 'Long Rest' as const } : {}),
        }
    })
