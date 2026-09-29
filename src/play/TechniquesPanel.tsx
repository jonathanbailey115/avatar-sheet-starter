import SectionCard from '../components/SectionCard'
import { limitStatus } from '../engine/techniques'
import type { Sheet } from '../engine/sheet'
import { trainingSlotsUsed } from '../engine/training'
import type { Character, CharacterClass, Technique } from '../types/schema'
import { MAX_TRAINING_SLOTS } from '../types/schema'
import { TechniqueCard } from './TechniqueCard'

type TechniquesPanelProps = {
    character: Character
    sheet: Sheet
    characterClass: CharacterClass | undefined
    techniques: Technique[]
    onChange: (update: (current: Character) => Character) => void
}

export function TechniquesPanel({ character, sheet, characterClass, techniques, onChange }: TechniquesPanelProps) {
    const limits = limitStatus(character, characterClass, techniques)
    const shown = character.knownTechniques.flatMap((known) => {
        const technique = techniques.find((item) => item.id === known.techniqueId)
        return technique ? [{ known, technique }] : []
    })

    return (
        <SectionCard title="Techniques">
            <p className="muted technique-summary">
                {limits.map((entry) => `${entry.limit.label} ${entry.used}/${entry.max}`).join(' · ')}
                {limits.length > 0 && sheet.bending ? ' · ' : ''}
                {sheet.bending ? `Training ${trainingSlotsUsed(character)}/${MAX_TRAINING_SLOTS}` : ''}
            </p>

            {shown.length === 0 ? (
                <p className="muted">
                    No techniques learned yet. Choose them on the Techniques step in the character builder.
                </p>
            ) : (
                <div className="detail-list">
                    {shown.map(({ known, technique }) => (
                        <TechniqueCard
                            key={known.techniqueId}
                            character={character}
                            sheet={sheet}
                            technique={technique}
                            known={known}
                            onChange={onChange}
                        />
                    ))}
                </div>
            )}
        </SectionCard>
    )
}
