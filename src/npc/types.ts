import type { RulesContent } from '../lib/normalize'
import type { Character, Nation, NpcTemplate } from '../types/schema'

/** What the GM asks for in quick-create. `null` means "let the template decide". */
export interface NpcSpec {
    nation: Nation | null
    classId: string | null
    level: number
}

/** The pieces of an NPC that can be rerolled on their own. */
export type NpcPart = 'name' | 'nation' | 'class' | 'abilities' | 'techniques' | 'gear' | 'persona'

export const NPC_PARTS: Array<{ id: NpcPart; label: string }> = [
    { id: 'name', label: 'Name' },
    { id: 'nation', label: 'Nation' },
    { id: 'class', label: 'Class' },
    { id: 'abilities', label: 'Abilities' },
    { id: 'techniques', label: 'Techniques' },
    { id: 'gear', label: 'Gear' },
    { id: 'persona', label: 'Background & personality' },
]

export interface NpcContext {
    template: NpcTemplate
    content: RulesContent
}

export interface NpcResult {
    character: Character
    /** Things the GM should know, e.g. a bending class that is not in the app yet. */
    warnings: string[]
}
