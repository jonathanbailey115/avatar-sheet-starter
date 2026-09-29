import { z } from 'zod'
import { abilityName, skillName } from './characterSchema'
import type { Feature, Lineage, NpcTemplate, Technique } from '../types/schema'

const nationOrAny = z.enum(['Air Nomads', 'Water Tribe', 'Earth Kingdom', 'Fire Nation', 'Any'])
const element = z.enum(['Air', 'Water', 'Earth', 'Fire'])
const strings = z.array(z.string())

function choiceSet<T extends z.ZodTypeAny>(option: T) {
    return z.object({ choose: z.number().int().min(0), options: z.array(option) })
}

const lineageSchema: z.ZodType<Lineage, z.ZodTypeDef, unknown> = z.object({
    id: z.string().min(1),
    name: z.string(),
    nation: nationOrAny,
    description: z.string(),
    hitDie: z.union([z.literal(6), z.literal(8), z.literal(10), z.literal(12)]).optional(),
    hitDiceText: z.string().optional(),
    hitPointsAtFirstLevelText: z.string().optional(),
    hitPointsPerLevelText: z.string().optional(),
    savingThrows: z.array(abilityName).optional(),
    savingThrowChoices: choiceSet(abilityName).optional(),
    skillChoices: choiceSet(skillName).optional(),
    armorProficiencies: strings.optional(),
    weaponProficiencies: strings.optional(),
    toolChoices: choiceSet(z.string()).optional(),
    languageProficiencies: strings.optional(),
    allowedBendingTypes: z.array(z.enum(['Air', 'Water', 'Earth', 'Fire', 'Non-Bender'])).optional(),
    featureIds: strings.optional(),
})

const techniqueSchema: z.ZodType<Technique, z.ZodTypeDef, unknown> = z.object({
    id: z.string().min(1),
    name: z.string(),
    element: z.union([element, z.literal('Universal')]),
    description: z.string(),
    rare: z.boolean().optional(),
})

const featureSchema: z.ZodType<Feature, z.ZodTypeDef, unknown> = z.object({
    id: z.string().min(1),
    name: z.string(),
    description: z.string(),
    source: z.enum(['Class', 'Subclass', 'Background', 'Lineage', 'Feat', 'Technique', 'Custom']),
    featureType: z.enum(['Passive', 'Action', 'Bonus Action', 'Reaction', 'Limited Use']),
    levelRequirement: z.number(),
    isActiveByDefault: z.boolean(),
    uses: z.number().optional(),
    recharge: z.enum(['Short Rest', 'Long Rest', 'Manual']).nullable().optional(),
})

const weight = z.number().min(0).optional()

const npcTemplateSchema: z.ZodType<NpcTemplate, z.ZodTypeDef, unknown> = z.object({
    role: z.string().min(1),
    nationWeights: z.object({
        'Air Nomads': weight,
        'Water Tribe': weight,
        'Earth Kingdom': weight,
        'Fire Nation': weight,
    }),
    bendingWeights: z.object({
        Air: weight,
        Water: weight,
        Earth: weight,
        Fire: weight,
        'Non-Bender': weight,
    }),
})

export interface CampaignData {
    lineages: Lineage[]
    techniques: Technique[]
    features: Feature[]
    npcTemplates: NpcTemplate[]
}

export interface ParsedCampaignData {
    data: Partial<CampaignData>
    warnings: string[]
    error?: string
}

/** Techniques exported before schema v2 had bendingType and tier. */
function upgradeLegacyTechnique(raw: unknown): unknown {
    if (typeof raw !== 'object' || raw === null || 'element' in raw) return raw
    const { bendingType, tier: _tier, ...rest } = raw as Record<string, unknown>
    return { ...rest, element: bendingType === 'Non-Bender' ? 'Universal' : bendingType }
}

function parseList<T>(
    label: string,
    raw: unknown,
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
    warnings: string[],
    upgrade: (item: unknown) => unknown = (item) => item,
): T[] | undefined {
    if (raw === undefined) return undefined
    if (!Array.isArray(raw)) {
        warnings.push(`"${label}" is not a list and was skipped.`)
        return undefined
    }

    const items: T[] = []
    let skipped = 0
    for (const entry of raw) {
        const result = schema.safeParse(upgrade(entry))
        if (result.success) items.push(result.data)
        else skipped += 1
    }
    if (skipped > 0) warnings.push(`${skipped} invalid ${label} entr${skipped === 1 ? 'y was' : 'ies were'} skipped.`)
    return items
}

export function parseCampaignData(text: string): ParsedCampaignData {
    let parsed: unknown
    try {
        parsed = JSON.parse(text)
    } catch {
        return { data: {}, warnings: [], error: 'The file is not valid JSON.' }
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { data: {}, warnings: [], error: 'The file is not campaign data.' }
    }

    const record = parsed as Record<string, unknown>
    const warnings: string[] = []
    const data: Partial<CampaignData> = {
        lineages: parseList('lineages', record.lineages, lineageSchema, warnings),
        techniques: parseList('techniques', record.techniques, techniqueSchema, warnings, upgradeLegacyTechnique),
        features: parseList('features', record.features, featureSchema, warnings),
        npcTemplates: parseList('npcTemplates', record.npcTemplates, npcTemplateSchema, warnings),
    }

    for (const key of Object.keys(data) as Array<keyof CampaignData>) {
        if (data[key] === undefined) delete data[key]
    }

    if (Object.keys(data).length === 0) {
        return { data, warnings, error: 'The file has no campaign data to import.' }
    }
    return { data, warnings }
}

export function serializeCampaignData(data: CampaignData): string {
    return JSON.stringify({ app: 'avatar-dnd', kind: 'campaign-data', ...data }, null, 2)
}
