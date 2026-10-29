import type { Feature } from '../types/schema'

/**
 * Avatar-themed Epic Boons (owner decision LC3 in docs/RULES_QUESTIONS.md). **Stand-in drafts**: the
 * wording is this app's, not gmbinder's, until the owner approves it. A character earns one boon for each
 * class taken to level 20; only Boon of the Element can be taken more than once.
 */

export interface EpicBoon {
    id: string
    feature: Feature
    /** Can be picked again (Boon of the Element). */
    repeatable?: boolean
    /** The pick also needs an ability (Boon of the Element). */
    needsAbility?: boolean
}

export const ELEMENT_BOON_ID = 'boon-element'
export const BOON_ABILITY_BONUS = 2
export const BOON_ABILITY_CAP = 30

const boon = (id: string, name: string, description: string, extra: Partial<Feature> = {}): Feature => ({
    id,
    name,
    description: `${description} (Stand-in draft: Avatar-themed Epic Boon, not from gmbinder.)`,
    source: 'Epic Boon',
    featureType: 'Passive',
    levelRequirement: 20,
    isActiveByDefault: true,
    ...extra,
})

export const epicBoons: EpicBoon[] = [
    {
        id: ELEMENT_BOON_ID,
        repeatable: true,
        needsAbility: true,
        feature: boon(
            ELEMENT_BOON_ID,
            'Boon of the Element',
            `Your bond with your element deepens. One ability score of your choice increases by ${BOON_ABILITY_BONUS}, to a maximum of ${BOON_ABILITY_CAP}. You can take this boon more than once.`,
        ),
    },
    {
        id: 'boon-spirit-world',
        feature: boon(
            'boon-spirit-world',
            'Boon of the Spirit World',
            'Once per day, as a bonus action, you step into the spirit world until the end of your next turn. You cannot be targeted or harmed by anything that is not a spirit, and you can move through creatures and objects, then you return where you left.',
            { featureType: 'Limited Use', uses: 1, recharge: 'Long Rest' },
        ),
    },
    {
        id: 'boon-past-lives',
        feature: boon(
            'boon-past-lives',
            'Boon of Past Lives',
            'You gain proficiency in one skill of your choice. Once per short rest, when you or an ally within 30 feet makes an ability check, attack roll or saving throw, you can roll a d10 and add it to the result, as the voices of those who came before guide you.',
            { featureType: 'Limited Use', uses: 1, recharge: 'Short Rest' },
        ),
    },
    {
        id: 'boon-master-technique',
        feature: boon(
            'boon-master-technique',
            'Boon of the Master Technique',
            'Choose one Mastered technique you know. It costs a slot one level lower than usual (a Mastered cast uses a Trained slot) and does not count toward your limit of 6 Mastered techniques.',
        ),
    },
]

export const epicBoonFeatures: Feature[] = epicBoons.map((item) => item.feature)

export const findBoon = (id: string): EpicBoon | undefined => epicBoons.find((item) => item.id === id)
