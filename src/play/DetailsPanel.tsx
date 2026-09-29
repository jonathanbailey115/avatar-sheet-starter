import { useState } from 'react'
import SectionCard from '../components/SectionCard'
import type { Sheet } from '../engine/sheet'
import type { Character } from '../types/schema'

type DetailTab = 'features' | 'proficiencies' | 'notes'

const TABS: Array<{ id: DetailTab; label: string }> = [
    { id: 'features', label: 'Features' },
    { id: 'proficiencies', label: 'Proficiencies' },
    { id: 'notes', label: 'Notes' },
]

type DetailsPanelProps = {
    character: Character
    sheet: Sheet
    lineageProficiencies: { armor: string[]; weapons: string[] }
}

export function DetailsPanel({ character, sheet, lineageProficiencies }: DetailsPanelProps) {
    const [tab, setTab] = useState<DetailTab>('features')

    return (
        <SectionCard title="Details">
            <div className="builder-tabs" role="tablist">
                {TABS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={tab === item.id}
                        className={tab === item.id ? 'active' : ''}
                        onClick={() => setTab(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {tab === 'features' && (
                <div className="detail-list">
                    {sheet.features.length === 0 && <p className="muted">No features yet.</p>}
                    {sheet.features.map(({ feature, origin }) => (
                        <details key={feature.id} className="feature-item">
                            <summary>
                                <strong>{feature.name}</strong>
                                <small className="muted"> · {origin} · {feature.featureType}</small>
                            </summary>
                            <p>{feature.description}</p>
                        </details>
                    ))}
                </div>
            )}

            {tab === 'proficiencies' && (
                <ul className="stats">
                    <li><strong>Armor:</strong> {lineageProficiencies.armor.join(', ') || 'None'}</li>
                    <li><strong>Weapons:</strong> {lineageProficiencies.weapons.join(', ') || 'None'}</li>
                    <li><strong>Tools:</strong> {character.toolProficiencies.join(', ') || 'None'}</li>
                    <li><strong>Languages:</strong> {character.languages.join(', ') || 'None'}</li>
                </ul>
            )}

            {tab === 'notes' && (
                <div className="detail-list">
                    <p><strong>Background:</strong> {character.backgroundNotes || '—'}</p>
                    <p><strong>Equipment:</strong> {character.equipmentNotes || '—'}</p>
                    <p><strong>Notes:</strong> {character.notes || '—'}</p>
                </div>
            )}
        </SectionCard>
    )
}
