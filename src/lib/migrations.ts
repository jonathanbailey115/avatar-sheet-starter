import { CHARACTER_SCHEMA_VERSION } from '../types/schema'

type Raw = Record<string, unknown>

/**
 * Character schema history
 *   1  Unversioned original sheet: chi, bendingType, style, tiered `techniques`, nation "Mixed".
 *   2  Bending derives from class. Chi, style and bendingType removed. `knownTechniques` holds
 *      {techniqueId, level}. `migrationNotes` added. Proficiency `manual*` lists always present.
 *   3  Play state: hpLost, tempHp, hitDiceUsed, deathSaves, exhaustion, resourcesUsed, hpRolls,
 *      maxHpAdjustment, armorId, hasShield. `hp` became `maxHpOverride` (NPCs only; player
 *      sheets never had a way to enter it, so their value was placeholder data).
 *   4  `weapons` (equipped weapons chosen from the weapon table). Typed weapon notes stay as notes.
 *   5  Techniques carry Training Point state; `customBackground` (player-made background).
 *
 * To change the schema: bump CHARACTER_SCHEMA_VERSION, add an `n -> n+1` function below, add a test.
 */

const VALID_NATIONS = ['Air Nomads', 'Water Tribe', 'Earth Kingdom', 'Fire Nation']

function isRecord(value: unknown): value is Raw {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringList(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : []
}

export function getSchemaVersion(raw: unknown): number {
    if (isRecord(raw) && typeof raw.schemaVersion === 'number') return raw.schemaVersion
    return 1
}

function migrate1to2(raw: Raw): Raw {
    const {
        chi: _chi,
        bendingType: _bendingType,
        style: _style,
        techniques,
        ...rest
    } = raw
    const notes = stringList(raw.migrationNotes)

    let nation = rest.nation
    if (typeof nation !== 'string' || !VALID_NATIONS.includes(nation)) {
        if (nation === 'Mixed') {
            notes.push(
                'This character had the nation "Mixed", which is not in the rules. Choose the nation and lineage of the parent your character takes after.',
            )
        }
        nation = 'Earth Kingdom'
    }

    const knownTechniques: Array<{ techniqueId: string; level: string }> = []
    if (Array.isArray(techniques)) {
        for (const item of techniques) {
            if (isRecord(item) && typeof item.id === 'string') {
                knownTechniques.push({ techniqueId: item.id, level: 'Practiced' })
            }
        }
        if (knownTechniques.length > 0) {
            notes.push(
                'Techniques from an older version were set to Practiced level. Review them on the Techniques tab.',
            )
        }
    }

    return {
        ...rest,
        schemaVersion: 2,
        nation,
        knownTechniques,
        // Older sheets stored final proficiency lists; treat them as manual additions.
        manualSavingThrows: rest.manualSavingThrows ?? [],
        manualSkills: rest.manualSkills ?? [],
        manualTools: rest.manualTools ?? stringList(rest.toolProficiencies),
        manualLanguages: rest.manualLanguages ?? stringList(rest.languages),
        migrationNotes: notes,
    }
}

function migrate2to3(raw: Raw): Raw {
    const { hp, ...rest } = raw
    const notes = stringList(raw.migrationNotes)

    const isNpc = rest.role === 'NPC'
    const maxHpOverride = isNpc && typeof hp === 'number' && hp > 0 ? Math.round(hp) : null

    if (typeof rest.armorName === 'string' && rest.armorName.trim() !== '') {
        notes.push(
            `Your armor was typed as "${rest.armorName.trim()}". Pick it from the armor list on the Equipment tab so AC is calculated.`,
        )
    }

    return {
        ...rest,
        schemaVersion: 3,
        maxHpOverride,
        maxHpAdjustment: 0,
        hpRolls: [],
        hpLost: 0,
        tempHp: 0,
        hitDiceUsed: 0,
        deathSaves: { successes: 0, failures: 0 },
        exhaustion: 0,
        resourcesUsed: {},
        armorId: '',
        hasShield: false,
        migrationNotes: notes,
    }
}

function migrate3to4(raw: Raw): Raw {
    const notes = stringList(raw.migrationNotes)
    if (typeof raw.weaponNotes === 'string' && raw.weaponNotes.trim() !== '') {
        notes.push(
            'Add your weapons from the weapon list on the Equipment tab so their attacks can be rolled. Your typed weapon notes were kept.',
        )
    }
    return { ...raw, schemaVersion: 4, weapons: [], migrationNotes: notes }
}

function migrate4to5(raw: Raw): Raw {
    const known = Array.isArray(raw.knownTechniques) ? raw.knownTechniques : []
    return {
        ...raw,
        schemaVersion: 5,
        customBackground: null,
        knownTechniques: known.map((item) =>
            isRecord(item)
                ? { ...item, training: { active: false, points: 0, dc: 15, masteryDc: 25 } }
                : item,
        ),
    }
}

const MIGRATIONS: Record<number, (raw: Raw) => Raw> = {
    1: migrate1to2,
    2: migrate2to3,
    3: migrate3to4,
    4: migrate4to5,
}

/**
 * Bring any stored or imported character up to the current schema version.
 * The result still needs zod validation. Throws for non-objects and for newer versions.
 */
export function migrateCharacter(raw: unknown): Raw {
    if (!isRecord(raw)) throw new Error('Character data is not an object.')

    let version = getSchemaVersion(raw)
    if (version > CHARACTER_SCHEMA_VERSION) {
        throw new Error(
            `This character was saved by a newer version of the app (schema ${version}). Update the app to open it.`,
        )
    }

    let current: Raw = raw
    while (version < CHARACTER_SCHEMA_VERSION) {
        const step = MIGRATIONS[version]
        if (!step) throw new Error(`No migration from schema version ${version}.`)
        current = step(current)
        version += 1
    }
    return current
}
