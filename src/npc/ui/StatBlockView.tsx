import { formatModifier } from '../../engine/abilities'
import type { StatBlock } from '../statBlock'
import { NPC_PARTS } from '../types'
import type { NpcPart } from '../types'

interface Props {
    block: StatBlock
    warnings: string[]
    onReroll: (part: NpcPart) => void
}

const abbreviation = (key: string) => key.slice(0, 3).toUpperCase()

export function StatBlockView({ block, warnings, onReroll }: Props) {
    return (
        <article className="stat-block">
            <header>
                <h3>{block.name}</h3>
                <p className="muted">{block.subtitle}</p>
            </header>

            {warnings.map((warning) => (
                <p key={warning} className="status-message" role="note">
                    {warning}
                </p>
            ))}

            <p>
                <strong>AC</strong> {block.armorClass} <small className="muted">({block.armorNote})</small> · <strong>HP</strong> {block.hp} ·{' '}
                <strong>Initiative</strong> {formatModifier(block.initiative)} · <strong>Proficiency</strong> {formatModifier(block.proficiencyBonus)}
            </p>

            <ul className="npc-abilities">
                {block.abilities.map((ability) => (
                    <li key={ability.key}>
                        <strong>{abbreviation(ability.key)}</strong> {ability.score} ({formatModifier(ability.modifier)})
                    </li>
                ))}
            </ul>

            {block.saves.length > 0 && (
                <p>
                    <strong>Saves</strong> {block.saves.map((save) => `${abbreviation(save.key)} ${formatModifier(save.total)}`).join(', ')}
                </p>
            )}
            {block.skills.length > 0 && (
                <p>
                    <strong>Skills</strong> {block.skills.map((skill) => `${skill.name} ${formatModifier(skill.total)}`).join(', ')}
                </p>
            )}
            <p>
                <strong>Passive Perception</strong> {block.passives.perception}
                {block.languages.length > 0 && (
                    <>
                        {' '}
                        · <strong>Languages</strong> {block.languages.join(', ')}
                    </>
                )}
            </p>

            {block.bending && (
                <p>
                    <strong>Bending</strong> attack {formatModifier(block.bending.attackModifier)}, save DC {block.bending.saveDc}
                </p>
            )}

            {block.attacks.length > 0 && (
                <>
                    <h4>Attacks</h4>
                    <ul className="stats">
                        {block.attacks.map((attack) => (
                            <li key={attack.name}>
                                <strong>{attack.name}</strong> {formatModifier(attack.toHit)} to hit, {attack.damage}
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {block.techniques.length > 0 && (
                <>
                    <h4>Techniques</h4>
                    <ul className="stats">
                        {block.techniques.map((technique) => (
                            <li key={technique.name}>
                                <strong>{technique.name}</strong> ({technique.level})
                                {technique.save && <> · save: {technique.save}</>}
                                {technique.damage.length > 0 && <> · {technique.damage.join(', ')}</>}
                                <br />
                                <small className="muted">{technique.summary}</small>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {block.features.length > 0 && (
                <>
                    <h4>Features</h4>
                    <p>{block.features.map((feature) => feature.name).join(', ')}</p>
                </>
            )}

            <div className="reroll-row" aria-label="Reroll a part">
                <span className="muted">Reroll:</span>
                {NPC_PARTS.map((part) => (
                    <button key={part.id} type="button" className="secondary-button" onClick={() => onReroll(part.id)}>
                        {part.label}
                    </button>
                ))}
            </div>
        </article>
    )
}
