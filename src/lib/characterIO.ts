import { CHARACTER_SCHEMA_VERSION } from '../types/schema'
import type { Character } from '../types/schema'
import { characterSchema } from './characterSchema'
import { migrateCharacter } from './migrations'

export const FILE_APP_ID = 'avatar-dnd'

export interface ParsedImport {
    characters: Character[]
    errors: string[]
}

/** Migrate to the current schema, then validate. Throws an Error with a readable message. */
export function parseCharacterRecord(raw: unknown): Character {
    const migrated = migrateCharacter(raw)
    const result = characterSchema.safeParse(migrated)

    if (!result.success) {
        const details = result.error.issues
            .slice(0, 3)
            .map((issue) => `${issue.path.join('.') || 'character'}: ${issue.message}`)
            .join('; ')
        throw new Error(`Invalid character data (${details}).`)
    }

    return result.data
}

export function serializeCharacter(character: Character): string {
    return JSON.stringify(
        {
            app: FILE_APP_ID,
            kind: 'character',
            schemaVersion: CHARACTER_SCHEMA_VERSION,
            character,
        },
        null,
        2,
    )
}

export function serializeLibrary(characters: Character[]): string {
    return JSON.stringify(
        {
            app: FILE_APP_ID,
            kind: 'library',
            schemaVersion: CHARACTER_SCHEMA_VERSION,
            characters,
        },
        null,
        2,
    )
}

function extractRecords(parsed: unknown): unknown[] | null {
    if (Array.isArray(parsed)) return parsed

    if (typeof parsed === 'object' && parsed !== null) {
        const record = parsed as Record<string, unknown>

        if (record.kind === 'character' && 'character' in record) return [record.character]
        if (record.kind === 'library' && Array.isArray(record.characters)) {
            return record.characters
        }
        // Bare character objects exported by older versions of the app.
        if (typeof record.id === 'string' && typeof record.name === 'string') return [record]
    }

    return null
}

/** Parse a character, library backup, or legacy bare-character file. Never throws. */
export function parseCharacterImport(text: string): ParsedImport {
    let parsed: unknown
    try {
        parsed = JSON.parse(text)
    } catch {
        return { characters: [], errors: ['The file is not valid JSON.'] }
    }

    const records = extractRecords(parsed)
    if (!records) {
        return { characters: [], errors: ['The file does not contain any characters.'] }
    }

    const characters: Character[] = []
    const errors: string[] = []

    records.forEach((record, index) => {
        try {
            characters.push(parseCharacterRecord(record))
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error.'
            errors.push(`Character ${index + 1}: ${message}`)
        }
    })

    return { characters, errors }
}

export function safeFileName(name: string, fallback: string): string {
    const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    return `${slug || fallback}.json`
}

export function downloadText(contents: string, filename: string): void {
    const blob = new Blob([contents], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}
