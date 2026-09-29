import { useEffect, useState } from 'react'
import { getBackend } from '../../campaign/backend'
import { shareableNpc } from '../../campaign/npcShare'
import { useAction } from '../../campaign/useAction'
import { useCampaignStore } from '../../store/campaign'
import type { Character } from '../../types/schema'

/** GM-only: copy this NPC into one of the campaigns you run. Notes stay on this device. */
export function SendToCampaign({ npc }: { npc: Character }) {
    const phase = useCampaignStore((state) => state.phase)
    const userId = useCampaignStore((state) => state.userId)
    const campaigns = useCampaignStore((state) => state.campaigns)
    const connect = useCampaignStore((state) => state.connect)
    const action = useAction()
    const [campaignId, setCampaignId] = useState('')
    const [revealed, setRevealed] = useState(false)
    const [sent, setSent] = useState('')

    useEffect(() => {
        void connect().catch(() => undefined)
    }, [connect])

    const mine = campaigns.filter((campaign) => campaign.gmId === userId)
    if (phase !== 'ready' || mine.length === 0) {
        return (
            <p className="muted">
                To use this NPC in a game, create a campaign on the Campaigns tab (you must be signed in and be its GM).
            </p>
        )
    }

    const target = mine.find((campaign) => campaign.id === campaignId) ?? mine[0]

    const send = async () => {
        const ok = await action.run(async () => {
            await getBackend().saveNpc(target.id, { id: npc.id, character: shareableNpc(npc), revealed })
            return true
        })
        if (ok) {
            setSent(`Sent to ${target.name}${revealed ? ' (players can see it)' : ' (hidden from players)'}.`)
            if (useCampaignStore.getState().activeId === target.id) void useCampaignStore.getState().reload()
        }
    }

    return (
        <div className="send-to-campaign">
            <h4>Send to a campaign</h4>
            <label>
                Campaign
                <select value={target.id} onChange={(event) => setCampaignId(event.target.value)}>
                    {mine.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                            {campaign.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="inline-check">
                <input type="checkbox" checked={revealed} onChange={(event) => setRevealed(event.target.checked)} />
                Show to players now
            </label>
            <button className="primary-button" type="button" disabled={action.busy} onClick={() => void send()}>
                Send (sending again updates the saved copy)
            </button>
            {sent && <p role="status">{sent}</p>}
            {action.error && <p className="roll-error">{action.error}</p>}
        </div>
    )
}
