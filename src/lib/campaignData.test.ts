import { describe, expect, it } from 'vitest'
import { parseCampaignData, serializeCampaignData } from './campaignData'
import { realContent } from './testFixtures'
import { npcTemplates } from '../data'

describe('campaign data import', () => {
    it('round-trips exported campaign data', () => {
        const text = serializeCampaignData({
            lineages: realContent.lineages,
            techniques: [],
            features: realContent.features,
            npcTemplates,
        })
        const result = parseCampaignData(text)
        expect(result.error).toBeUndefined()
        expect(result.warnings).toEqual([])
        expect(result.data.lineages).toEqual(realContent.lineages)
        expect(result.data.npcTemplates).toEqual(npcTemplates)
    })

    it('upgrades techniques exported with bendingType and tier', () => {
        const result = parseCampaignData(
            JSON.stringify({
                techniques: [
                    { id: 'a', name: 'A', tier: 3, bendingType: 'Earth', description: '' },
                    { id: 'b', name: 'B', tier: 1, bendingType: 'Non-Bender', description: '' },
                ],
            }),
        )
        expect(result.data.techniques?.map((t) => t.element)).toEqual(['Earth', 'Universal'])
    })

    it('drops the removed Mixed weight but keeps the template', () => {
        const result = parseCampaignData(
            JSON.stringify({
                npcTemplates: [
                    { role: 'X', nationWeights: { Mixed: 4, 'Fire Nation': 1 }, bendingWeights: {} },
                ],
            }),
        )
        expect(result.data.npcTemplates?.[0].nationWeights).toEqual({ 'Fire Nation': 1 })
    })

    it('skips invalid entries and says so', () => {
        const result = parseCampaignData(
            JSON.stringify({ lineages: [{ id: 'ok', name: 'Ok', nation: 'Any', description: '' }, { nope: true }] }),
        )
        expect(result.data.lineages).toHaveLength(1)
        expect(result.warnings[0]).toMatch(/1 invalid lineages/)
    })

    it('rejects files with nothing to import', () => {
        expect(parseCampaignData('{}').error).toBeTruthy()
        expect(parseCampaignData('[]').error).toBeTruthy()
        expect(parseCampaignData('oops').error).toMatch(/JSON/)
    })
})
