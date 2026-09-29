import SectionCard from '../components/SectionCard'
import { characterDisplayName } from '../lib/character'
import { useCampaignStore } from '../store/campaign'
import { useLibraryStore } from '../store/library'
import { CampaignLog } from './CampaignLog'
import { formatCode } from './code'
import { PartyBoard } from './PartyBoard'

async function copy(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text)
    } catch {
        window.prompt('Copy this:', text)
    }
}

/** One open campaign: the party board, the shared log, and your settings for it. */
export function CampaignView() {
    const snapshot = useCampaignStore((state) => state.snapshot)
    const userId = useCampaignStore((state) => state.userId)
    const bindings = useCampaignStore((state) => state.bindings)
    const privateRolls = useCampaignStore((state) => state.privateRolls)
    const displayName = useCampaignStore((state) => state.displayName)
    const gmKey = useCampaignStore((state) => (snapshot ? state.gmKeys[snapshot.campaign.id] : undefined))
    const { closeCampaign, leaveCampaign, clearLog, removeMember, bindCharacter, setPrivateRolls, gmRoll } =
        useCampaignStore.getState()
    const characters = useLibraryStore((state) => state.characters)

    if (!snapshot) return null

    const { campaign } = snapshot
    const me = snapshot.members.find((member) => member.userId === userId)
    const isGm = me?.role === 'gm'
    const playingAs = characters.find((character) => bindings[character.id] === campaign.id)?.id ?? ''

    const choose = (characterId: string) => {
        for (const character of characters) {
            if (bindings[character.id] === campaign.id) bindCharacter(character.id, null)
        }
        if (characterId) bindCharacter(characterId, campaign.id)
    }

    return (
        <div className="campaign-view">
            <SectionCard title={campaign.name}>
                <div className="campaign-head">
                    <div>
                        <span className="muted">Join code</span>
                        <div className="join-code">
                            <strong>{formatCode(campaign.code)}</strong>
                            <button className="secondary-button" type="button" onClick={() => void copy(formatCode(campaign.code))}>
                                Copy
                            </button>
                        </div>
                    </div>
                    <div className="actions inline-actions">
                        <span className="roll-tag roll-tag-crit">{isGm ? 'YOU ARE THE GM' : 'PLAYER'}</span>
                        <button className="secondary-button" type="button" onClick={closeCampaign}>
                            Back to campaigns
                        </button>
                    </div>
                </div>

                <div className="two-col">
                    <label>
                        Playing as
                        <select value={playingAs} onChange={(event) => choose(event.target.value)}>
                            <option value="">No character (just watching)</option>
                            {characters.map((character) => (
                                <option key={character.id} value={character.id}>
                                    {characterDisplayName(character)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="inline-check">
                        <input type="checkbox" checked={privateRolls} onChange={(event) => setPrivateRolls(event.target.checked)} />
                        Send my rolls to the GM only
                    </label>
                </div>
                <p className="muted">
                    While a character is playing here, its rolls and its HP, AC and state are shared with this campaign.
                </p>
            </SectionCard>

            <div className="campaign-grid">
                <SectionCard title="Party">
                    <PartyBoard
                        members={snapshot.members}
                        statuses={snapshot.statuses}
                        myUserId={userId}
                        isGm={Boolean(isGm)}
                        onKick={(id) => void removeMember(id)}
                    />
                </SectionCard>

                <SectionCard title="Game log">
                    <CampaignLog
                        rolls={snapshot.rolls}
                        isGm={Boolean(isGm)}
                        myName={displayName}
                        privateRolls={privateRolls}
                        onClear={() => void clearLog()}
                        onRoll={gmRoll}
                    />
                </SectionCard>
            </div>

            <SectionCard title="Campaign settings">
                {isGm && gmKey && (
                    <div className="gm-key">
                        <p>
                            <strong>GM recovery key</strong>: <code>{gmKey}</code>{' '}
                            <button className="secondary-button" type="button" onClick={() => void copy(gmKey)}>
                                Copy
                            </button>
                        </p>
                        <p className="muted">
                            Save this somewhere safe. If you clear your browser or switch computers, the join code plus this key
                            gets you back in as the GM.
                        </p>
                    </div>
                )}
                <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                        if (window.confirm(`Leave ${campaign.name}?`)) void leaveCampaign(campaign.id)
                    }}
                >
                    Leave this campaign
                </button>
            </SectionCard>
        </div>
    )
}
