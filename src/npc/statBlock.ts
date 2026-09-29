import { formatModifier } from '../engine/abilities'
import { damageOptions, saveSummary } from '../engine/techniques'
import { computeSheet } from '../engine/sheet'
import type { RulesContent } from '../lib/normalize'
import type { Character, TechniqueLevel } from '../types/schema'

export interface StatBlockTechnique {
    name: string
    level: TechniqueLevel
    save: string | null
    damage: string[]
    summary: string
}

/** Everything a GM needs at the table, computed by the same engine as a player sheet. */
export interface StatBlock {
    name: string
    subtitle: string
    armorClass: number
    armorNote: string
    hp: number
    initiative: number
    proficiencyBonus: number
    abilities: Array<{ key: string; score: number; modifier: number }>
    saves: Array<{ key: string; total: number }>
    skills: Array<{ name: string; total: number }>
    passives: { perception: number; insight: number; investigation: number }
    attacks: Array<{ name: string; toHit: number; damage: string; note: string }>
    bending: { attackModifier: number; saveDc: number } | null
    techniques: StatBlockTechnique[]
    features: Array<{ name: string; origin: string }>
    tools: string[]
    languages: string[]
}

const cap = (text: string) => text[0].toUpperCase() + text.slice(1)
const firstSentence = (text: string) => text.split(/(?<=[.!?])\s/)[0] ?? text

export function buildStatBlock(character: Character, content: RulesContent): StatBlock {
    const sheet = computeSheet(character, content)
    const characterClass = content.classes.find((item) => item.id === character.classId)
    const subclass = content.subclasses.find((item) => item.id === character.subclassId)
    const lineage = content.lineages.find((item) => item.id === character.lineageId)
    const modifier = sheet.bending?.modifier ?? 0

    return {
        name: character.name.trim() || 'Unnamed NPC',
        subtitle: [`Level ${character.level}`, lineage?.name ?? character.nation, subclass?.name ?? characterClass?.name ?? 'No class']
            .filter(Boolean)
            .join(' · '),
        armorClass: sheet.armorClass.total,
        armorNote: sheet.armorClass.breakdown.map((part) => part.label).join(' + '),
        hp: sheet.maxHp,
        initiative: sheet.initiative.total,
        proficiencyBonus: sheet.proficiencyBonus,
        abilities: sheet.abilities.map((ability) => ({ key: ability.key, score: ability.score, modifier: ability.modifier })),
        saves: Object.entries(sheet.saves)
            .filter(([, save]) => save.proficient)
            .map(([key, save]) => ({ key, total: save.total })),
        skills: Object.entries(sheet.skills)
            .filter(([, skill]) => skill.proficient)
            .map(([name, skill]) => ({ name, total: skill.total })),
        passives: sheet.passives,
        attacks: sheet.attacks.map((attack) => {
            const flat = attack.damageFlat === 0 ? '' : formatModifier(attack.damageFlat)
            return {
                name: attack.name,
                toHit: attack.attack.total,
                damage: `${attack.damageDice}${flat} ${attack.damageType}`.trim(),
                note: attack.source,
            }
        }),
        bending: sheet.bending ? { attackModifier: sheet.bending.attackModifier, saveDc: sheet.bending.saveDc } : null,
        techniques: character.knownTechniques.flatMap((known) => {
            const technique = content.techniques.find((item) => item.id === known.techniqueId)
            if (!technique) return []
            return [
                {
                    name: technique.name,
                    level: known.level,
                    save: saveSummary(technique),
                    damage: damageOptions(technique, known.level, modifier).map((d) => `${d.formula} ${d.type}`),
                    summary: firstSentence(technique.description),
                },
            ]
        }),
        features: sheet.features.map((granted) => ({ name: granted.feature.name, origin: granted.origin })),
        tools: character.toolProficiencies,
        languages: character.languages,
    }
}

/** Plain text a GM can paste into notes or a chat. */
export function statBlockText(block: StatBlock): string {
    const lines = [
        `${block.name} (${block.subtitle})`,
        `AC ${block.armorClass} (${block.armorNote}) · HP ${block.hp} · Initiative ${formatModifier(block.initiative)} · Proficiency ${formatModifier(block.proficiencyBonus)}`,
        block.abilities.map((a) => `${cap(a.key).slice(0, 3)} ${a.score} (${formatModifier(a.modifier)})`).join('  '),
    ]
    if (block.saves.length) lines.push(`Saves: ${block.saves.map((s) => `${cap(s.key).slice(0, 3)} ${formatModifier(s.total)}`).join(', ')}`)
    if (block.skills.length) lines.push(`Skills: ${block.skills.map((s) => `${s.name} ${formatModifier(s.total)}`).join(', ')}`)
    lines.push(`Passive Perception ${block.passives.perception}`)
    if (block.bending) lines.push(`Bending: attack ${formatModifier(block.bending.attackModifier)}, save DC ${block.bending.saveDc}`)
    for (const attack of block.attacks) lines.push(`${attack.name}: ${formatModifier(attack.toHit)} to hit, ${attack.damage}`)
    for (const t of block.techniques) {
        const extra = [t.save && `save ${t.save}`, ...t.damage].filter(Boolean).join('; ')
        lines.push(`${t.name} (${t.level})${extra ? `: ${extra}` : ''}`)
    }
    if (block.features.length) lines.push(`Features: ${block.features.map((f) => f.name).join(', ')}`)
    return lines.join('\n')
}
