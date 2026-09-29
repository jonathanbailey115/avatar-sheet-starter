import { useState } from 'react'
import SectionCard from '../components/SectionCard'
import { planSlotPayment, remainingSlots, restoreResource, spendResource, spendSlotsForCast } from '../engine/resources'
import type { SlotCounts } from '../engine/resources'
import type { ResourceView, Sheet } from '../engine/sheet'
import { TECHNIQUE_LEVELS } from '../types/schema'
import type { Character, TechniqueLevel } from '../types/schema'

type ResourcesPanelProps = {
    character: Character
    sheet: Sheet
    onChange: (update: (current: Character) => Character) => void
}

function Pips({
    resource,
    onSpend,
    onRestore,
}: {
    resource: ResourceView
    onSpend: () => void
    onRestore: () => void
}) {
    return (
        <div className="pip-row" role="group" aria-label={resource.name}>
            {Array.from({ length: resource.max }, (_, index) => {
                const filled = index < resource.remaining
                return (
                    <button
                        key={index}
                        type="button"
                        className={filled ? 'pip pip-on pip-button' : 'pip pip-button'}
                        aria-label={`${resource.name}: ${filled ? 'available, click to spend' : 'spent, click to restore'}`}
                        onClick={filled ? onSpend : onRestore}
                    />
                )
            })}
        </div>
    )
}

function describePayment(payment: SlotCounts): string {
    return TECHNIQUE_LEVELS.filter((level) => payment[level] > 0)
        .map((level) => `${payment[level]} ${level}`)
        .join(' + ')
}

const RECHARGE_LABEL = {
    'Short Rest': 'Short or long rest',
    'Long Rest': 'Long rest',
    Manual: 'Manual',
} as const

export function ResourcesPanel({ character, sheet, onChange }: ResourcesPanelProps) {
    const [castMessage, setCastMessage] = useState('')

    const slots = sheet.resources.filter((resource) => resource.kind === 'slot')
    const others = sheet.resources.filter((resource) => resource.kind !== 'slot')
    const available = remainingSlots(character, sheet.resources)

    const cast = (level: TechniqueLevel) => {
        const result = spendSlotsForCast(character, sheet.resources, level)
        if (!result) return
        onChange(() => result.character)
        setCastMessage(`Cast at ${level} level, spending ${describePayment(result.payment)}.`)
    }

    return (
        <SectionCard title="Resources">
            {sheet.resources.length === 0 && (
                <p className="muted">Nothing to track yet. Pick a class to see its resources.</p>
            )}

            {slots.length > 0 && (
                <div className="resource-group">
                    <h3>Technique slots</h3>
                    {slots.map((resource) => (
                        <div key={resource.id} className="resource-row">
                            <span className="resource-name">{resource.slotLevel}</span>
                            <Pips
                                resource={resource}
                                onSpend={() => onChange((c) => spendResource(c, resource))}
                                onRestore={() => onChange((c) => restoreResource(c, resource))}
                            />
                            <span className="muted">
                                {resource.remaining}/{resource.max}
                            </span>
                        </div>
                    ))}

                    <p className="muted">
                        Cast a technique: pay one slot of its level, or two slots of the level below. A
                        technique you know at a lower level can be upcast by paying a higher level.
                    </p>
                    <div className="actions inline-actions">
                        {TECHNIQUE_LEVELS.map((level) => {
                            const plan = planSlotPayment(available, level)
                            return (
                                <button
                                    key={level}
                                    className="secondary-button"
                                    type="button"
                                    disabled={!plan}
                                    title={plan ? `Spends ${describePayment(plan)}` : 'Not enough slots'}
                                    onClick={() => cast(level)}
                                >
                                    Cast at {level}
                                    {plan ? ` (${describePayment(plan)})` : ''}
                                </button>
                            )
                        })}
                    </div>
                    {castMessage && (
                        <p className="status-message" role="status">
                            {castMessage}
                        </p>
                    )}
                </div>
            )}

            {others.length > 0 && (
                <div className="resource-group">
                    <h3>Class and feature resources</h3>
                    {others.map((resource) => (
                        <div key={resource.id} className="resource-row resource-row-wide">
                            <span className="resource-name" title={resource.description}>
                                {resource.name}
                                <small className="muted"> · {RECHARGE_LABEL[resource.recharge]}</small>
                            </span>
                            <Pips
                                resource={resource}
                                onSpend={() => onChange((c) => spendResource(c, resource))}
                                onRestore={() => onChange((c) => restoreResource(c, resource))}
                            />
                            <span className="muted">
                                {resource.remaining}/{resource.max}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </SectionCard>
    )
}
