import { backgroundFeatures } from './backgrounds'
import { earthbendingFeatures } from './earthbending'
import { features as coreFeatures } from './features'
import { weaponsmasterExtraFeatures } from './weaponsmasterExtras'
import type { Feature } from '../types/schema'

export const features: Feature[] = [
    ...coreFeatures,
    ...earthbendingFeatures,
    ...weaponsmasterExtraFeatures,
    ...backgroundFeatures,
]

export { backgrounds } from './backgrounds'
export { characterClasses, characterSubclasses } from './classes'
export { lineages } from './lineages'
export { npcTemplates } from './npcTemplates'
export { techniques } from './techniques'
