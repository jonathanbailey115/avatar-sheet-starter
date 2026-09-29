import { useState } from 'react'
import { CampaignSummaryPanel } from '../campaign-data/CampaignSummaryPanel'
import { FeaturesPanel } from '../campaign-data/FeaturesPanel'
import { LineagesPanel } from '../campaign-data/LineagesPanel'
import { NpcTemplatesPanel } from '../campaign-data/NpcTemplatesPanel'
import { TechniquesPanel } from '../campaign-data/TechniquesPanel'
import { parseCampaignData, serializeCampaignData } from '../lib/campaignData'
import { downloadText } from '../lib/characterIO'
import { useCollectionState } from '../store/content'
import { useLibraryStore } from '../store/library'
import { useNpcStore } from '../store/npcs'
import { bendingTypes, nations } from '../types/schema'
import type { Feature, Lineage, NpcTemplate, Technique } from '../types/schema'

type DataTab = 'summary' | 'lineages' | 'techniques' | 'features' | 'templates'

const DATA_TABS: Array<{ id: DataTab; label: string }> = [
    { id: 'summary', label: 'Summary' },
    { id: 'lineages', label: 'Lineages' },
    { id: 'techniques', label: 'Techniques' },
    { id: 'features', label: 'Features' },
    { id: 'templates', label: 'NPC Templates' },
]

export function DataScreen() {
    const [tab, setTab] = useState<DataTab>('summary')
    const [message, setMessage] = useState('')

    const [lineages, setLineages] = useCollectionState('lineages')
    const [techniques, setTechniques] = useCollectionState('techniques')
    const [features, setFeatures] = useCollectionState('features')
    const [templates, setTemplates] = useCollectionState('npcTemplates')

    const characters = useLibraryStore((state) => state.characters)
    const npcs = useNpcStore((state) => state.npcs)

    const [editingLineageId, setEditingLineageId] = useState<string | null>(null)
    const [editingTechniqueId, setEditingTechniqueId] = useState<string | null>(null)
    const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null)
    const [editingTemplateRole, setEditingTemplateRole] = useState<string | null>(null)

    const exportCampaignData = () => {
        downloadText(
            serializeCampaignData({ lineages, techniques, features, npcTemplates: templates }),
            'campaign-data.json',
        )
    }

    const importCampaignData = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return

        const result = parseCampaignData(await file.text())
        if (result.error) {
            setMessage(`Could not import campaign data: ${result.error}`)
            return
        }

        if (result.data.lineages) setLineages(result.data.lineages)
        if (result.data.techniques) setTechniques(result.data.techniques)
        if (result.data.features) setFeatures(result.data.features)
        if (result.data.npcTemplates) setTemplates(result.data.npcTemplates)

        setMessage(['Campaign data imported.', ...result.warnings].join(' '))
    }

    const deleteLineage = (lineageId: string) => {
        const inUse =
            characters.some((item) => item.lineageId === lineageId) ||
            npcs.some((item) => item.lineageId === lineageId)

        if (inUse) {
            setMessage('This lineage is currently in use by a character or NPC.')
            return
        }

        setLineages((current) => current.filter((item) => item.id !== lineageId))
        setMessage('Lineage deleted.')
    }

    const saveLineageEdit = (
        lineageId: string,
        updates: { name: string; nation: Lineage['nation']; description: string },
    ) => {
        setLineages((current) =>
            current.map((item) => (item.id === lineageId ? { ...item, ...updates } : item)),
        )
        setEditingLineageId(null)
        setMessage('Lineage updated.')
    }

    const saveTechniqueEdit = (
        techniqueId: string,
        updates: { name: string; element: Technique['element']; description: string },
    ) => {
        setTechniques((current) =>
            current.map((item) => (item.id === techniqueId ? { ...item, ...updates } : item)),
        )
        setEditingTechniqueId(null)
        setMessage('Technique updated.')
    }

    const deleteTechnique = (techniqueId: string) => {
        // Characters and NPCs that know it are cleaned up automatically.
        setTechniques((current) => current.filter((item) => item.id !== techniqueId))
        setMessage('Technique deleted and removed from characters and NPCs.')
    }

    const saveFeatureEdit = (featureId: string, updates: Omit<Feature, 'id'>) => {
        setFeatures((current) =>
            current.map((item) => (item.id === featureId ? { ...item, ...updates } : item)),
        )
        setEditingFeatureId(null)
        setMessage('Feature updated.')
    }

    const deleteFeature = (featureId: string) => {
        setFeatures((current) => current.filter((item) => item.id !== featureId))
        setMessage('Feature deleted.')
    }

    const saveNpcTemplateEdit = (originalRole: string, updated: NpcTemplate) => {
        setTemplates((current) =>
            current.map((item) => (item.role === originalRole ? updated : item)),
        )
        setEditingTemplateRole(null)
        setMessage('NPC template updated.')
    }

    const deleteNpcTemplate = (role: string) => {
        if (templates.length <= 1) {
            setMessage('You must keep at least one NPC template.')
            return
        }
        setTemplates((current) => current.filter((item) => item.role !== role))
        setEditingTemplateRole(null)
        setMessage('NPC template deleted.')
    }

    return (
        <section id="panel-data" role="tabpanel" className="tab-panel">
            <div className="campaign-data-tabs">
                {DATA_TABS.map((item) => (
                    <button
                        key={item.id}
                        className={tab === item.id ? 'active' : ''}
                        onClick={() => setTab(item.id)}
                        type="button"
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {tab === 'summary' && (
                <CampaignSummaryPanel
                    nations={nations}
                    editableLineages={lineages}
                    editableTechniques={techniques}
                    editableNpcTemplates={templates}
                    campaignMessage={message}
                    importCampaignData={importCampaignData}
                    exportCampaignData={exportCampaignData}
                />
            )}

            {tab === 'lineages' && (
                <LineagesPanel
                    nations={nations}
                    editableLineages={lineages}
                    editingLineageId={editingLineageId}
                    setEditableLineages={setLineages}
                    setEditingLineageId={setEditingLineageId}
                    setEditingTechniqueId={setEditingTechniqueId}
                    setEditingNpcTemplateRole={setEditingTemplateRole}
                    saveLineageEdit={saveLineageEdit}
                    deleteLineage={deleteLineage}
                />
            )}

            {tab === 'techniques' && (
                <TechniquesPanel
                    editableTechniques={techniques}
                    editingTechniqueId={editingTechniqueId}
                    setEditableTechniques={setTechniques}
                    setEditingTechniqueId={setEditingTechniqueId}
                    setEditingLineageId={setEditingLineageId}
                    setEditingNpcTemplateRole={setEditingTemplateRole}
                    saveTechniqueEdit={saveTechniqueEdit}
                    deleteTechnique={deleteTechnique}
                />
            )}

            {tab === 'features' && (
                <FeaturesPanel
                    editableFeatures={features}
                    editingFeatureId={editingFeatureId}
                    setEditableFeatures={setFeatures}
                    setEditingFeatureId={setEditingFeatureId}
                    setEditingLineageId={setEditingLineageId}
                    setEditingTechniqueId={setEditingTechniqueId}
                    setEditingNpcTemplateRole={setEditingTemplateRole}
                    saveFeatureEdit={saveFeatureEdit}
                    deleteFeature={deleteFeature}
                />
            )}

            {tab === 'templates' && (
                <NpcTemplatesPanel
                    nations={nations}
                    bendingTypes={bendingTypes}
                    editableNpcTemplates={templates}
                    editingNpcTemplateRole={editingTemplateRole}
                    setEditableNpcTemplates={setTemplates}
                    setEditingNpcTemplateRole={setEditingTemplateRole}
                    setEditingLineageId={setEditingLineageId}
                    setEditingTechniqueId={setEditingTechniqueId}
                    setCampaignMessage={setMessage}
                    saveNpcTemplateEdit={saveNpcTemplateEdit}
                    deleteNpcTemplate={deleteNpcTemplate}
                />
            )}
        </section>
    )
}
