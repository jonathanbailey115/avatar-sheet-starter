import type { Technique } from '../../types/schema'
import { airTechniques } from './air.generated'
import { earthTechniques } from './earth.generated'
import { fireTechniques } from './fire.generated'
import { fightingTechniques } from './fighting.generated'
import { airMechanics, fireMechanics, waterMechanics } from './elementMechanics'
import { techniqueMechanics } from './mechanics'
import { universalTechniques } from './universal.generated'
import { waterTechniques } from './water.generated'

const extracted: Technique[] = [
    ...universalTechniques,
    ...earthTechniques,
    ...waterTechniques,
    ...fireTechniques,
    ...airTechniques,
    ...fightingTechniques,
]

const allMechanics = { ...techniqueMechanics, ...waterMechanics, ...fireMechanics, ...airMechanics }

/** Every built-in technique: gmbinder text plus hand-authored mechanics. */
export const techniques: Technique[] = extracted.map((technique) => ({
    ...technique,
    ...allMechanics[technique.id],
}))

export { techniqueMechanics }
