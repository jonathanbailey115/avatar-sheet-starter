import { HpBar } from '../components/HpBar'
import { ABILITY_NAMES, formatModifier } from '../engine/abilities'
import type { Sheet } from '../engine/sheet'
import { ElementEmblem, ELEMENT_LABEL } from '../components/ElementEmblem'
import type { ElementTheme } from '../lib/element'
import { useRoll } from './RollContext'

type PlayHeaderProps = {
    name: string
    subtitle: string
    element: ElementTheme
    sheet: Sheet
    onEdit: () => void
}

/** Name, class line and element chip. On phones a compact AC / HP / Initiative strip sticks under it. */
export function PlayHeader({ name, subtitle, element, sheet, onEdit }: PlayHeaderProps) {
    const { rollCheck } = useRoll()
    const chip = sheet.bending
        ? `${ELEMENT_LABEL[element]} · ${ABILITY_NAMES[sheet.bending.ability]}`
        : ELEMENT_LABEL[element]

    return (
        <>
            <header className="play-hero">
                <ElementEmblem element={element} />
                <div className="play-hero-text">
                    <div className="play-hero-title">
                        <h2>{name}</h2>
                        <span className="element-chip">{chip}</span>
                    </div>
                    <p className="muted">{subtitle}</p>
                </div>
                <button className="secondary-button play-edit" type="button" onClick={onEdit}>
                    Edit character
                </button>
            </header>

            <div className="play-quick" aria-label="Quick stats">
                <div className="quick-tile">
                    <span>AC</span>
                    <strong>{sheet.armorClass.total}</strong>
                </div>
                <div className="quick-tile quick-hp">
                    <div className="quick-hp-top">
                        <span>HP</span>
                        <strong>{sheet.currentHp}</strong>
                        <small>/{sheet.maxHp}</small>
                    </div>
                    <HpBar current={sheet.currentHp} max={sheet.maxHp} label="Hit points" />
                </div>
                <button
                    type="button"
                    className="quick-tile quick-roll"
                    aria-label={`Roll initiative, ${formatModifier(sheet.initiative.total)}`}
                    onClick={(event) => rollCheck('Initiative', 'initiative', sheet.initiative, event)}
                >
                    <span>Init</span>
                    <strong>{formatModifier(sheet.initiative.total)}</strong>
                </button>
            </div>
        </>
    )
}
