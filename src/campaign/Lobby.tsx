import { useState } from 'react'
import type { FormEvent } from 'react'
import SectionCard from '../components/SectionCard'
import { nameFor, useCampaignStore } from '../store/campaign'
import { formatCode, isPlausibleCode } from './code'
import type { Campaign } from './types'

/** Run an async action and keep its error message for display. */
function useAction() {
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const run = async <T,>(task: () => Promise<T>): Promise<T | undefined> => {
        setBusy(true)
        setError('')
        try {
            return await task()
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Something went wrong.')
            return undefined
        } finally {
            setBusy(false)
        }
    }

    return { error, busy, run }
}

export function Lobby({ onOpen }: { onOpen: (campaign: Campaign) => void }) {
    const displayName = useCampaignStore((state) => nameFor(state))
    const campaigns = useCampaignStore((state) => state.campaigns)
    const { createCampaign, joinCampaign, claimGm } = useCampaignStore.getState()

    const [newName, setNewName] = useState('')
    const [code, setCode] = useState('')
    const [recoverCode, setRecoverCode] = useState('')
    const [recoverKey, setRecoverKey] = useState('')
    const [created, setCreated] = useState<{ campaign: Campaign; gmKey: string } | null>(null)

    const create = useAction()
    const join = useAction()
    const recover = useAction()

    const needName = displayName.trim() === ''

    const submitCreate = async (event: FormEvent) => {
        event.preventDefault()
        const result = await create.run(() => createCampaign(newName))
        if (result) {
            setCreated(result)
            setNewName('')
        }
    }

    const submitJoin = async (event: FormEvent) => {
        event.preventDefault()
        const campaign = await join.run(() => joinCampaign(code))
        if (campaign) {
            setCode('')
            onOpen(campaign)
        }
    }

    const submitRecover = async (event: FormEvent) => {
        event.preventDefault()
        const campaign = await recover.run(() => claimGm(recoverCode, recoverKey))
        if (campaign) {
            setRecoverCode('')
            setRecoverKey('')
            onOpen(campaign)
        }
    }

    return (
        <>
            {campaigns.length > 0 && (
                <SectionCard title="My campaigns">
                    <div className="npc-list">
                        {campaigns.map((campaign) => (
                            <article key={campaign.id} className="npc-item">
                                <h3>{campaign.name}</h3>
                                <p className="muted">Code {formatCode(campaign.code)}</p>
                                <button className="primary-button" type="button" onClick={() => onOpen(campaign)}>
                                    Open
                                </button>
                            </article>
                        ))}
                    </div>
                </SectionCard>
            )}

            {created && (
                <SectionCard title={`${created.campaign.name} is ready`}>
                    <p>
                        Give your players this join code: <strong className="join-code-big">{formatCode(created.campaign.code)}</strong>
                    </p>
                    <p>
                        Your GM recovery key: <code>{created.gmKey}</code>
                    </p>
                    <p className="muted">
                        Save the key now. If you ever lose this browser, the code plus this key gets you back in as the GM. You
                        can also find it again in the campaign settings on this computer.
                    </p>
                    <button className="primary-button" type="button" onClick={() => onOpen(created.campaign)}>
                        Open the campaign
                    </button>
                </SectionCard>
            )}

            <div className="grid">
                <SectionCard title="Join a campaign">
                    <form onSubmit={submitJoin}>
                        <label>
                            Join code
                            <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="ABCD-1234" autoComplete="off" />
                        </label>
                        <button className="primary-button" type="submit" disabled={needName || join.busy || !isPlausibleCode(code)}>
                            Join
                        </button>
                        {join.error && <p className="roll-error">{join.error}</p>}
                    </form>
                </SectionCard>

                <SectionCard title="Start a campaign (GM)">
                    <form onSubmit={submitCreate}>
                        <label>
                            Campaign name
                            <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="The Siege of Ba Sing Se" />
                        </label>
                        <button className="primary-button" type="submit" disabled={needName || create.busy || newName.trim() === ''}>
                            Create campaign
                        </button>
                        {create.error && <p className="roll-error">{create.error}</p>}
                    </form>
                </SectionCard>
            </div>

            <details className="hp-setup">
                <summary>Lost your GM seat? Take it back with your recovery key</summary>
                <form onSubmit={submitRecover}>
                    <div className="two-col">
                        <label>
                            Join code
                            <input value={recoverCode} onChange={(event) => setRecoverCode(event.target.value)} autoComplete="off" />
                        </label>
                        <label>
                            GM recovery key
                            <input value={recoverKey} onChange={(event) => setRecoverKey(event.target.value)} autoComplete="off" />
                        </label>
                    </div>
                    <button
                        className="secondary-button"
                        type="submit"
                        disabled={needName || recover.busy || !isPlausibleCode(recoverCode) || recoverKey.trim() === ''}
                    >
                        Become the GM again
                    </button>
                    {recover.error && <p className="roll-error">{recover.error}</p>}
                </form>
            </details>

            {needName && <p className="status-message">Choose a display name above first. It is what the table sees.</p>}
        </>
    )
}
