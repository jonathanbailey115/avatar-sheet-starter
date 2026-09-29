import { DEFAULT_TRAINING, MAX_MASTERED_TECHNIQUES, MAX_TRAINING_SLOTS } from '../types/schema'
import type { Character, KnownTechnique } from '../types/schema'

/**
 * Training (gmbinder, Index and Homebrew Rules).
 *
 * - You can train up to 2 techniques at once. Switching loses the progress of the one you drop.
 * - Using a technique you are training, make an Elemental Ability Check (DC 15). A success earns
 *   1 Training Point (a natural 20 earns 2). On a failure the DC drops by 1.
 * - 5 Training Points raise a technique to the next level.
 * - Reaching Mastered needs a master's guidance, then a DC 25 Elemental Ability Check; each failure
 *   drops that DC by 1 and you may retry once per day.
 *
 * Assumption (docs/RULES_QUESTIONS.md B10): the DC returns to 15 after a success.
 */

export const TRAINING_POINTS_NEEDED = 5

export function trainingSlotsUsed(character: Pick<Character, 'knownTechniques'>): number {
    return character.knownTechniques.filter((known) => known.training.active).length
}

export function masteredCount(character: Pick<Character, 'knownTechniques'>): number {
    return character.knownTechniques.filter((known) => known.level === 'Mastered').length
}

/**
 * How many techniques can be Mastered. A class with a technique slot table (the Benders table) allows as many
 * as it has Mastered slots at the character's level, so 0 until 4th level. Classes without one keep the general cap.
 */
export function masteredLimit(slots: { mastered: number } | undefined): number {
    return slots ? slots.mastered : MAX_MASTERED_TECHNIQUES
}

export function canStartTraining(character: Pick<Character, 'knownTechniques'>, known: KnownTechnique): string | null {
    if (known.level === 'Mastered') return 'Already Mastered'
    if (known.training.active) return 'Already training'
    if (trainingSlotsUsed(character) >= MAX_TRAINING_SLOTS) return `Only ${MAX_TRAINING_SLOTS} techniques can be trained at once`
    return null
}

export function startTraining(known: KnownTechnique): KnownTechnique {
    return { ...known, training: { ...DEFAULT_TRAINING, active: true } }
}

/** Stopping loses the progress made (gmbinder). */
export function stopTraining(known: KnownTechnique): KnownTechnique {
    return { ...known, training: { ...DEFAULT_TRAINING } }
}

export interface TrainingResult {
    known: KnownTechnique
    outcome: 'success' | 'failure' | 'ignored'
    gained: number
    leveledUp: boolean
}

/** Resolve a Training check for a Practiced technique. `natural` is the d20; `total` includes the modifier. */
export function resolveTrainingCheck(known: KnownTechnique, natural: number, total: number): TrainingResult {
    if (!known.training.active || known.level !== 'Practiced') {
        return { known, outcome: 'ignored', gained: 0, leveledUp: false }
    }

    if (total < known.training.dc) {
        return {
            known: { ...known, training: { ...known.training, dc: Math.max(1, known.training.dc - 1) } },
            outcome: 'failure',
            gained: 0,
            leveledUp: false,
        }
    }

    const gained = natural === 20 ? 2 : 1
    const points = known.training.points + gained

    if (points >= TRAINING_POINTS_NEEDED) {
        // Levelled up to Trained. Getting to Mastered is a separate attempt with a master.
        return {
            known: { ...known, level: 'Trained', training: { ...DEFAULT_TRAINING } },
            outcome: 'success',
            gained,
            leveledUp: true,
        }
    }

    return {
        known: { ...known, training: { ...known.training, points, dc: DEFAULT_TRAINING.dc } },
        outcome: 'success',
        gained,
        leveledUp: false,
    }
}

export interface MasteryResult {
    known: KnownTechnique
    outcome: 'mastered' | 'failure' | 'capped' | 'ignored'
}

/** Resolve the DC 25 mastery check for a Trained technique whose training with a master is done. */
export function resolveMasteryCheck(
    character: Pick<Character, 'knownTechniques'>,
    known: KnownTechnique,
    total: number,
    cap: number = MAX_MASTERED_TECHNIQUES,
): MasteryResult {
    if (known.level !== 'Trained' || !known.training.active) return { known, outcome: 'ignored' }
    if (masteredCount(character) >= cap) return { known, outcome: 'capped' }

    if (total >= known.training.masteryDc) {
        return { known: { ...known, level: 'Mastered', training: { ...DEFAULT_TRAINING } }, outcome: 'mastered' }
    }

    return {
        known: {
            ...known,
            training: { ...known.training, masteryDc: Math.max(1, known.training.masteryDc - 1) },
        },
        outcome: 'failure',
    }
}
