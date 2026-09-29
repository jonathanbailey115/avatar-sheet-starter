import { resolveMasteryCheck, resolveTrainingCheck } from '../engine/training'
import type { Character, KnownTechnique } from '../types/schema'

/** Apply a Training or mastery d20 to a technique and describe what happened. */
export function applyTrainingRoll(
    character: Pick<Character, 'knownTechniques'>,
    known: KnownTechnique,
    kind: 'training' | 'mastery',
    techniqueName: string,
    roll: { natural: number; total: number },
    /** How many techniques may be Mastered (see masteredLimit). */
    masteredCap?: number,
): { updated: KnownTechnique; summary: string } {
    if (kind === 'training') {
        const outcome = resolveTrainingCheck(known, roll.natural, roll.total)
        const updated = outcome.known
        if (outcome.leveledUp) {
            return { updated, summary: `Success: 5 Training Points, ${techniqueName} is now ${updated.level}.` }
        }
        if (outcome.outcome === 'success') {
            const plural = outcome.gained > 1 ? 's' : ''
            return {
                updated,
                summary: `Success: +${outcome.gained} Training Point${plural} (${updated.training.points}/5).`,
            }
        }
        return { updated, summary: `Failure: the DC drops to ${updated.training.dc}.` }
    }

    const outcome = resolveMasteryCheck(character, known, roll.total, masteredCap)
    const updated = outcome.known
    if (outcome.outcome === 'mastered') return { updated, summary: `Success: ${techniqueName} is Mastered.` }
    if (outcome.outcome === 'capped') {
        return { updated, summary: 'You already have the most Mastered techniques allowed.' }
    }
    return {
        updated,
        summary: `Failure: the mastery DC drops to ${updated.training.masteryDc}. Try again tomorrow.`,
    }
}
