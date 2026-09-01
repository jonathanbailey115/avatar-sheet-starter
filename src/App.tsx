import { FormEvent, useEffect, useMemo, useState } from 'react'
import SectionCard from './components/SectionCard'
import {
    lineages,
    npcTemplates,
    sampleCharacter,
    styles,
    techniques,
    features,
    characterClasses,
    characterSubclasses,
    backgrounds,
} from './data/seed'
import { generateNpc } from './lib/generator'
import {
    deriveSavingThrowProficiencies,
    deriveSkillProficiencies,
    isSameSequence,
    resolveProficiencyContext,
} from './lib/proficiencies'
import { bendingTypes, nations } from './types/schema'
import { CampaignSummaryPanel } from './campaign-data/CampaignSummaryPanel'
import { LineagesPanel } from './campaign-data/LineagesPanel'
import { NpcTemplatesPanel } from './campaign-data/NpcTemplatesPanel'
import { StylesPanel } from './campaign-data/StylesPanel'
import { TechniquesPanel } from './campaign-data/TechniquesPanel'
//import { BuilderOverviewPanel } from './character-builder/BuilderOverviewPanel'
import { BuilderHomePanel } from './character-builder/BuilderHomePanel'
import { BuilderClassPanel } from './character-builder/BuilderClassPanel'
import { BuilderBackgroundPanel } from './character-builder/BuilderBackgroundPanel'
import { BuilderLineagePanel } from './character-builder/BuilderLineagePanel'
import { BuilderTechniquesPanel } from './character-builder/BuilderTechniquesPanel'
import { BuilderEquipmentPanel } from './character-builder/BuilderEquipmentPanel'
import { BuilderAbilitiesPanel } from './character-builder/BuilderAbilitiesPanel'
import { BuilderPreviewPanel } from './character-builder/BuilderPreviewPanel'
import { BuilderProficienciesPanel } from './character-builder/BuilderProficienciesPanel'
import { FeaturesPanel } from './campaign-data/FeaturesPanel'
import { BuilderFeaturesPanel } from './character-builder/BuilderFeaturesPanel'
import type {
    BendingType,
    Character,
    Feature,
    Nation,
    NpcTemplate,
    Technique,
} from './types/schema'

type AppTab = 'builder' | 'npc' | 'data'

function downloadJson(data: unknown, filename: string) {
    const fileContents = JSON.stringify(data, null, 2)
    const blob = new Blob([fileContents], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}

export default function App() {
    const [activeTab, setActiveTab] = useState<AppTab>('builder')
    const [character, setCharacter] = useState<Character>(sampleCharacter)
    const [npcs, setNpcs] = useState<Character[]>([])
    const [selectedRole, setSelectedRole] = useState(npcTemplates[0].role)
    const [editingNpcId, setEditingNpcId] = useState<string | null>(null)
    const [npcDraft, setNpcDraft] = useState<Character | null>(null)
    const [editableLineages, setEditableLineages] = useState(lineages)
    const [editableStyles, setEditableStyles] = useState(styles)
    const [editableTechniques, setEditableTechniques] = useState(techniques)
    const [campaignMessage, setCampaignMessage] = useState<string>('')
    const [editingLineageId, setEditingLineageId] = useState<string | null>(null)
    const [editingStyleId, setEditingStyleId] = useState<string | null>(null)
    const [editingTechniqueId, setEditingTechniqueId] = useState<string | null>(null)
    const [editableNpcTemplates, setEditableNpcTemplates] = useState(npcTemplates)
    const [editingNpcTemplateRole, setEditingNpcTemplateRole] = useState<string | null>(null)
    const [editableFeatures, setEditableFeatures] = useState(features)
    const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null)
    const [editableBackgrounds, setEditableBackgrounds] = useState(backgrounds)
    const selectedNpcBackground =
        npcDraft
            ? editableBackgrounds.find((background) => background.id === npcDraft.backgroundId) ?? null
            : null
    const selectedLineage =
        editableLineages.find((lineage) => lineage.id === character.lineageId) ?? null
    const selectedNpcLineage =
        npcDraft
            ? editableLineages.find((lineage) => lineage.id === npcDraft.lineageId) ?? null
            : null
    const [campaignDataTab, setCampaignDataTab] = useState<
        'summary' | 'lineages' | 'styles' | 'techniques' | 'features' | 'templates'
    >('summary')
    type BuilderTab =
        | 'home'
        | 'class'
        | 'background'
        | 'lineage'
        | 'abilities'
        | 'proficiencies'
        | 'features'
        | 'techniques'
        | 'equipment'
        | 'preview'

    const [builderTab, setBuilderTab] = useState<BuilderTab>('home')
    const [editableClasses, setEditableClasses] = useState(characterClasses)
    const [editableSubclasses, setEditableSubclasses] = useState(characterSubclasses)

    const availableTemplate = useMemo(
        () => editableNpcTemplates.find((template) => template.role === selectedRole) ?? editableNpcTemplates[0],
        [selectedRole],
    )

    const filteredLineages = useMemo(
        () =>
            editableLineages.filter(
                (lineage) => lineage.nation === 'Any' || lineage.nation === character.nation,
            ),
        [editableLineages, character.nation],
    )

    const filteredStyles = useMemo(
        () =>
            editableStyles.filter(
                (style) =>
                    style.bendingType === character.bendingType &&
                    (style.nation === 'Any' || style.nation === character.nation),
            ),
        [editableStyles, character.bendingType, character.nation],
    )

    const filteredTechniques = useMemo(
        () =>
            editableTechniques.filter(
                (technique) => technique.bendingType === character.bendingType),
        [editableTechniques, character.bendingType],
    )

    const npcLineages = useMemo(
        () =>
            editableLineages.filter(
                (lineage) => !npcDraft || lineage.nation === 'Any' || lineage.nation === npcDraft.nation,
            ),
        [editableLineages, npcDraft],
    )

    const npcStyles = useMemo(
        () =>
            editableStyles.filter(
                (style) =>
                    !npcDraft ||
                    (style.bendingType === npcDraft.bendingType &&
                        (style.nation === 'Any' || style.nation === npcDraft.nation)),
            ),
        [editableStyles, npcDraft],
    )

    const handleNationChange = (nation: Character['nation']) => {
        setCharacter((current) => {
            const nextLineages = editableLineages.filter(
                (lineage) => lineage.nation === 'Any' || lineage.nation === nation,
            )

            const nextStyles = editableStyles.filter(
                (style) =>
                    style.bendingType === current.bendingType &&
                    (style.nation === 'Any' || style.nation === nation),
            )

            const currentLineageStillValid = nextLineages.some(
                (lineage) => lineage.id === current.lineageId,
            )

            const currentStyleStillValid = nextStyles.some(
                (style) => style.name === current.style,
            )

            if (currentLineageStillValid) {
                return {
                    ...current,
                    nation,
                    lineageId: current.lineageId,
                    style: currentStyleStillValid ? current.style : '',
                }
            }

            return {
                ...current,
                nation,
                lineageId: '',
                lineageSavingThrowChoices: [],
                lineageSkillChoices: [],
                lineageToolChoices: [],
                style: currentStyleStillValid ? current.style : '',
            }
        })
    }

    const handleBendingTypeChange = (bendingType: BendingType) => {
        setCharacter((current) => {
            const nextStyles = editableStyles.filter(
                (style) =>
                    style.bendingType === bendingType &&
                    (style.nation === 'Any' || style.nation === current.nation),
            )

            const currentStyleStillValid = nextStyles.some(
                (style) => style.name === current.style,
            )

            const nextTechniques = current.techniques.filter(
                (technique) => technique.bendingType === bendingType,
            )

            return {
                ...current,
                bendingType,
                style: currentStyleStillValid ? current.style : '',
                techniques: nextTechniques,
                chi: bendingType === 'Non-Bender' ? 0 : current.chi > 0 ? current.chi : 3,
            }
        })
    }

    const handleTechniqueToggle = (technique: Technique) => {
        setCharacter((current) => {
            const alreadySelected = current.techniques.some((item) => item.id === technique.id)

            if (alreadySelected) {
                return {
                    ...current,
                    techniques: current.techniques.filter((item) => item.id !== technique.id),
                }
            }

            return {
                ...current,
                techniques: [...current.techniques, technique],
            }
        })
    }

    const emptyNationWeights = (): Partial<Record<Nation, number>> => ({
        'Air Nomads': 0,
        'Water Tribe': 0,
        'Earth Kingdom': 0,
        'Fire Nation': 0,
        Mixed: 0,
    })

    const emptyBendingWeights = (): Partial<Record<BendingType, number>> => ({
        Air: 0,
        Water: 0,
        Earth: 0,
        Fire: 0,
        'Non-Bender': 0,
    })

    const deleteNpcTemplate = (role: string) => {
        setCampaignMessage('')

        if (editableNpcTemplates.length <= 1) {
            setCampaignMessage('You must keep at least one NPC template.')
            return
        }

        const nextTemplates = editableNpcTemplates.filter((template) => template.role !== role)
        setEditableNpcTemplates(nextTemplates)

        if (selectedRole === role) {
            setSelectedRole(nextTemplates[0]?.role ?? '')
        }

        setEditingNpcTemplateRole(null)
        setCampaignMessage('NPC template deleted.')
    }

    const saveNpcTemplateEdit = (
        originalRole: string,
        updates: NpcTemplate,
    ) => {
        setEditableNpcTemplates((current) =>
            current.map((template) =>
                template.role === originalRole ? updates : template,
            ),
        )

        if (selectedRole === originalRole) {
            setSelectedRole(updates.role)
        }

        setEditingNpcTemplateRole(null)
        setCampaignMessage('NPC template updated.')
    }

    const formatWeightSummary = (entries: ReadonlyArray<readonly [string, number]>) => {
        if (entries.length === 0) return 'No weights set.'
        if (entries.length === 1) return `Strongly favors ${entries[0][0]}.`
        return `Leans ${entries[0][0]}, with ${entries[1][0]} as a secondary result.`
    }

    const getSortedNationWeights = (weights: Partial<Record<Nation, number>>) =>
        nations
            .map((nation) => [nation, weights[nation] ?? 0] as const)
            .filter(([, value]) => value > 0)
            .sort((a, b) => b[1] - a[1])

    const getSortedBendingWeights = (weights: Partial<Record<BendingType, number>>) =>
        bendingTypes
            .map((type) => [type, weights[type] ?? 0] as const)
            .filter(([, value]) => value > 0)
            .sort((a, b) => b[1] - a[1])

    const selectedNpcTemplate = useMemo(
        () =>
            editableNpcTemplates.find((template) => template.role === selectedRole) ??
            editableNpcTemplates[0] ??
            null,
        [editableNpcTemplates, selectedRole],
    )

    const selectedNationLeads = selectedNpcTemplate
        ? getSortedNationWeights(selectedNpcTemplate.nationWeights).slice(0, 2)
        : []

    const selectedBendingLeads = selectedNpcTemplate
        ? getSortedBendingWeights(selectedNpcTemplate.bendingWeights).slice(0, 2)
        : []

    const nationSummary = formatWeightSummary(selectedNationLeads)
    const bendingSummary = formatWeightSummary(selectedBendingLeads)

    const pickWeighted = <T,>(entries: Array<{ item: T; weight: number }>): T | null => {
        const validEntries = entries.filter((entry) => entry.weight > 0)

        if (validEntries.length === 0) {
            return null
        }

        const total = validEntries.reduce((sum, entry) => sum + entry.weight, 0)
        let roll = Math.random() * total

        for (const entry of validEntries) {
            roll -= entry.weight
            if (roll <= 0) {
                return entry.item
            }
        }

        return validEntries[validEntries.length - 1]?.item ?? null
    }

    const exportCharacter = () => {
        downloadJson(
            character,
            `${character.name.toLowerCase().replace(/\s+/g, '-') || 'character'}.json`,
        )
    }

    const exportCampaignData = () => {
        const payload = {
            nations,
            lineages: editableLineages,
            styles: editableStyles,
            techniques: editableTechniques,
            npcTemplates: editableNpcTemplates,
        }

        downloadJson(payload, 'campaign-data.json')
    }

    const importCampaignData = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            const text = await file.text()
            const parsed = JSON.parse(text)

            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid JSON structure.')
            }

            if (Array.isArray(parsed.lineages)) {
                setEditableLineages(parsed.lineages)
            }

            if (Array.isArray(parsed.styles)) {
                setEditableStyles(parsed.styles)
            }

            if (Array.isArray(parsed.techniques)) {
                setEditableTechniques(parsed.techniques)
            }

            if (Array.isArray(parsed.npcTemplates)) {
                setEditableNpcTemplates(parsed.npcTemplates)
                if (parsed.npcTemplates.length > 0) {
                    setSelectedRole(parsed.npcTemplates[0].role)
                }
            }

            setCampaignMessage('Campaign data imported successfully.')
        } catch (error) {
            setCampaignMessage('Could not import campaign JSON. Please check the file format.')
        } finally {
            event.target.value = ''
        }
    }

    const startEditingNpc = (npc: Character) => {
        setEditingNpcId(npc.id)
        setNpcDraft({ ...npc })
        setActiveTab('npc')
    }

    const cancelEditingNpc = () => {
        setEditingNpcId(null)
        setNpcDraft(null)
    }

    const saveNpcDraft = () => {
        if (!npcDraft || !editingNpcId) return

        setNpcs((current) =>
            current.map((npc) => (npc.id === editingNpcId ? npcDraft : npc)),
        )

        setEditingNpcId(null)
        setNpcDraft(null)
    }

    const updateNpcNation = (nation: Character['nation']) => {
        if (!npcDraft) return

        const nextLineages = editableLineages.filter(
            (lineage) => lineage.nation === 'Any' || lineage.nation === nation,
        )

        const nextStyles = editableStyles.filter(
            (style) =>
                style.bendingType === npcDraft.bendingType &&
                (style.nation === 'Any' || style.nation === nation),
        )

        const currentLineageStillValid = nextLineages.some(
            (lineage) => lineage.id === npcDraft.lineageId,
        )

        const currentStyleStillValid = nextStyles.some(
            (style) => style.name === npcDraft.style,
        )

        setNpcDraft({
            ...npcDraft,
            nation,
            lineageId: currentLineageStillValid ? npcDraft.lineageId : '',
            style: currentStyleStillValid ? npcDraft.style : '',
        })
    }

    const updateNpcBendingType = (bendingType: BendingType) => {
        if (!npcDraft) return

        const nextStyles = editableStyles.filter(
            (style) =>
                style.bendingType === bendingType &&
                (style.nation === 'Any' || style.nation === npcDraft.nation),
        )

        const currentStyleStillValid = nextStyles.some(
            (style) => style.name === npcDraft.style,
        )

        const nextTechniques = npcDraft.techniques.filter(
            (technique) => technique.bendingType === bendingType,
        )

        setNpcDraft({
            ...npcDraft,
            bendingType,
            style: currentStyleStillValid ? npcDraft.style : '',
            chi: bendingType === 'Non-Bender' ? 0 : npcDraft.chi || 2,
            techniques: nextTechniques,
        })
    }

    const filteredNpcTechniques = useMemo(
        () =>
            !npcDraft
                ? []
                : editableTechniques.filter(
                    (technique) => technique.bendingType === npcDraft.bendingType,
                ),
        [editableTechniques, npcDraft],
    )

    const handleNpcTechniqueToggle = (technique: Technique) => {
        if (!npcDraft) return

        const alreadySelected = npcDraft.techniques.some((item) => item.id === technique.id)

        if (alreadySelected) {
            setNpcDraft({
                ...npcDraft,
                techniques: npcDraft.techniques.filter((item) => item.id !== technique.id),
            })
            return
        }

        setNpcDraft({
            ...npcDraft,
            techniques: [...npcDraft.techniques, technique],
        })
    }

    const deleteTechnique = (techniqueId: string) => {
        setCampaignMessage('')

        setEditableTechniques((current) =>
            current.filter((technique) => technique.id !== techniqueId),
        )

        setCharacter((current) => ({
            ...current,
            techniques: current.techniques.filter((technique) => technique.id !== techniqueId),
        }))

        setNpcs((current) =>
            current.map((npc) => ({
                ...npc,
                techniques: npc.techniques.filter((technique) => technique.id !== techniqueId),
            })),
        )

        setNpcDraft((current) =>
            current
                ? {
                    ...current,
                    techniques: current.techniques.filter(
                        (technique) => technique.id !== techniqueId,
                    ),
                }
                : null,
        )

        setCampaignMessage('Technique deleted and removed from linked characters/NPCs.')
    }

    const deleteStyle = (styleId: string) => {
        setCampaignMessage('')

        const styleToDelete = editableStyles.find((style) => style.id === styleId)
        if (!styleToDelete) return

        const styleInUseByCharacter = character.style === styleToDelete.name
        const styleInUseByNpcDraft = npcDraft?.style === styleToDelete.name
        const styleInUseByNpc = npcs.some((npc) => npc.style === styleToDelete.name)

        if (styleInUseByCharacter || styleInUseByNpcDraft || styleInUseByNpc) {
            setCampaignMessage('This style is currently in use by a character or NPC.')
            return
        }

        setEditableStyles((current) => current.filter((style) => style.id !== styleId))

        setCampaignMessage('Style deleted.')
    }

    const deleteLineage = (lineageId: string) => {
        setCampaignMessage('')

        const lineageToDelete = editableLineages.find((lineage) => lineage.id === lineageId)
        if (!lineageToDelete) return

        const lineageInUseByCharacter = character.lineageId === lineageId
        const lineageInUseByNpcDraft = npcDraft?.lineageId === lineageId
        const lineageInUseByNpc = npcs.some((npc) => npc.lineageId === lineageId)

        if (lineageInUseByCharacter || lineageInUseByNpcDraft || lineageInUseByNpc) {
            setCampaignMessage('This lineage is currently in use by a character or NPC.')
            return
        }

        setEditableLineages((current) =>
            current.filter((lineage) => lineage.id !== lineageId),
        )

        setCampaignMessage('Lineage deleted.')
    }

    const saveLineageEdit = (
        lineageId: string,
        updates: { name: string; nation: Character['nation'] | 'Any'; description: string },
    ) => {
        setEditableLineages((current) =>
            current.map((lineage) =>
                lineage.id === lineageId ? { ...lineage, ...updates } : lineage,
            ),
        )

        setEditingLineageId(null)
        setCampaignMessage('Lineage updated.')
    }

    const saveStyleEdit = (
        styleId: string,
        updates: {
            name: string
            nation: Character['nation'] | 'Any'
            bendingType: BendingType
            description: string
        },
    ) => {
        setEditableStyles((current) =>
            current.map((style) =>
                style.id === styleId ? { ...style, ...updates } : style,
            ),
        )

        setCharacter((current) =>
            current.style === editableStyles.find((style) => style.id === styleId)?.name
                ? { ...current, style: updates.name }
                : current,
        )

        setNpcs((current) =>
            current.map((npc) =>
                npc.style === editableStyles.find((style) => style.id === styleId)?.name
                    ? { ...npc, style: updates.name }
                    : npc,
            ),
        )

        setNpcDraft((current) =>
            current && current.style === editableStyles.find((style) => style.id === styleId)?.name
                ? { ...current, style: updates.name }
                : current,
        )

        setEditingStyleId(null)
        setCampaignMessage('Style updated.')
    }

    const saveTechniqueEdit = (
        techniqueId: string,
        updates: {
            name: string
            bendingType: BendingType
            tier: 1 | 2 | 3 | 4
            description: string
        },
    ) => {
        setEditableTechniques((current) =>
            current.map((technique) =>
                technique.id === techniqueId ? { ...technique, ...updates } : technique,
            ),
        )

        setCharacter((current) => ({
            ...current,
            techniques: current.techniques.map((technique) =>
                technique.id === techniqueId ? { ...technique, ...updates } : technique,
            ),
        }))

        setNpcs((current) =>
            current.map((npc) => ({
                ...npc,
                techniques: npc.techniques.map((technique) =>
                    technique.id === techniqueId ? { ...technique, ...updates } : technique,
                ),
            })),
        )

        setNpcDraft((current) =>
            current
                ? {
                    ...current,
                    techniques: current.techniques.map((technique) =>
                        technique.id === techniqueId ? { ...technique, ...updates } : technique,
                    ),
                }
                : null,
        )

        setEditingTechniqueId(null)
        setCampaignMessage('Technique updated.')
    }

    const saveFeatureEdit = (
        featureId: string,
        updates: {
            name: string
            description: string
            source: Feature['source']
            featureType: Feature['featureType']
            levelRequirement: number
            isActiveByDefault: boolean
            uses?: number
            recharge?: Feature['recharge']
        },
    ) => {
        setEditableFeatures((current) =>
            current.map((feature) =>
                feature.id === featureId ? { ...feature, ...updates } : feature,
            ),
        )

        setEditingFeatureId(null)
        setCampaignMessage('Feature updated.')
    }

    const deleteFeature = (featureId: string) => {
        setEditableFeatures((current) =>
            current.filter((feature) => feature.id !== featureId),
        )

        setCampaignMessage('Feature deleted.')
    }

    useEffect(() => {
        if (character.lineageId === '') {
            return
        }

        if (!filteredLineages.some((lineage) => lineage.id === character.lineageId)) {
            setCharacter((current) => ({
                ...current,
                lineageId: '',
                lineageSavingThrowChoices: [],
                lineageSkillChoices: [],
                lineageToolChoices: [],
            }))
        }
    }, [filteredLineages, character.lineageId])

    useEffect(() => {
        if (!npcDraft) return

        const validStyle = npcStyles.some((style) => style.name === npcDraft.style)
        const validLineage = npcLineages.some(
            (lineage) => lineage.id === npcDraft.lineageId,
        )

        setNpcDraft((current) =>
            current
                ? {
                    ...current,
                    style: validStyle ? current.style : '',
                    lineageId: validLineage ? current.lineageId : '',
                    techniques: current.techniques.filter((technique) =>
                        editableTechniques.some((item) => item.id === technique.id),
                    ),
                }
                : null,
        )
    }, [editableTechniques, npcDraft, npcLineages, npcStyles])

    useEffect(() => {
        if (!filteredStyles.some((style) => style.name === character.style)) {
            setCharacter((current) => ({
                ...current,
                style: filteredStyles[0]?.name ?? '',
            }))
        }
    }, [filteredStyles, character.style])

    useEffect(() => {
        setCharacter((current) => ({
            ...current,
            techniques: current.techniques.filter((technique) =>
                editableTechniques.some((item) => item.id === technique.id),
            ),
        }))
    }, [editableTechniques])

    useEffect(() => {
        setCharacter((current) => {
            const ctx = resolveProficiencyContext(
                current,
                editableClasses,
                editableLineages,
                [],
            )

            const nextSavingThrows = deriveSavingThrowProficiencies(current, ctx)

            if (isSameSequence(nextSavingThrows, current.savingThrowProficiencies)) {
                return current
            }

            return {
                ...current,
                savingThrowProficiencies: nextSavingThrows,
            }
        })
    }, [
        character.classId,
        character.lineageId,
        character.lineageSavingThrowChoices,
        character.manualSavingThrows,
        editableClasses,
        editableLineages,
    ])

    useEffect(() => {
        setCharacter((current) => {
            const ctx = resolveProficiencyContext(
                current,
                editableClasses,
                editableLineages,
                editableBackgrounds,
            )

            const nextSkillProficiencies = deriveSkillProficiencies(current, ctx)

            if (isSameSequence(nextSkillProficiencies, current.skillProficiencies)) {
                return current
            }

            return {
                ...current,
                skillProficiencies: nextSkillProficiencies,
            }
        })
    }, [
        character.classId,
        character.backgroundId,
        character.classSkillChoices,
        character.lineageId,
        character.lineageSkillChoices,
        character.manualSkills,
        editableClasses,
        editableBackgrounds,
        editableLineages,
    ])

    return (
        <main className="app-shell">
            <header className="hero">
                <p className="eyebrow">Avatar the Legend of Ling</p>
                <h1>Character Sheet App Starter</h1>
                <p className="lede">
                    A modular app for character creation, NPC editing, and campaign data management
                    for your custom Avatar campaign.
                </p>
            </header>

            <nav className="tab-bar" role="tablist" aria-label="App sections">
                <button
                    id="tab-builder"
                    role="tab"
                    aria-selected={activeTab === 'builder'}
                    aria-controls="panel-builder"
                    className={activeTab === 'builder' ? 'tab-button active' : 'tab-button'}
                    onClick={() => setActiveTab('builder')}
                >
                    Character Builder
                </button>

                <button
                    id="tab-npc"
                    role="tab"
                    aria-selected={activeTab === 'npc'}
                    aria-controls="panel-npc"
                    className={activeTab === 'npc' ? 'tab-button active' : 'tab-button'}
                    onClick={() => setActiveTab('npc')}
                >
                    NPC Studio
                </button>

                <button
                    id="tab-data"
                    role="tab"
                    aria-selected={activeTab === 'data'}
                    aria-controls="panel-data"
                    className={activeTab === 'data' ? 'tab-button active' : 'tab-button'}
                    onClick={() => setActiveTab('data')}
                >
                    Campaign Data
                </button>
            </nav>

            {activeTab === 'builder' && (
                <section
                    id="panel-builder"
                    role="tabpanel"
                    aria-labelledby="tab-builder"
                    className="tab-panel"
                >
                    <div className="builder-tabs" role="navigation" aria-label="Character builder steps">
                        <button
                            className={builderTab === 'home' ? 'active' : ''}
                            onClick={() => setBuilderTab('home')}
                            type="button"
                            aria-current={builderTab === 'home' ? 'step' : undefined}
                        >
                            Home
                        </button>

                        <button
                            className={builderTab === 'class' ? 'active' : ''}
                            onClick={() => setBuilderTab('class')}
                            type="button"
                            aria-current={builderTab === 'class' ? 'step' : undefined}
                        >
                            Class
                        </button>

                        <button
                            className={builderTab === 'background' ? 'active' : ''}
                            onClick={() => setBuilderTab('background')}
                            type="button"
                            aria-current={builderTab === 'background' ? 'step' : undefined}
                        >
                            Background
                        </button>

                        <button
                            className={builderTab === 'lineage' ? 'active' : ''}
                            onClick={() => setBuilderTab('lineage')}
                            type="button"
                            aria-current={builderTab === 'lineage' ? 'step' : undefined}
                        >
                            Lineage
                        </button>

                        <button
                            className={builderTab === 'abilities' ? 'active' : ''}
                            onClick={() => setBuilderTab('abilities')}
                            type="button"
                            aria-current={builderTab === 'abilities' ? 'step' : undefined}
                        >
                            Abilities
                        </button>

                        <button
                            className={builderTab === 'proficiencies' ? 'active' : ''}
                            onClick={() => setBuilderTab('proficiencies')}
                            type="button"
                            aria-current={builderTab === 'proficiencies' ? 'step' : undefined}
                        >
                            Proficiencies
                        </button>

                        <button
                            className={builderTab === 'features' ? 'active' : ''}
                            onClick={() => setBuilderTab('features')}
                            type="button"
                            aria-current={builderTab === 'features' ? 'step' : undefined}
                        >
                            Features
                        </button>

                        <button
                            className={builderTab === 'techniques' ? 'active' : ''}
                            onClick={() => setBuilderTab('techniques')}
                            type="button"
                            aria-current={builderTab === 'techniques' ? 'step' : undefined}
                        >
                            Techniques
                        </button>

                        <button
                            className={builderTab === 'equipment' ? 'active' : ''}
                            onClick={() => setBuilderTab('equipment')}
                            type="button"
                            aria-current={builderTab === 'equipment' ? 'step' : undefined}
                        >
                            Equipment
                        </button>

                        <button
                            className={builderTab === 'preview' ? 'active' : ''}
                            onClick={() => setBuilderTab('preview')}
                            type="button"
                            aria-current={builderTab === 'preview' ? 'step' : undefined}
                        >
                            Preview
                        </button>
                    </div>
                    
                    {builderTab === 'home' && (
                        <BuilderHomePanel
                            character={character}
                            setCharacter={setCharacter}
                        />
                    )}

                    {builderTab === 'class' && (
                        <BuilderClassPanel
                            character={character}
                            setCharacter={setCharacter}
                            editableClasses={editableClasses}
                            editableSubclasses={editableSubclasses}
                            editableFeatures={editableFeatures}
                        />
                    )}

                    {builderTab === 'background' && (
                        <BuilderBackgroundPanel
                            character={character}
                            setCharacter={setCharacter}
                            editableBackgrounds={editableBackgrounds}
                            editableFeatures={editableFeatures}
                        />
                    )}

                    {builderTab === 'lineage' && (
                        <BuilderLineagePanel
                            character={character}
                            setCharacter={setCharacter}
                            nations={nations}
                            filteredLineages={filteredLineages}
                            handleNationChange={handleNationChange}
                            editableFeatures={editableFeatures}
                        />
                    )}

                    {builderTab === 'abilities' && (
                        <BuilderAbilitiesPanel
                            character={character}
                            setCharacter={setCharacter}
                        />
                    )}

                    {builderTab === 'proficiencies' && (
                        <BuilderProficienciesPanel
                            character={character}
                            setCharacter={setCharacter}
                            editableClasses={editableClasses}
                            editableLineages={editableLineages}
                            editableBackgrounds={editableBackgrounds}
                        />
                    )}

                    {builderTab === 'features' && (
                        <BuilderFeaturesPanel
                            character={character}
                            editableClasses={editableClasses}
                            editableSubclasses={editableSubclasses}
                            editableBackgrounds={editableBackgrounds}
                            editableFeatures={editableFeatures}
                            setCharacter={setCharacter}
                        />
                    )}

                    {builderTab === 'techniques' && (
                        <BuilderTechniquesPanel
                            character={character}
                            setCharacter={setCharacter}
                            filteredStyles={filteredStyles}
                            filteredTechniques={filteredTechniques}
                            handleBendingTypeChange={handleBendingTypeChange}
                            handleTechniqueToggle={handleTechniqueToggle}
                        />
                    )}

                    {builderTab === 'equipment' && (
                        <BuilderEquipmentPanel
                            character={character}
                            setCharacter={setCharacter}
                        />
                    )}

                    {builderTab === 'preview' && (
                        <BuilderPreviewPanel
                            character={character}
                            editableClasses={editableClasses}
                            editableSubclasses={editableSubclasses}
                            editableBackgrounds={editableBackgrounds}
                            editableLineages={editableLineages}
                            editableFeatures={editableFeatures}
                        />
                    )}

                </section> 
                )}

            {activeTab === 'npc' && (
                <section
                    id="panel-npc"
                    role="tabpanel"
                    aria-labelledby="tab-npc"
                    className="tab-panel"
                >
                    <div className="grid">
                        <SectionCard title="NPC generator starter">
                            <label>
                                NPC template
                                <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
                                    {editableNpcTemplates.map((template) => (
                                        <option key={template.role} value={template.role}>
                                            {template.role}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {selectedNpcTemplate && (
                                <article className="npc-item template-preview">
                                    <h3>{selectedNpcTemplate.role} preview</h3>

                                    <p className="lede">
                                        <strong>Nation profile:</strong> {nationSummary}
                                        <br />
                                        <br />
                                        <strong> Bending profile:</strong> {bendingSummary}
                                    </p>

                                    <div className="two-col">
                                        <div>
                                            <p><strong>Nation weights</strong></p>
                                            <ul className="stats">
                                                {nations.map((nation) => (
                                                    <li key={nation}>
                                                        {nation}: {selectedNpcTemplate.nationWeights[nation] ?? 0}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <p><strong>Bending weights</strong></p>
                                            <ul className="stats">
                                                {bendingTypes.map((type) => (
                                                    <li key={type}>
                                                        {type}: {selectedNpcTemplate.bendingWeights[type] ?? 0}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </article>
                            )}

                            <div className="actions inline-actions">
                                <button
                                    className="primary-button"
                                    onClick={() => setNpcs((current) => [generateNpc(availableTemplate, editableStyles), ...current])}
                                >
                                    Generate NPC
                                </button>
                            </div>
                        </SectionCard>

                        <SectionCard title="NPC studio">
                            {!npcDraft ? (
                                <p>Select an NPC from the generated list to edit it.</p>
                            ) : (
                                <>
                                    <label>
                                        NPC name
                                        <input
                                            value={npcDraft.name}
                                            onChange={(event) =>
                                                setNpcDraft({ ...npcDraft, name: event.target.value })
                                            }
                                        />
                                    </label>

                                    <label>
                                        Nation
                                        <select
                                            value={npcDraft.nation}
                                            onChange={(event) =>
                                                updateNpcNation(event.target.value as Character['nation'])
                                            }
                                        >
                                            {nations.map((nation) => (
                                                <option key={nation} value={nation}>
                                                    {nation}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        Lineage
                                        <select
                                            value={npcDraft.lineageId}
                                            onChange={(event) =>
                                                setNpcDraft({ ...npcDraft, lineageId: event.target.value })
                                            }
                                        >
                                            <option value="">Select a lineage</option>
                                            {npcLineages.map((lineage) => (
                                                <option key={lineage.id} value={lineage.id}>
                                                    {lineage.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        Bending type
                                        <select
                                            value={npcDraft.bendingType}
                                            onChange={(event) =>
                                                updateNpcBendingType(event.target.value as BendingType)
                                            }
                                        >
                                            {bendingTypes.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        Style
                                        <select
                                            value={npcDraft.style}
                                            onChange={(event) =>
                                                setNpcDraft({ ...npcDraft, style: event.target.value })
                                            }
                                        >
                                            {npcStyles.map((style) => (
                                                <option key={style.id} value={style.name}>
                                                    {style.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <div className="two-col">
                                        <label>
                                            HP
                                            <input
                                                type="number"
                                                value={npcDraft.hp}
                                                onChange={(event) =>
                                                    setNpcDraft({
                                                        ...npcDraft,
                                                        hp: Number.isNaN(event.target.valueAsNumber)
                                                            ? 0
                                                            : event.target.valueAsNumber,
                                                    })
                                                }
                                            />
                                        </label>

                                        <label>
                                            Chi
                                            <input
                                                type="number"
                                                value={npcDraft.chi}
                                                onChange={(event) =>
                                                    setNpcDraft({
                                                        ...npcDraft,
                                                        chi: Number.isNaN(event.target.valueAsNumber)
                                                            ? 0
                                                            : event.target.valueAsNumber,
                                                    })
                                                }
                                            />
                                        </label>
                                    </div>

                                    <label>
                                        Background
                                        <select
                                            value={npcDraft.backgroundId ?? ''}
                                            onChange={(event) =>
                                                setNpcDraft({
                                                    ...npcDraft,
                                                    backgroundId: event.target.value || undefined,
                                                })
                                            }
                                        >
                                            <option value="">Select a background</option>
                                            {editableBackgrounds.map((background) => (
                                                <option key={background.id} value={background.id}>
                                                    {background.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    {selectedNpcBackground && (
                                        <p>{selectedNpcBackground.description}</p>
                                    )}

                                    <label>
                                        Notes
                                        <textarea
                                            rows={3}
                                            value={npcDraft.notes}
                                            onChange={(event) =>
                                                setNpcDraft({ ...npcDraft, notes: event.target.value })
                                            }
                                        />
                                    </label>

                                    <div>
                                        <p><strong>Techniques</strong></p>

                                        {filteredNpcTechniques.length === 0 ? (
                                            <p>No techniques available for this bending type.</p>
                                        ) : (
                                            <div className="checkbox-list">
                                                {filteredNpcTechniques.map((technique) => {
                                                    const checked = npcDraft.techniques.some(
                                                        (item) => item.id === technique.id,
                                                    )

                                                    return (
                                                        <label key={technique.id} className="checkbox-item">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => handleNpcTechniqueToggle(technique)}
                                                            />
                                                            <span>
                                                                <strong>{technique.name}</strong> — Tier {technique.tier}
                                                                <br />
                                                                <small>{technique.description}</small>
                                                            </span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="actions inline-actions">
                                        <button className="primary-button" onClick={saveNpcDraft}>
                                            Save NPC
                                        </button>
                                        <button className="secondary-button" onClick={cancelEditingNpc}>
                                            Cancel
                                        </button>
                                        <button
                                            className="secondary-button"
                                            onClick={() =>
                                                downloadJson(
                                                    npcDraft,
                                                    `${npcDraft.name.toLowerCase().replace(/\s+/g, '-') || 'npc'}.json`,
                                                )
                                            }
                                        >
                                            Export NPC JSON
                                        </button>
                                    </div>
                                </>
                            )}
                        </SectionCard>

                        <SectionCard title="Generated NPCs">
                            {npcs.length === 0 ? (
                                <p>No NPCs generated yet.</p>
                            ) : (
                                <div className="npc-list">
                                    {npcs.map((npc) => (
                                        <article key={npc.id} className="npc-item">
                                            <h3>{npc.name}</h3>
                                            <p>
                                                {editableBackgrounds.find((background) => background.id === npc.backgroundId)?.name ??
                                                    'No background'}
                                            </p>
                                            <p>{npc.nation} · {npc.bendingType} · {npc.style}</p>
                                            <p>HP {npc.hp} · Chi {npc.chi}</p>
                                            {npc.techniques.length > 0 && (
                                                <>
                                                    <p><strong>Techniques:</strong></p>
                                                    <ul className="stats">
                                                        {npc.techniques.map((technique) => (
                                                            <li key={technique.id}>
                                                                {technique.name} — Tier {technique.tier}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </>
                                            )}

                                            <div className="actions inline-actions">
                                                <button
                                                    className="primary-button"
                                                    onClick={() => startEditingNpc(npc)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="secondary-button"
                                                    onClick={() =>
                                                        downloadJson(
                                                            npc,
                                                            `${npc.name.toLowerCase().replace(/\s+/g, '-') || 'npc'}.json`,
                                                        )
                                                    }
                                                >
                                                    Export
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    </div>
                </section>
            )}

            {activeTab === 'data' && (
                <section
                    id="panel-data"
                    role="tabpanel"
                    aria-labelledby="tab-data"
                    className="tab-panel"
                >
                    <div className="campaign-data-tabs">
                        <button
                            className={campaignDataTab === 'summary' ? 'active' : ''}
                            onClick={() => setCampaignDataTab('summary')}
                        >
                            Summary
                        </button>
                        <button
                            className={campaignDataTab === 'lineages' ? 'active' : ''}
                            onClick={() => setCampaignDataTab('lineages')}
                        >
                            Lineages
                        </button>
                        <button
                            className={campaignDataTab === 'styles' ? 'active' : ''}
                            onClick={() => setCampaignDataTab('styles')}
                        >
                            Styles
                        </button>
                        <button
                            className={campaignDataTab === 'techniques' ? 'active' : ''}
                            onClick={() => setCampaignDataTab('techniques')}
                        >
                            Techniques
                        </button>
                        <button
                            className={campaignDataTab === 'features' ? 'active' : ''}
                            onClick={() => setCampaignDataTab('features')}
                        >
                            Features
                        </button>
                        <button
                            className={campaignDataTab === 'templates' ? 'active' : ''}
                            onClick={() => setCampaignDataTab('templates')}
                        >
                            NPC Templates
                        </button>
                    </div>

                    {campaignDataTab === 'summary' && (
                        <CampaignSummaryPanel
                            nations={nations}
                            editableLineages={editableLineages}
                            editableStyles={editableStyles}
                            editableTechniques={editableTechniques}
                            editableNpcTemplates={editableNpcTemplates}
                            campaignMessage={campaignMessage}
                            importCampaignData={importCampaignData}
                            exportCampaignData={exportCampaignData}
                        />
                    )}
                    {campaignDataTab === 'lineages' && (
                        <LineagesPanel
                            nations={nations}
                            editableLineages={editableLineages}
                            editingLineageId={editingLineageId}
                            setEditableLineages={setEditableLineages}
                            setEditingLineageId={setEditingLineageId}
                            setEditingStyleId={setEditingStyleId}
                            setEditingTechniqueId={setEditingTechniqueId}
                            setEditingNpcTemplateRole={setEditingNpcTemplateRole}
                            saveLineageEdit={saveLineageEdit}
                            deleteLineage={deleteLineage}
                        />
                    )}
                    {campaignDataTab === 'styles' && (
                        <StylesPanel
                            nations={nations}
                            bendingTypes={bendingTypes}
                            editableStyles={editableStyles}
                            editingStyleId={editingStyleId}
                            setEditableStyles={setEditableStyles}
                            setEditingStyleId={setEditingStyleId}
                            setEditingLineageId={setEditingLineageId}
                            setEditingTechniqueId={setEditingTechniqueId}
                            setEditingNpcTemplateRole={setEditingNpcTemplateRole}
                            saveStyleEdit={saveStyleEdit}
                            deleteStyle={deleteStyle}
                        />
                    )}
                    {campaignDataTab === 'techniques' && (
                        <TechniquesPanel
                            bendingTypes={bendingTypes}
                            editableTechniques={editableTechniques}
                            editingTechniqueId={editingTechniqueId}
                            setEditableTechniques={setEditableTechniques}
                            setEditingTechniqueId={setEditingTechniqueId}
                            setEditingLineageId={setEditingLineageId}
                            setEditingStyleId={setEditingStyleId}
                            setEditingNpcTemplateRole={setEditingNpcTemplateRole}
                            saveTechniqueEdit={saveTechniqueEdit}
                            deleteTechnique={deleteTechnique}
                        />
                    )}
                    {campaignDataTab === 'features' && (
                        <FeaturesPanel
                            editableFeatures={editableFeatures}
                            editingFeatureId={editingFeatureId}
                            setEditableFeatures={setEditableFeatures}
                            setEditingFeatureId={setEditingFeatureId}
                            setEditingLineageId={setEditingLineageId}
                            setEditingStyleId={setEditingStyleId}
                            setEditingTechniqueId={setEditingTechniqueId}
                            setEditingNpcTemplateRole={setEditingNpcTemplateRole}
                            saveFeatureEdit={saveFeatureEdit}
                            deleteFeature={deleteFeature}
                        />
                    )}
                    {campaignDataTab === 'templates' && (
                        <NpcTemplatesPanel
                            nations={nations}
                            bendingTypes={bendingTypes}
                            editableNpcTemplates={editableNpcTemplates}
                            editingNpcTemplateRole={editingNpcTemplateRole}
                            setEditableNpcTemplates={setEditableNpcTemplates}
                            setEditingNpcTemplateRole={setEditingNpcTemplateRole}
                            setEditingLineageId={setEditingLineageId}
                            setEditingStyleId={setEditingStyleId}
                            setEditingTechniqueId={setEditingTechniqueId}
                            setCampaignMessage={setCampaignMessage}
                            saveNpcTemplateEdit={saveNpcTemplateEdit}
                            deleteNpcTemplate={deleteNpcTemplate}
                        />
                    )}

                </section>
            )}
        </main>
    )
}