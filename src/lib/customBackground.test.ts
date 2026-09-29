import { describe, expect, it } from 'vitest'
import { computeSheet } from '../engine/sheet'
import { CUSTOM_BACKGROUND_ID } from '../types/schema'
import { createBlankCharacter } from './character'
import { blankCustomBackground, customToBackground, withCustomBackground } from './customBackground'
import { normalizeCharacter } from './normalize'
import { realContent } from './testFixtures'

const withCustom = (overrides = {}) => ({
    ...createBlankCharacter(),
    backgroundId: CUSTOM_BACKGROUND_ID,
    customBackground: {
        ...blankCustomBackground(),
        name: 'Bridge Builder',
        skillProficiencies: ['Athletics', 'Insight'] as const,
        toolProficiencies: ['Smith’s Tools'],
        featureName: 'Known to the Crews',
        featureText: 'Work crews trust you.',
        ...overrides,
    },
})

describe('premade backgrounds', () => {
    it('grant their two skills and their feature', () => {
        const c = normalizeCharacter({ ...createBlankCharacter(), backgroundId: 'soldier' }, realContent)
        expect(c.skillProficiencies).toEqual(expect.arrayContaining(['Athletics', 'Intimidation']))
        expect(c.toolProficiencies).toContain('Gaming Set')
        const sheet = computeSheet(c, realContent)
        expect(sheet.features.map((f) => f.feature.name)).toContain('Old Rank')
    })

    it('grant no languages (everyone speaks Common)', () => {
        for (const background of realContent.backgrounds) expect(background.languages).toEqual([])
    })
})

describe('custom background', () => {
    it('grants its skills and tools like a premade one', () => {
        const c = normalizeCharacter(withCustom() as never, realContent)
        expect(c.skillProficiencies).toEqual(['Athletics', 'Insight'])
        expect(c.toolProficiencies).toContain('Smith’s Tools')
    })

    it('shows its feature on the sheet', () => {
        const c = normalizeCharacter(withCustom() as never, realContent)
        const names = computeSheet(c, realContent).features.map((f) => f.feature.name)
        expect(names).toContain('Known to the Crews')
    })

    it('never grants more than two skills', () => {
        const { background } = customToBackground({
            ...blankCustomBackground(),
            skillProficiencies: ['Athletics', 'Insight', 'Stealth'],
        })
        expect(background.skillProficiencies).toHaveLength(2)
    })

    it('has no feature when none was written', () => {
        const { feature, background } = customToBackground(blankCustomBackground())
        expect(feature).toBeNull()
        expect(background.featureIds).toEqual([])
        expect(background.name).toBe('Custom background')
    })

    it('does not leak into other characters\' content', () => {
        const extended = withCustomBackground(withCustom() as never, realContent)
        expect(extended.backgrounds.some((b) => b.id === CUSTOM_BACKGROUND_ID)).toBe(true)
        expect(realContent.backgrounds.some((b) => b.id === CUSTOM_BACKGROUND_ID)).toBe(false)
        expect(withCustomBackground(createBlankCharacter(), realContent)).toBe(realContent)
    })

    it('a character marked custom with no custom data falls back to no background', () => {
        const c = normalizeCharacter({ ...createBlankCharacter(), backgroundId: CUSTOM_BACKGROUND_ID }, realContent)
        expect(c.backgroundId).toBeUndefined()
    })
})

describe('a background that no longer exists', () => {
    it('is cleared, and the player is told when loading', () => {
        const stale = { ...createBlankCharacter(), backgroundId: 'community-helper' }
        const c = normalizeCharacter(stale, realContent, { reportRemovals: true })
        expect(c.backgroundId).toBeUndefined()
        expect(c.migrationNotes.join(' ')).toMatch(/community-helper/)
    })
})
