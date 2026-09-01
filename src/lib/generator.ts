import type { BendingType, Character, Nation, NpcTemplate, Style } from '../types/schema'

const names = ['Rin', 'Kano', 'Sela', 'Toma', 'Yori', 'Nalin', 'Haru', 'Mei']
const lineages = ['human', 'mixed-heritage', 'air-nomad-human']

function randomFromArray<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)]
}

function weightedPick<T extends string>(weights: Partial<Record<T, number>>): T {
    const entries = (Object.entries(weights) as Array<[T, number | undefined]>)
        .map(([key, value]) => [key, Number(value ?? 0)] as const)
        .filter(([, value]) => value > 0)

    if (entries.length === 0) {
        throw new Error('weightedPick received no positive weights.')
    }

    const total = entries.reduce((sum, [, value]) => sum + Number(value), 0)
    let roll = Math.random() * total

    for (const [value, weight] of entries) {
        roll -= Number(weight)
        if (roll <= 0) return value
    }

    return entries[entries.length - 1][0]
}

function pickWeightedEntry<T>(entries: Array<{ item: T; weight: number }>): T | null {
    const validEntries = entries.filter((entry) => Number(entry.weight) > 0)

    if (validEntries.length === 0) {
        return null
    }

    const total = validEntries.reduce((sum, entry) => sum + Number(entry.weight), 0)
    let roll = Math.random() * total

    for (const entry of validEntries) {
        roll -= Number(entry.weight)
        if (roll <= 0) {
            return entry.item
        }
    }

    return validEntries[validEntries.length - 1]?.item ?? null
}

function getStyleWeight(
    style: Style,
    nation: Nation,
    bendingType: BendingType,
    templateRole: string,
): number {
    let weight = 1

    if (style.bendingType === bendingType) {
        weight += 6
    }

    if (style.nation === nation) {
        weight += 4
    }

    if (style.nation === 'Any') {
        weight += 1
    }

    if (style.bendingType === 'Non-Bender' && bendingType === 'Non-Bender') {
        weight += 3
    }

    const roleKey = templateRole.toLowerCase()
    const styleName = style.name.toLowerCase()

    if (roleKey.includes('guard') || roleKey.includes('soldier')) {
        if (styleName.includes('guardian')) weight += 4
        if (styleName.includes('soldier')) weight += 4
        if (styleName.includes('defen')) weight += 3
        if (styleName.includes('tactic')) weight += 2
    }

    if (roleKey.includes('scholar')) {
        if (styleName.includes('scholar')) weight += 4
        if (styleName.includes('sage')) weight += 4
        if (styleName.includes('tactic')) weight += 2
    }

    if (roleKey.includes('fighter')) {
        if (styleName.includes('martial')) weight += 5
        if (styleName.includes('warrior')) weight += 4
        if (styleName.includes('street')) weight += 4
        if (styleName.includes('weapons')) weight += 3
    }

    return weight
}

function chooseWeightedStyle(
    styles: Style[],
    nation: Nation,
    bendingType: BendingType,
    templateRole: string,
): string {
    const exactMatches = styles.filter(
        (style) =>
            style.bendingType === bendingType &&
            (style.nation === nation || style.nation === 'Any'),
    )

    const bendingMatches = styles.filter(
        (style) => style.bendingType === bendingType,
    )

    const pool = exactMatches.length > 0 ? exactMatches : bendingMatches

    if (pool.length === 0) {
        return bendingType === 'Non-Bender' ? 'Untrained Fighter' : `${bendingType} Adept`
    }

    return (
        pickWeightedEntry(
            pool.map((style) => ({
                item: style,
                weight: getStyleWeight(style, nation, bendingType, templateRole),
            })),
        )?.name ?? pool[0].name
    )
}

export function generateNpc(template: NpcTemplate, availableStyles: Style[]): Character {
    const nation = weightedPick<Nation>(template.nationWeights)
    const bendingType = weightedPick<BendingType>(template.bendingWeights)

    const name = randomFromArray(names)
    const lineage = randomFromArray(lineages)
    const style = chooseWeightedStyle(
        availableStyles,
        nation,
        bendingType,
        template.role,
    )

    return {
        id: crypto.randomUUID(),
        role: 'NPC',
        name,
        nation,
        lineageId: randomFromArray(lineages),
        bendingType,
        style,
        level: 1,
        hp: 8 + Math.floor(Math.random() * 8),
        chi: bendingType === 'Non-Bender' ? 0 : 2 + Math.floor(Math.random() * 3),
        backgroundNotes: `${template.role} generated from weighted tables.`,
        techniques: [],
        notes: 'Use this as a draft NPC and expand it in the NPC studio.',
        personality: '',
        ideals: '',
        bonds: '',
        flaws: '',
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        savingThrowProficiencies: [],
        skillProficiencies: [],
        classSkillChoices: [],
        toolProficiencies: [],
        languages: [],
        selectedFeatureIds: [],
        classId: '',
        armorName: '',
        weaponNotes: '',
        inventoryItems: [],
        currency: '',
        equipmentNotes: '',
    }
}