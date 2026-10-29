import { ElementEmblem, ELEMENT_LABEL } from '../components/ElementEmblem'
import { elementTheme } from '../lib/element'
import type { CharacterClass } from '../types/schema'

type ClassPickerProps = {
    classes: CharacterClass[]
    value: string
    onChoose: (classId: string) => void
}

/** One card per class, with its element emblem and key ability. Works as a radio group. */
export function ClassPicker({ classes, value, onChoose }: ClassPickerProps) {
    return (
        <fieldset className="choice-fieldset">
            <legend>Class</legend>
            <div className="choice-cards" role="radiogroup" aria-label="Class">
                {classes.map((characterClass) => {
                    const checked = value === characterClass.id
                    const theme = elementTheme({ classId: characterClass.id }, classes)
                    return (
                        <button
                            key={characterClass.id}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            className={checked ? 'choice-card selected' : 'choice-card'}
                            data-element={theme}
                            onClick={() => onChoose(characterClass.id)}
                        >
                            <ElementEmblem element={theme} size="sm" />
                            <span className="choice-card-text">
                                <strong>{characterClass.name}</strong>
                                <small>
                                    {ELEMENT_LABEL[theme]} · {characterClass.primaryAbility}
                                </small>
                            </span>
                        </button>
                    )
                })}
            </div>
            {!value && <p className="muted field-hint">Pick a class to begin class progression.</p>}
        </fieldset>
    )
}
