import { describe, expect, it } from 'vitest'
import { createBlankCharacter } from '../lib/character'
import { normalizeCharacter } from '../lib/normalize'
import { realContent } from '../lib/testFixtures'
import type { Character } from '../types/schema'
import { abilityScoresOf } from './abilityScores'
import { collectFeatureEffects } from './effects'
import { getGrantedFeatures } from './features'

const at20 = (overrides: Partial<Character> = {}): Character => ({
    ...createBlankCharacter(),
    species: 'none',
    classId: 'earthbending',
    level: 20,
    constitution: 20,
    ...overrides,
})

describe('Epic Boons', () => {
    it('each Boon of the Element adds 2 to its ability, up to 30', () => {
        const one = at20({ epicBoons: [{ boonId: 'boon-element', ability: 'constitution' }] })
        expect(abilityScoresOf(one).constitution).toBe(22)
        const many = at20({ epicBoons: Array.from({ length: 6 }, () => ({ boonId: 'boon-element', ability: 'constitution' as const })) })
        expect(abilityScoresOf(many).constitution).toBe(30)
        expect(abilityScoresOf(one).strength).toBe(10)
    })

    it('a boon is a granted feature with the Epic Boon origin', () => {
        const c = at20({ epicBoons: [{ boonId: 'boon-spirit-world' }] })
        const granted = getGrantedFeatures(c, realContent).find((item) => item.feature.id === 'boon-spirit-world')
        expect(granted?.origin).toBe('Epic Boon')
    })

    it('keeps only the boons earned, once each except Boon of the Element', () => {
        const picks = [
            { boonId: 'boon-spirit-world' },
            { boonId: 'boon-spirit-world' },
            { boonId: 'boon-element', ability: 'wisdom' as const },
        ]
        const none = normalizeCharacter(at20({ level: 19, epicBoons: picks }), realContent)
        expect(none.epicBoons).toEqual([])
        const one = normalizeCharacter(at20({ epicBoons: picks }), realContent)
        expect(one.epicBoons).toEqual([{ boonId: 'boon-spirit-world' }])
        const two = normalizeCharacter(
            at20({ levelCapLifted: true, level: 40, extraClasses: [{ id: 'a', classId: 'weaponsmaster', level: 20, master: '', gmApproved: true }], epicBoons: picks }),
            realContent,
        )
        expect(two.epicBoons.map((pick) => pick.boonId)).toEqual(['boon-spirit-world', 'boon-element'])
    })
})

describe('features with the same name do not stack', () => {
    it('counts the effects of a feature name once', () => {
        const feature = (id: string) => ({
            feature: {
                id,
                name: 'Quick Reflexes',
                description: '',
                source: 'Class' as const,
                featureType: 'Passive' as const,
                levelRequirement: 1,
                isActiveByDefault: true,
                effects: [{ kind: 'bonus' as const, target: 'initiative' as const, value: 2 }],
            },
            origin: id,
        })
        expect(collectFeatureEffects([feature('a'), feature('b')])).toHaveLength(1)
    })
})
