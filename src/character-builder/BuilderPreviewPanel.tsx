import { useMemo, useState } from 'react'
import type {
    AbilityName,
    Background,
    Character,
    CharacterClass,
    CharacterSubclass,
    Feature,
    Lineage,
    SkillName,
} from '../types/schema'

type BuilderPreviewPanelProps = {
    character: Character
    editableClasses: CharacterClass[]
    editableSubclasses: CharacterSubclass[]
    editableBackgrounds: Background[]
    editableLineages: Lineage[]
    editableFeatures: Feature[]
}

type PreviewDetailTab = 'features' | 'techniques' | 'notes'

type AbilitySummary = {
    key: AbilityName
    shortLabel: string
    score: number
}

type SkillSummary = {
    name: SkillName
    ability: AbilityName
}

const abilityLabels: Record<AbilityName, string> = {
    strength: 'STR',
    dexterity: 'DEX',
    constitution: 'CON',
    intelligence: 'INT',
    wisdom: 'WIS',
    charisma: 'CHA',
}

const skillAbilityMap: SkillSummary[] = [
    { name: 'Acrobatics', ability: 'dexterity' },
    { name: 'Animal Handling', ability: 'wisdom' },
    { name: 'Arcana', ability: 'intelligence' },
    { name: 'Athletics', ability: 'strength' },
    { name: 'Deception', ability: 'charisma' },
    { name: 'History', ability: 'intelligence' },
    { name: 'Insight', ability: 'wisdom' },
    { name: 'Intimidation', ability: 'charisma' },
    { name: 'Investigation', ability: 'intelligence' },
    { name: 'Medicine', ability: 'wisdom' },
    { name: 'Nature', ability: 'intelligence' },
    { name: 'Perception', ability: 'wisdom' },
    { name: 'Performance', ability: 'charisma' },
    { name: 'Persuasion', ability: 'charisma' },
    { name: 'Religion', ability: 'intelligence' },
    { name: 'Sleight of Hand', ability: 'dexterity' },
    { name: 'Stealth', ability: 'dexterity' },
    { name: 'Survival', ability: 'wisdom' },
]

const getAbilityModifier = (score: number) => Math.floor((score - 10) / 2)

const formatModifier = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

const formatList = (items: string[]) => (items.length > 0 ? items.join(', ') : 'None')

const getProficiencyBonus = (level: number) => {
    if (level >= 17) return 6
    if (level >= 13) return 5
    if (level >= 9) return 4
    if (level >= 5) return 3
    return 2
}

export function BuilderPreviewPanel({
    character,
    editableClasses,
    editableSubclasses,
    editableBackgrounds,
    editableLineages,
    editableFeatures,
}: BuilderPreviewPanelProps) {
    const [activeDetailTab, setActiveDetailTab] = useState<PreviewDetailTab>('features')

    const selectedClass =
        editableClasses.find((item) => item.id === character.classId) ?? null

    const selectedSubclass =
        editableSubclasses.find((item) => item.id === character.subclassId) ?? null

    const selectedBackground =
        editableBackgrounds.find((item) => item.id === character.backgroundId) ?? null

    const selectedLineage =
        editableLineages.find((item) => item.id === character.lineageId) ?? null

    const selectedFeatures = useMemo(() => {
        const classFeatureIds =
            selectedClass?.featureGrants
                .filter((grant) => grant.level <= character.level)
                .map((grant) => grant.featureId) ?? []

        const subclassFeatureIds =
            selectedSubclass?.featureGrants
                .filter((grant) => grant.level <= character.level)
                .map((grant) => grant.featureId) ?? []

        const backgroundFeatureIds = selectedBackground?.featureIds ?? []

        const lineageFeatureIds = selectedLineage?.featureIds ?? []

        const combinedFeatureIds = Array.from(
            new Set([
                ...classFeatureIds,
                ...subclassFeatureIds,
                ...backgroundFeatureIds,
                ...lineageFeatureIds,
                ...character.selectedFeatureIds,
            ]),
        )

        return combinedFeatureIds
            .map((featureId) => editableFeatures.find((item) => item.id === featureId))
            .filter((feature): feature is Feature => Boolean(feature))
    }, [
        selectedClass,
        selectedSubclass,
        selectedBackground,
        selectedLineage,
        character.level,
        character.selectedFeatureIds,
        editableFeatures,
    ])

    const abilities: AbilitySummary[] = [
        { key: 'strength', shortLabel: 'STR', score: character.strength },
        { key: 'dexterity', shortLabel: 'DEX', score: character.dexterity },
        { key: 'constitution', shortLabel: 'CON', score: character.constitution },
        { key: 'intelligence', shortLabel: 'INT', score: character.intelligence },
        { key: 'wisdom', shortLabel: 'WIS', score: character.wisdom },
        { key: 'charisma', shortLabel: 'CHA', score: character.charisma },
    ]

    const abilityScores: Record<AbilityName, number> = {
        strength: character.strength,
        dexterity: character.dexterity,
        constitution: character.constitution,
        intelligence: character.intelligence,
        wisdom: character.wisdom,
        charisma: character.charisma,
    }

    const proficiencyBonus = getProficiencyBonus(character.level)
    const dexModifier = getAbilityModifier(character.dexterity)
    const wisdomModifier = getAbilityModifier(character.wisdom)
    const intelligenceModifier = getAbilityModifier(character.intelligence)
    const initiative = dexModifier
    const defense = 10 + dexModifier

    const skills = skillAbilityMap.map((skill) => {
        const baseModifier = getAbilityModifier(abilityScores[skill.ability])
        const isProficient = character.skillProficiencies.includes(skill.name)
        const total = baseModifier + (isProficient ? proficiencyBonus : 0)

        return {
            ...skill,
            total,
            isProficient,
            shortAbility: abilityLabels[skill.ability],
        }
    })

    const savingThrows = abilities.map((ability) => {
        const baseModifier = getAbilityModifier(ability.score)
        const isProficient = character.savingThrowProficiencies.includes(ability.key)
        const total = baseModifier + (isProficient ? proficiencyBonus : 0)

        return {
            label: ability.shortLabel,
            ability: ability.key,
            total,
            isProficient,
        }
    })

    const passivePerception =
        10 +
        wisdomModifier +
        (character.skillProficiencies.includes('Perception') ? proficiencyBonus : 0)

    const passiveInsight =
        10 +
        wisdomModifier +
        (character.skillProficiencies.includes('Insight') ? proficiencyBonus : 0)

    const passiveInvestigation =
        10 +
        intelligenceModifier +
        (character.skillProficiencies.includes('Investigation') ? proficiencyBonus : 0)

    const identityChips = [
        selectedClass?.name ?? 'No class',
        selectedSubclass?.name ?? 'No subclass',
        selectedBackground?.name ?? 'No background',
        selectedLineage?.name ?? 'No lineage',
        character.bendingType,
        character.style || 'No style',
    ]

    return (
        <section className="preview-shell" aria-label="Character sheet preview">
            <div className="preview-frame">
                <div className="preview-hero">
                    <div className="preview-topbar">
                        <div className="preview-title-group">
                            <p className="preview-eyebrow">{character.role}</p>
                            <h2>{character.name || 'Unnamed Character'}</h2>
                            <p className="preview-subtitle">
                                Level {character.level} · {character.nation}
                            </p>
                        </div>

                        <div className="preview-vitals">
                            <article className="preview-vital-chip">
                                <span>HP</span>
                                <strong>{character.hp}</strong>
                            </article>
                            <article className="preview-vital-chip">
                                <span>Chi</span>
                                <strong>{character.chi}</strong>
                            </article>
                            <article className="preview-vital-chip">
                                <span>Prof</span>
                                <strong>{formatModifier(proficiencyBonus)}</strong>
                            </article>
                        </div>
                    </div>

                    <div className="preview-chip-row">
                        {identityChips.map((chip) => (
                            <span key={chip} className="preview-meta-chip">
                                {chip}
                            </span>
                        ))}
                    </div>

                    <div className="preview-hero-grid">
                        <div className="preview-ability-row">
                            {abilities.map((ability) => (
                                <article key={ability.key} className="preview-ability-tile">
                                    <span>{ability.shortLabel}</span>
                                    <strong>{formatModifier(getAbilityModifier(ability.score))}</strong>
                                    <small>{ability.score}</small>
                                </article>
                            ))}
                        </div>

                        <div className="preview-summary-metrics">
                            <article className="preview-metric-card">
                                <span>Initiative</span>
                                <strong>{formatModifier(initiative)}</strong>
                            </article>
                            <article className="preview-metric-card">
                                <span>Defense</span>
                                <strong>{defense}</strong>
                            </article>
                            <article className="preview-metric-card">
                                <span>Passive Perception</span>
                                <strong>{passivePerception}</strong>
                            </article>
                            <article className="preview-metric-card">
                                <span>Passive Insight</span>
                                <strong>{passiveInsight}</strong>
                            </article>
                            <article className="preview-metric-card">
                                <span>Passive Investigation</span>
                                <strong>{passiveInvestigation}</strong>
                            </article>
                        </div>
                    </div>
                </div>

                <div className="preview-grid">
                    <aside className="preview-sidebar">
                        <section className="preview-panel preview-panel-muted">
                            <h3>Saving Throws</h3>
                            <ul className="preview-stat-list">
                                {savingThrows.map((save) => (
                                    <li key={save.ability}>
                                        <span className={`preview-dot ${save.isProficient ? 'active' : ''}`} />
                                        <span className="preview-stat-label">{save.label}</span>
                                        <span className="preview-stat-value">{formatModifier(save.total)}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="preview-panel preview-panel-muted">
                            <h3>Skills</h3>
                            <ul className="preview-skill-list">
                                {skills.map((skill) => (
                                    <li key={skill.name}>
                                        <span className={`preview-dot ${skill.isProficient ? 'active' : ''}`} />
                                        <span className="preview-skill-ability">{skill.shortAbility}</span>
                                        <span className="preview-skill-name">{skill.name}</span>
                                        <span className="preview-skill-value">{formatModifier(skill.total)}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="preview-panel preview-panel-muted">
                            <h3>Equipment</h3>
                            <dl className="preview-definition-list">
                                <div>
                                    <dt>Armor</dt>
                                    <dd>{character.armorName || 'None listed'}</dd>
                                </div>
                                <div>
                                    <dt>Weapons</dt>
                                    <dd>{character.weaponNotes || 'None listed'}</dd>
                                </div>
                                <div>
                                    <dt>Tools</dt>
                                    <dd>{formatList(character.toolProficiencies)}</dd>
                                </div>
                                <div>
                                    <dt>Languages</dt>
                                    <dd>{formatList(character.languages)}</dd>
                                </div>
                                <div>
                                    <dt>Currency</dt>
                                    <dd>{character.currency || 'None listed'}</dd>
                                </div>
                            </dl>

                            <div className="preview-subsection">
                                <p className="preview-subsection-title">Inventory</p>
                                <ul className="preview-list preview-list-compact">
                                    {character.inventoryItems.length > 0 ? (
                                        character.inventoryItems.map((item, index) => (
                                            <li key={`${item}-${index}`}>{item}</li>
                                        ))
                                    ) : (
                                        <li>No inventory items listed.</li>
                                    )}
                                </ul>
                            </div>
                        </section>

                        <section className="preview-panel preview-panel-muted">
                            <h3>Traits</h3>
                            <dl className="preview-definition-list">
                                <div>
                                    <dt>Personality</dt>
                                    <dd>{character.personality || '—'}</dd>
                                </div>
                                <div>
                                    <dt>Ideals</dt>
                                    <dd>{character.ideals || '—'}</dd>
                                </div>
                                <div>
                                    <dt>Bonds</dt>
                                    <dd>{character.bonds || '—'}</dd>
                                </div>
                                <div>
                                    <dt>Flaws</dt>
                                    <dd>{character.flaws || '—'}</dd>
                                </div>
                            </dl>
                        </section>
                    </aside>

                    <div className="preview-main">
                        <section className="preview-summary-strip preview-panel">
                            <div>
                                <span>Class</span>
                                <strong>{selectedClass?.name ?? 'No class selected'}</strong>
                            </div>
                            <div>
                                <span>Subclass</span>
                                <strong>{selectedSubclass?.name ?? 'No subclass selected'}</strong>
                            </div>
                            <div>
                                <span>Background</span>
                                <strong>{selectedBackground?.name ?? 'No background selected'}</strong>
                            </div>
                            <div>
                                <span>Lineage</span>
                                <strong>{selectedLineage?.name ?? 'No lineage selected'}</strong>
                            </div>
                        </section>

                        <section className="preview-panel preview-detail-panel">
                            <div className="preview-detail-header">
                                <div>
                                    <p className="preview-section-kicker">Reference</p>
                                    <h3>Character Details</h3>
                                </div>

                                <div
                                    className="preview-detail-tabs"
                                    role="tablist"
                                    aria-label="Character detail sections"
                                >
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={activeDetailTab === 'features'}
                                        className={
                                            activeDetailTab === 'features'
                                                ? 'preview-detail-tab active'
                                                : 'preview-detail-tab'
                                        }
                                        onClick={() => setActiveDetailTab('features')}
                                    >
                                        Features
                                    </button>
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={activeDetailTab === 'techniques'}
                                        className={
                                            activeDetailTab === 'techniques'
                                                ? 'preview-detail-tab active'
                                                : 'preview-detail-tab'
                                        }
                                        onClick={() => setActiveDetailTab('techniques')}
                                    >
                                        Techniques
                                    </button>
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={activeDetailTab === 'notes'}
                                        className={
                                            activeDetailTab === 'notes'
                                                ? 'preview-detail-tab active'
                                                : 'preview-detail-tab'
                                        }
                                        onClick={() => setActiveDetailTab('notes')}
                                    >
                                        Notes
                                    </button>
                                </div>
                            </div>

                            {activeDetailTab === 'features' && (
                                <div className="preview-detail-body preview-detail-body-scroll">
                                    <ul className="preview-list preview-list-detailed preview-list-elevated">
                                        {selectedFeatures.length > 0 ? (
                                            selectedFeatures.map((feature) => (
                                                <li key={feature.id}>
                                                    <div className="preview-list-heading">
                                                        <strong>{feature.name}</strong>
                                                        <span>{feature.featureType}</span>
                                                    </div>
                                                    <p>{feature.description}</p>
                                                </li>
                                            ))
                                        ) : (
                                            <li>No features selected yet.</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {activeDetailTab === 'techniques' && (
                                <div className="preview-detail-body preview-detail-body-scroll">
                                    <ul className="preview-list preview-list-detailed preview-list-elevated">
                                        {character.techniques.length > 0 ? (
                                            character.techniques.map((technique) => (
                                                <li key={technique.id}>
                                                    <div className="preview-list-heading">
                                                        <strong>{technique.name}</strong>
                                                        <span>Tier {technique.tier}</span>
                                                    </div>
                                                    <p>{technique.description}</p>
                                                </li>
                                            ))
                                        ) : (
                                            <li>No techniques selected yet.</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {activeDetailTab === 'notes' && (
                                <div className="preview-detail-body">
                                    <div className="preview-notes-grid">
                                        <article className="preview-note-card">
                                            <span>Background Notes</span>
                                            <p>{character.backgroundNotes || '—'}</p>
                                        </article>
                                        <article className="preview-note-card">
                                            <span>Equipment Notes</span>
                                            <p>{character.equipmentNotes || '—'}</p>
                                        </article>
                                        <article className="preview-note-card preview-note-card-wide">
                                            <span>General Notes</span>
                                            <p>{character.notes || '—'}</p>
                                        </article>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </section>
    )
}