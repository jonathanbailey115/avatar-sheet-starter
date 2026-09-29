import { useState } from 'react'
import SectionCard from '../components/SectionCard'
import { buildStatBlock } from '../npc/statBlock'
import { StatBlockView } from '../npc/ui/StatBlockView'
import { getContent } from '../store/content'
import { useCampaignStore } from '../store/campaign'
import { getBackend } from './backend'
import type { CampaignNpc } from './types'
import { useAction } from './useAction'

/** NPCs saved to this campaign. The GM sees all of them and decides which players may see. */
export function CampaignNpcs({ campaignId, npcs, isGm }: { campaignId: string; npcs: CampaignNpc[]; isGm: boolean }) {
    const [openId, setOpenId] = useState<string | null>(null)
    const action = useAction()
    const reload = useCampaignStore.getState().reload

    if (npcs.length === 0 && !isGm) return null

    const change = (task: () => Promise<void>) => void action.run(task).then(() => reload())

    return (
        <SectionCard title="NPCs">
            {npcs.length === 0 && <p className="muted">No NPCs yet. Send one from the NPC Studio tab.</p>}
            <div className="npc-list">
                {npcs.map((npc) => (
                    <article key={npc.id} className="npc-item">
                        <h3>{npc.character.name || 'Unnamed NPC'}</h3>
                        <p className="muted">
                            Level {npc.character.level} · {npc.character.nation}
                            {isGm && (npc.revealed ? ' · visible to players' : ' · hidden from players')}
                        </p>
                        <div className="actions inline-actions">
                            <button className="secondary-button" type="button" onClick={() => setOpenId(openId === npc.id ? null : npc.id)}>
                                {openId === npc.id ? 'Hide stat block' : 'Stat block'}
                            </button>
                            {isGm && (
                                <>
                                    <label className="inline-check">
                                        <input
                                            type="checkbox"
                                            checked={npc.revealed}
                                            onChange={(event) =>
                                                change(() => getBackend().saveNpc(campaignId, { id: npc.id, character: npc.character, revealed: event.target.checked }))
                                            }
                                        />
                                        Show to players
                                    </label>
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm(`Remove ${npc.character.name || 'this NPC'} from the campaign?`)) change(() => getBackend().deleteNpc(campaignId, npc.id))
                                        }}
                                    >
                                        Remove
                                    </button>
                                </>
                            )}
                        </div>
                        {openId === npc.id && <StatBlockView block={buildStatBlock(npc.character, getContent())} warnings={[]} />}
                    </article>
                ))}
            </div>
            {action.error && <p className="roll-error">{action.error}</p>}
        </SectionCard>
    )
}
