import type { Nation } from '../types/schema'
import { pickOne } from '../lib/random'
import type { Rng } from '../lib/random'

/**
 * Invented names, grouped by nation for flavor only. gmbinder gives no name lists, so these are
 * not rules content; the GM can rename any NPC.
 */
const GIVEN: Record<Nation, string[]> = {
    'Earth Kingdom': ['Bao', 'Tessen', 'Marisol', 'Dorrin', 'Yuna', 'Kesh', 'Bram', 'Lian', 'Oru', 'Hadley'],
    'Fire Nation': ['Kazu', 'Emiri', 'Rekka', 'Daiko', 'Saya', 'Toshin', 'Akane', 'Jiro', 'Mikan', 'Ryo'],
    'Water Tribe': ['Nuka', 'Sedna', 'Tavik', 'Ilaria', 'Koda', 'Pana', 'Aqiu', 'Siku', 'Nerak', 'Talia'],
    'Air Nomads': ['Tenzo', 'Pema', 'Dorje', 'Lhamo', 'Rinzin', 'Sonam', 'Yeshe', 'Kunga', 'Tashi', 'Dawa'],
}

const FAMILY: Record<Nation, string[]> = {
    'Earth Kingdom': ['Stonebrook', 'Ferrin', 'Ma', 'Hollow', 'Tan', 'Redmarsh', 'Vale', 'Quarry'],
    'Fire Nation': ['Hanabi', 'Kurogane', 'Shimizu', 'Ashgrove', 'Moriya', 'Tatsu', 'Emberly', 'Sato'],
    'Water Tribe': ['Frostwind', 'Kalluk', 'Tidecaller', 'Anguk', 'Nanuq', 'Seaborn', 'Ikaq', 'Qaanaaq'],
    'Air Nomads': ['of the East Temple', 'of the West Temple', 'of the North Temple', 'of the South Temple'],
}

export function generateName(nation: Nation, rng: Rng): string {
    const given = pickOne(GIVEN[nation], rng) ?? 'Nameless'
    const family = pickOne(FAMILY[nation], rng) ?? ''
    // Air Nomads use a single name, with their temple only sometimes.
    if (nation === 'Air Nomads') return rng() < 0.4 ? `${given} ${family}` : given
    return `${given} ${family}`.trim()
}

export const PERSONALITY = [
    'Blunt and unafraid to say so.',
    'Warm to strangers, cold to authority.',
    'Curious about everything, distracted by all of it.',
    'Quiet, watchful, and slow to trust.',
    'Cheerful in a way that feels rehearsed.',
    'Proud of a small thing and loud about it.',
    'Careful with words, generous with food.',
    'Restless; cannot stay in one place for long.',
]

export const IDEALS = [
    'Duty. Someone has to hold the line.',
    'Family comes before any nation.',
    'Knowledge should be shared, not hoarded.',
    'Balance. Take only what you need.',
    'Loyalty to the people who earned it.',
    'Freedom. No one should answer to a crown.',
]

export const BONDS = [
    'Sends most of their pay home to a sibling.',
    'Owes a life-debt to a stranger they are still looking for.',
    'Protects a place that is quietly falling apart.',
    'Carries a keepsake from someone they lost.',
    'Serves a master they no longer fully trust.',
    'Is hiding a bending gift, or the lack of one.',
]

export const FLAWS = [
    'Cannot resist a wager.',
    'Holds a grudge for years.',
    'Talks too much when nervous.',
    'Trusts titles more than people.',
    'Afraid of deep water.',
    'Boasts about fights they did not win.',
]
