import { useState } from 'react'
import { BuilderAbilitiesPanel } from '../character-builder/BuilderAbilitiesPanel'
import { BuilderBackgroundPanel } from '../character-builder/BuilderBackgroundPanel'
import { BuilderClassPanel } from '../character-builder/BuilderClassPanel'
import { BuilderEquipmentPanel } from '../character-builder/BuilderEquipmentPanel'
import { BuilderFeaturesPanel } from '../character-builder/BuilderFeaturesPanel'
import { BuilderHomePanel } from '../character-builder/BuilderHomePanel'
import { BuilderLineagePanel } from '../character-builder/BuilderLineagePanel'
import { BuilderProficienciesPanel } from '../character-builder/BuilderProficienciesPanel'
import { BuilderTechniquesPanel } from '../character-builder/BuilderTechniquesPanel'
import { characterDisplayName } from '../lib/character'
import { withCustomBackground } from '../lib/customBackground'
import { useActiveCharacter } from '../store/active'
import { useCollection } from '../store/content'
import { useLibraryStore } from '../store/library'
import { nations } from '../types/schema'

const BUILDER_TABS = [
    { id: 'home', label: 'Home' },
    { id: 'class', label: 'Class' },
    { id: 'background', label: 'Background' },
    { id: 'lineage', label: 'Lineage' },
    { id: 'abilities', label: 'Abilities' },
    { id: 'proficiencies', label: 'Proficiencies' },
    { id: 'features', label: 'Features' },
    { id: 'techniques', label: 'Techniques' },
    { id: 'equipment', label: 'Equipment' },
] as const

type BuilderTab = (typeof BUILDER_TABS)[number]['id']

export function BuilderScreen({
    onOpenLibrary,
    onPlay,
}: {
    onOpenLibrary: () => void
    onPlay: () => void
}) {
    const { character, setCharacter } = useActiveCharacter()
    const clearNotes = useLibraryStore((state) => state.clearNotes)
    const [tab, setTab] = useState<BuilderTab>('home')

    const classes = useCollection('classes')
    const subclasses = useCollection('subclasses')
    const lineages = useCollection('lineages')
    const backgrounds = useCollection('backgrounds')
    const features = useCollection('features')
    const techniques = useCollection('techniques')

    if (!character) {
        return (
            <section className="tab-panel">
                <p>No character is open.</p>
                <button className="primary-button" type="button" onClick={onOpenLibrary}>
                    Go to My Characters
                </button>
            </section>
        )
    }

    // Panels that list backgrounds or their features should see this character's custom background too.
    const withCustom = withCustomBackground(character, { backgrounds, features })

    const filteredLineages = lineages.filter(
        (lineage) => lineage.nation === 'Any' || lineage.nation === character.nation,
    )

    return (
        <section id="panel-builder" role="tabpanel" className="tab-panel">
            <div className="play-header">
                <h2>{characterDisplayName(character)}</h2>
                <button className="primary-button" type="button" onClick={onPlay}>
                    View play sheet
                </button>
            </div>

            {character.migrationNotes.length > 0 && (
                <div className="status-message" role="status">
                    {character.migrationNotes.map((note) => (
                        <p key={note}>{note}</p>
                    ))}
                    <button
                        className="secondary-button"
                        type="button"
                        onClick={() => clearNotes(character.id)}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <div className="builder-tabs" role="navigation" aria-label="Character builder steps">
                {BUILDER_TABS.map((item) => (
                    <button
                        key={item.id}
                        className={tab === item.id ? 'active' : ''}
                        onClick={() => setTab(item.id)}
                        type="button"
                        aria-current={tab === item.id ? 'step' : undefined}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {tab === 'home' && (
                <BuilderHomePanel character={character} setCharacter={setCharacter} />
            )}

            {tab === 'class' && (
                <BuilderClassPanel
                    character={character}
                    setCharacter={setCharacter}
                    editableClasses={classes}
                    editableSubclasses={subclasses}
                    editableFeatures={features}
                />
            )}

            {tab === 'background' && (
                <BuilderBackgroundPanel
                    character={character}
                    setCharacter={setCharacter}
                    editableBackgrounds={backgrounds}
                    editableFeatures={features}
                />
            )}

            {tab === 'lineage' && (
                <BuilderLineagePanel
                    character={character}
                    setCharacter={setCharacter}
                    nations={nations}
                    filteredLineages={filteredLineages}
                    handleNationChange={(nation) =>
                        setCharacter((current) => ({ ...current, nation }))
                    }
                    editableFeatures={features}
                />
            )}

            {tab === 'abilities' && (
                <BuilderAbilitiesPanel character={character} setCharacter={setCharacter} />
            )}

            {tab === 'proficiencies' && (
                <BuilderProficienciesPanel
                    character={character}
                    setCharacter={setCharacter}
                    editableClasses={classes}
                    editableLineages={lineages}
                    editableBackgrounds={withCustom.backgrounds}
                />
            )}

            {tab === 'features' && (
                <BuilderFeaturesPanel
                    character={character}
                    setCharacter={setCharacter}
                    editableClasses={classes}
                    editableSubclasses={subclasses}
                    editableBackgrounds={withCustom.backgrounds}
                    editableLineages={lineages}
                    editableFeatures={withCustom.features}
                />
            )}

            {tab === 'techniques' && (
                <BuilderTechniquesPanel
                    character={character}
                    setCharacter={setCharacter}
                    editableClasses={classes}
                    editableTechniques={techniques}
                />
            )}

            {tab === 'equipment' && (
                <BuilderEquipmentPanel
                    character={character}
                    setCharacter={setCharacter}
                    lineage={lineages.find((item) => item.id === character.lineageId) ?? null}
                />
            )}

        </section>
    )
}
