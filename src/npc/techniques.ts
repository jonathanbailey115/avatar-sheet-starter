import { disciplinesOf, learnBlocker, limitStatus } from '../engine/techniques'
import { DEFAULT_TRAINING } from '../types/schema'
import type { Character, KnownTechnique, TechniqueLevel } from '../types/schema'
import type { RulesContent } from '../lib/normalize'
import { shuffle } from '../lib/random'
import type { Rng } from '../lib/random'

/**
 * Fill every technique cap the class table gives at this level with random learnable techniques
 * (prerequisites, rare-at-8 and caps all respected by the engine's own checks).
 *
 * NPC default, not a gmbinder rule: a bender's Mastered and Trained techniques match the class
 * table's Mastered and Trained slot columns; everything else is Practiced. Fighting and Universal
 * techniques stay Practiced. The GM can change any of them in the editor.
 */
export function learnTechniques(character: Character, content: RulesContent, rng: Rng): Character {
    const characterClass = content.classes.find((item) => item.id === character.classId)
    let current: Character = { ...character, knownTechniques: [] }
    if (!characterClass) return current
    const disciplines = disciplinesOf(character, content.subclasses, content.features)

    for (let guard = 0; guard < 60; guard += 1) {
        const open = limitStatus(current, characterClass, content.techniques).filter((status) => status.used < status.max)
        if (open.length === 0) break

        const options = shuffle(content.techniques, rng).filter(
            (technique) =>
                open.some((status) => status.limit.kinds.includes(technique.element)) &&
                learnBlocker(current, technique, characterClass, content.techniques, disciplines) === null,
        )
        const pick = options[0]
        if (!pick) break
        const learned: KnownTechnique = { techniqueId: pick.id, level: 'Practiced', training: { ...DEFAULT_TRAINING } }
        current = { ...current, knownTechniques: [...current.knownTechniques, learned] }
    }

    const row = characterClass.techniqueSlots?.[Math.min(20, Math.max(1, character.level)) - 1]
    if (!row) return current

    const upgradable = shuffle(
        current.knownTechniques.filter((known) => {
            const element = content.techniques.find((technique) => technique.id === known.techniqueId)?.element
            return element !== 'Fighting' && element !== 'Universal'
        }),
        rng,
    )
    const levels = new Map<string, TechniqueLevel>()
    upgradable.slice(0, row.mastered).forEach((known) => levels.set(known.techniqueId, 'Mastered'))
    upgradable.slice(row.mastered, row.mastered + row.trained).forEach((known) => levels.set(known.techniqueId, 'Trained'))

    return {
        ...current,
        knownTechniques: current.knownTechniques.map((known) => ({ ...known, level: levels.get(known.techniqueId) ?? known.level })),
    }
}
