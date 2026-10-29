import { airbendingFeatures } from './airbending'
import { backgroundFeatures } from './backgrounds'
import { earthbendingFeatures } from './earthbending'
import { avatarFeatures } from './avatar'
import { dragonSubclassFeatures, dragonTrainerFeatures } from './dragonTrainer'
import { epicBoonFeatures } from './epicBoons'
import { featFeatures } from './feats'
import { srdFeatFeatures } from './srdFeats'
import { features as coreFeatures } from './features'
import { firebendingFeatures, firebendingPrincipleFeatures } from './firebending'
import {
    contraptionFeatures,
    gadgeteeringUpgradeFeatures,
    specializationFeatures,
    techEngineerFeatures,
} from './techEngineer'
import { waterbendingFeatures, waterbendingPathFeatures } from './waterbending'
import { weaponsmasterExtraFeatures } from './weaponsmasterExtras'
import type { Feature } from '../types/schema'

export const features: Feature[] = [
    ...coreFeatures,
    ...earthbendingFeatures,
    ...waterbendingFeatures,
    ...waterbendingPathFeatures,
    ...firebendingFeatures,
    ...firebendingPrincipleFeatures,
    ...airbendingFeatures,
    ...featFeatures,
    ...srdFeatFeatures,
    ...techEngineerFeatures,
    ...specializationFeatures,
    ...contraptionFeatures,
    ...gadgeteeringUpgradeFeatures,
    ...weaponsmasterExtraFeatures,
    ...backgroundFeatures,
    ...epicBoonFeatures,
    ...dragonTrainerFeatures,
    ...dragonSubclassFeatures,
    ...avatarFeatures,
]

export { backgrounds } from './backgrounds'
export { characterClasses, characterSubclasses } from './classes'
export { lineages } from './lineages'
export { npcTemplates } from './npcTemplates'
export { techniques } from './techniques'
