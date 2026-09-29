import { SavedBadge } from '../sync/SyncStatus'
import { ConfirmButton } from '../components/ConfirmButton'
import { useState } from 'react'
import SectionCard from '../components/SectionCard'
import { characterDisplayName } from '../lib/character'
import {
    downloadText,
    parseCharacterImport,
    safeFileName,
    serializeCharacter,
    serializeLibrary,
} from '../lib/characterIO'
import { useCollection } from '../store/content'
import { useLibraryStore } from '../store/library'

export function LibraryScreen({ onPlay, onEdit }: { onPlay: () => void; onEdit: () => void }) {
    const characters = useLibraryStore((state) => state.characters)
    const quarantine = useLibraryStore((state) => state.quarantine)
    const { createCharacter, selectCharacter, copyCharacter, deleteCharacter } =
        useLibraryStore.getState()
    const importCharacters = useLibraryStore((state) => state.importCharacters)
    const dismissQuarantine = useLibraryStore((state) => state.dismissQuarantine)
    const classes = useCollection('classes')
    const lineages = useCollection('lineages')
    const [message, setMessage] = useState('')

    const open = (id: string, destination: 'play' | 'edit') => {
        selectCharacter(id)
        if (destination === 'play') onPlay()
        else onEdit()
    }

    const handleCreate = () => {
        createCharacter()
        onEdit()
    }

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? [])
        event.target.value = ''
        if (files.length === 0) return

        let added = 0
        const problems: string[] = []

        for (const file of files) {
            const result = parseCharacterImport(await file.text())
            added += importCharacters(result.characters)
            problems.push(...result.errors.map((error) => `${file.name}: ${error}`))
        }

        setMessage(
            `Imported ${added} character${added === 1 ? '' : 's'}.` +
                (problems.length > 0 ? ` Problems: ${problems.join(' ')}` : ''),
        )
    }

    return (
        <section className="tab-panel">
            {quarantine.length > 0 && (
                <div className="status-message" role="alert">
                    <p>
                        {quarantine.length} saved character{quarantine.length === 1 ? '' : 's'} could
                        not be loaded. Your data was not deleted.
                    </p>
                    <div className="actions inline-actions">
                        <button
                            className="secondary-button"
                            type="button"
                            onClick={() =>
                                downloadText(
                                    JSON.stringify(quarantine, null, 2),
                                    'unloaded-characters.json',
                                )
                            }
                        >
                            Download the raw data
                        </button>
                        <button className="secondary-button" type="button" onClick={dismissQuarantine}>
                            Dismiss (deletes it)
                        </button>
                    </div>
                </div>
            )}

            <SectionCard title="My Characters">
                <div className="actions inline-actions">
                    <button className="primary-button" type="button" onClick={handleCreate}>
                        New character
                    </button>
                    <label className="secondary-button file-button">
                        Import character JSON
                        <input
                            type="file"
                            accept=".json,application/json"
                            multiple
                            onChange={handleImport}
                            hidden
                        />
                    </label>
                    <button
                        className="secondary-button"
                        type="button"
                        disabled={characters.length === 0}
                        onClick={() =>
                            downloadText(serializeLibrary(characters), 'avatar-dnd-backup.json')
                        }
                    >
                        Export all (backup)
                    </button>
                </div>

                {message && <p className="status-message">{message}</p>}

                {characters.length === 0 ? (
                    <p>No characters yet. Create one or import a file from a friend.</p>
                ) : (
                    <div className="npc-list">
                        {characters.map((character) => {
                            const className =
                                classes.find((item) => item.id === character.classId)?.name ??
                                'No class'
                            const lineageName =
                                lineages.find((item) => item.id === character.lineageId)?.name ??
                                'No lineage'
                            const name = characterDisplayName(character)

                            return (
                                <article key={character.id} className="npc-item">
                                    <h3>{name}</h3>
                                    <SavedBadge kind="character" id={character.id} />
                                    <p>
                                        Level {character.level} · {className} · {lineageName}
                                    </p>

                                    <div className="actions inline-actions">
                                        <button
                                            className="primary-button"
                                            type="button"
                                            onClick={() => open(character.id, 'play')}
                                        >
                                            Play
                                        </button>
                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={() => open(character.id, 'edit')}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={() => copyCharacter(character.id)}
                                        >
                                            Duplicate
                                        </button>
                                        <button
                                            className="secondary-button"
                                            type="button"
                                            onClick={() =>
                                                downloadText(
                                                    serializeCharacter(character),
                                                    safeFileName(character.name, 'character'),
                                                )
                                            }
                                        >
                                            Export
                                        </button>
                                        <ConfirmButton
                                            className="secondary-button"
                                            question={`Delete ${name}? This cannot be undone.`}
                                            onConfirm={() => deleteCharacter(character.id)}
                                        >
                                            Delete
                                        </ConfirmButton>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </SectionCard>
        </section>
    )
}
