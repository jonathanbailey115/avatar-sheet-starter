import { useEffect } from 'react'
import { AccountGate } from '../campaign/AccountGate'
import { AccountBar, ChooseNewPassword, ChooseUsername } from '../campaign/AccountPanels'
import { getBackend, hasSupabaseConfig } from '../campaign/backend'
import { CampaignView } from '../campaign/CampaignView'
import { Lobby } from '../campaign/Lobby'
import SectionCard from '../components/SectionCard'
import { useCampaignStore } from '../store/campaign'

export function CampaignScreen() {
    const phase = useCampaignStore((state) => state.phase)
    const error = useCampaignStore((state) => state.error)
    const notice = useCampaignStore((state) => state.notice)
    const displayName = useCampaignStore((state) => state.displayName)
    const account = useCampaignStore((state) => state.account)
    const activeId = useCampaignStore((state) => state.activeId)
    const { connect, setDisplayName, openCampaign, dismissNotice } = useCampaignStore.getState()
    const online = hasSupabaseConfig()
    const usesAccounts = getBackend().accounts

    useEffect(() => {
        void connect().catch(() => undefined)
    }, [connect])

    return (
        <section id="panel-campaigns" role="tabpanel" className="tab-panel">
            <p className={online ? 'status-message' : 'status-message status-test'} role="status">
                {online
                    ? 'Online: campaigns work across computers.'
                    : 'Test mode: campaigns only work between browser tabs on this computer, and nothing is sent anywhere. To play with friends, set up Supabase (docs/SUPABASE_SETUP.md).'}
            </p>

            {notice && (
                <p className="status-message" role="alert">
                    {notice}{' '}
                    <button className="link-button" type="button" onClick={dismissNotice}>
                        Dismiss
                    </button>
                </p>
            )}

            {phase === 'connecting' && <p className="muted">Connecting…</p>}

            {phase === 'error' && (
                <div className="status-message" role="alert">
                    <p>Could not connect: {error}</p>
                    <button className="secondary-button" type="button" onClick={() => void connect().catch(() => undefined)}>
                        Try again
                    </button>
                </div>
            )}

            {phase === 'recovering' && <ChooseNewPassword />}

            {phase === 'signed-out' && usesAccounts && <AccountGate />}

            {phase === 'ready' && usesAccounts && account && !account.username && <ChooseUsername />}

            {phase === 'ready' && (!usesAccounts || account?.username) && (
                <>
                    {usesAccounts ? (
                        <AccountBar />
                    ) : (
                        <SectionCard title="You at the table">
                            <label>
                                Display name
                                <input
                                    value={displayName}
                                    maxLength={40}
                                    onChange={(event) => setDisplayName(event.target.value)}
                                    placeholder="What your friends call you"
                                />
                            </label>
                        </SectionCard>
                    )}

                    {activeId ? <CampaignView /> : <Lobby onOpen={(campaign) => void openCampaign(campaign.id)} />}
                </>
            )}
        </section>
    )
}
