import type { Sheet } from '../engine/sheet'
import type { RulesContent } from '../lib/normalize'
import type { Character } from '../types/schema'
import type { PlayerSummary } from './types'

/** The part of a character that goes on the party board. Never the whole sheet. */
export function summarizeCharacter(character: Character, sheet: Sheet, content: RulesContent): PlayerSummary {
    return {
        characterId: character.id,
        name: character.name.trim() || 'Unnamed character',
        className: content.classes.find((item) => item.id === character.classId)?.name ?? 'No class',
        lineageName: content.lineages.find((item) => item.id === character.lineageId)?.name ?? character.nation,
        level: character.level,
        hp: sheet.currentHp,
        maxHp: sheet.maxHp,
        tempHp: character.tempHp,
        armorClass: sheet.armorClass.total,
        lifeState: sheet.lifeState,
        exhaustion: character.exhaustion,
        initiative: sheet.initiative.total,
        saveDc: sheet.bending?.saveDc ?? null,
    }
}
