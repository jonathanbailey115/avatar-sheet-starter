import type { Technique } from '../../types/schema'
import { earthTechniques } from './earth.generated'
import { fightingTechniques } from './fighting.generated'
import { techniqueMechanics } from './mechanics'
import { universalTechniques } from './universal.generated'

const extracted: Technique[] = [...universalTechniques, ...earthTechniques, ...fightingTechniques]

/** Every built-in technique: gmbinder text plus hand-authored mechanics. */
export const techniques: Technique[] = extracted.map((technique) => ({
    ...technique,
    ...techniqueMechanics[technique.id],
}))

export { techniqueMechanics }
