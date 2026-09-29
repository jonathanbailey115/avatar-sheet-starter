import { CUSTOM_BACKGROUND_ID } from '../types/schema'
import type { Background, Character, CustomBackground, Feature } from '../types/schema'

export const CUSTOM_BACKGROUND_FEATURE_ID = 'background-custom'

export function blankCustomBackground(): CustomBackground {
    return {
        name: '',
        description: '',
        skillProficiencies: [],
        toolProficiencies: [],
        featureName: '',
        featureText: '',
    }
}

/** Turn a player-made background into the same shapes the built-in ones use. */
export function customToBackground(custom: CustomBackground): { background: Background; feature: Feature | null } {
    const hasFeature = custom.featureName.trim() !== '' || custom.featureText.trim() !== ''

    return {
        background: {
            id: CUSTOM_BACKGROUND_ID,
            name: custom.name.trim() || 'Custom background',
            description: custom.description,
            skillProficiencies: custom.skillProficiencies.slice(0, 2),
            toolProficiencies: custom.toolProficiencies,
            languages: [],
            featureIds: hasFeature ? [CUSTOM_BACKGROUND_FEATURE_ID] : [],
        },
        feature: hasFeature
            ? {
                  id: CUSTOM_BACKGROUND_FEATURE_ID,
                  name: custom.featureName.trim() || 'Background feature',
                  description: custom.featureText,
                  source: 'Background',
                  featureType: 'Passive',
                  levelRequirement: 1,
                  isActiveByDefault: true,
              }
            : null,
    }
}

/**
 * The rules content plus this character's custom background, when they use one.
 * Every engine path that reads backgrounds or their features goes through this.
 */
export function withCustomBackground<T extends { backgrounds: Background[]; features: Feature[] }>(
    character: Pick<Character, 'backgroundId' | 'customBackground'>,
    content: T,
): T {
    if (character.backgroundId !== CUSTOM_BACKGROUND_ID || !character.customBackground) return content

    const { background, feature } = customToBackground(character.customBackground)
    return {
        ...content,
        backgrounds: [...content.backgrounds.filter((item) => item.id !== CUSTOM_BACKGROUND_ID), background],
        features: feature ? [...content.features.filter((item) => item.id !== feature.id), feature] : content.features,
    }
}
