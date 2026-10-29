import type { RulesContent } from '../lib/normalize'
import type { Character, Nation, NpcTemplate } from '../types/schema'

/** What the GM asks for in quick-create. `null` means "let the template decide". */
export interface NpcSpec {
    nation: Nation | null
    classId: string | null
    level: number
    /** Dragon Trainers can come up at random (rare, off by default: they belong to one people). */
    allowDragonTrainers?: boolean
    /** Give the NPC a second class. */
    multiclass?: boolean
}

/** The random-class options the GM chose; kept with the NPC so rerolls follow them. */
export interface NpcOptions {
    allowDragonTrainers?: boolean
    multiclass?: boolean
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

/** How often a role wears armor and carries weapons when its template does not say (0-1). */
export const DEFAULT_COMBAT = 0.6

export interface NpcContext {
    template: NpcTemplate
    content: RulesContent
    options?: NpcOptions
}

export interface NpcResult {
    character: Character
    /** Things the GM should know, e.g. a bending class that is not in the app yet. */
    warnings: string[]
}
