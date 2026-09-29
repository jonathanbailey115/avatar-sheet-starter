import { useState } from 'react'
import SectionCard from '../../components/SectionCard'
import { nations } from '../../types/schema'
import type { CharacterClass, Nation, NpcTemplate } from '../../types/schema'
import type { NpcSpec } from '../types'

interface Props {
    templates: NpcTemplate[]
    classes: CharacterClass[]
    onGenerate: (template: NpcTemplate, spec: NpcSpec) => void
}

/** Role, nation, class and level in one place. "Any" leaves the choice to the role's weights. */
export function QuickCreate({ templates, classes, onGenerate }: Props) {
    const [role, setRole] = useState('')
    const [nation, setNation] = useState<Nation | ''>('')
    const [classId, setClassId] = useState('')
    const [level, setLevel] = useState(3)

    // Read the live template so edited weights take effect immediately.
    const template = templates.find((item) => item.role === role) ?? templates[0]

    if (!template) {
        return (
            <SectionCard title="Quick create">
                <p>No NPC roles yet. Add one under Campaign Data.</p>
            </SectionCard>
        )
    }

    return (
        <SectionCard title="Quick create">
            <label>
                Role
                <select value={template.role} onChange={(event) => setRole(event.target.value)}>
                    {templates.map((item) => (
                        <option key={item.role}>{item.role}</option>
                    ))}
                </select>
            </label>
            <label>
                Nation
                <select value={nation} onChange={(event) => setNation(event.target.value as Nation | '')}>
                    <option value="">Any (by role)</option>
                    {nations.map((item) => (
                        <option key={item}>{item}</option>
                    ))}
                </select>
            </label>
            <label>
                Class
                <select value={classId} onChange={(event) => setClassId(event.target.value)}>
                    <option value="">Any (by role)</option>
                    {classes.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                            {item.element ? '' : ' (non-bender)'}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Level
                <input
                    type="number"
                    min={1}
                    max={20}
                    value={level}
                    onChange={(event) => setLevel(Math.min(20, Math.max(1, Number(event.target.value) || 1)))}
                />
            </label>
            <div className="actions inline-actions">
                <button
                    className="primary-button"
                    type="button"
                    onClick={() => onGenerate(template, { nation: nation || null, classId: classId || null, level })}
                >
                    Generate NPC
                </button>
            </div>
        </SectionCard>
    )
}
