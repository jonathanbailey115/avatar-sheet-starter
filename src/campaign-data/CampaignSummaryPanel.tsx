import SectionCard from '../components/SectionCard'

type CampaignSummaryPanelProps = {
    nations: string[]
    editableLineages: Array<{ id: string }>
    editableStyles: Array<{ id: string }>
    editableTechniques: Array<{ id: string }>
    editableNpcTemplates: Array<{ role: string }>
    campaignMessage: string
    importCampaignData: (event: React.ChangeEvent<HTMLInputElement>) => void
    exportCampaignData: () => void
}

export function CampaignSummaryPanel({
    nations,
    editableLineages,
    editableStyles,
    editableTechniques,
    editableNpcTemplates,
    campaignMessage,
    importCampaignData,
    exportCampaignData,
}: CampaignSummaryPanelProps) {
    return (
        <SectionCard title="Campaign data summary">
            <ul className="stats">
                <li><strong>Nations:</strong> {nations.length}</li>
                <li><strong>Lineages:</strong> {editableLineages.length}</li>
                <li><strong>Styles:</strong> {editableStyles.length}</li>
                <li><strong>Techniques:</strong> {editableTechniques.length}</li>
                <li><strong>NPC templates:</strong> {editableNpcTemplates.length}</li>
            </ul>

            {campaignMessage && (
                <p className="status-message">{campaignMessage}</p>
            )}

            <div className="actions inline-actions">
                <label className="primary-button file-button">
                    Import campaign JSON
                    <input
                        type="file"
                        accept=".json,application/json"
                        onChange={importCampaignData}
                        hidden
                    />
                </label>

                <button className="primary-button" onClick={exportCampaignData}>
                    Export campaign JSON
                </button>
            </div>
        </SectionCard>
    )
}