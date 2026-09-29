import type { CampaignMember, MemberStatus } from './types'

type PartyBoardProps = {
    members: CampaignMember[]
    statuses: MemberStatus[]
    myUserId: string
    isGm: boolean
    onKick: (userId: string) => void
}

const STATE_LABEL = { conscious: '', dying: 'Dying', stable: 'Stable at 0', dead: 'Dead' } as const

function healthClass(hp: number, maxHp: number): string {
    if (maxHp <= 0) return 'hp-bar-fill'
    const ratio = hp / maxHp
    if (ratio > 0.5) return 'hp-bar-fill hp-healthy'
    if (ratio > 0.25) return 'hp-bar-fill hp-hurt'
    return 'hp-bar-fill hp-critical'
}

/** Everyone at the table with their current HP and state. This is the GM's view of the party. */
export function PartyBoard({ members, statuses, myUserId, isGm, onKick }: PartyBoardProps) {
    const statusOf = (userId: string) => statuses.find((item) => item.userId === userId)?.summary
    const ordered = [...members].sort((a, b) => (a.role === b.role ? a.displayName.localeCompare(b.displayName) : a.role === 'gm' ? -1 : 1))

    return (
        <div className="party-board">
            {ordered.map((member) => {
                const summary = statusOf(member.userId)
                const percent = summary && summary.maxHp > 0 ? Math.round((summary.hp / summary.maxHp) * 100) : 0

                return (
                    <article key={member.userId} className={`party-card party-${summary?.lifeState ?? 'none'}`}>
                        <header>
                            <strong>{member.displayName}</strong>
                            {member.role === 'gm' && <span className="roll-tag roll-tag-crit">GM</span>}
                            {member.userId === myUserId && <small className="muted"> (you)</small>}
                            {STATE_LABEL[summary?.lifeState ?? 'conscious'] && (
                                <span className="roll-tag roll-tag-fumble">{STATE_LABEL[summary?.lifeState ?? 'conscious']}</span>
                            )}
                        </header>

                        {summary ? (
                            <>
                                <p className="muted party-sub">
                                    {summary.name} · {summary.className} {summary.level} · {summary.lineageName}
                                </p>
                                <div className="hp-bar" role="progressbar" aria-label={`${summary.name} hit points`} aria-valuemin={0} aria-valuemax={summary.maxHp} aria-valuenow={summary.hp}>
                                    <div className={healthClass(summary.hp, summary.maxHp)} style={{ width: `${percent}%` }} />
                                </div>
                                <div className="party-stats">
                                    <span>
                                        <b>{summary.hp}</b>/{summary.maxHp}
                                        {summary.tempHp > 0 && <small className="hp-temp"> +{summary.tempHp}</small>}
                                    </span>
                                    <span>AC <b>{summary.armorClass}</b></span>
                                    <span>Init <b>{summary.initiative >= 0 ? '+' : ''}{summary.initiative}</b></span>
                                    {summary.saveDc !== null && <span>DC <b>{summary.saveDc}</b></span>}
                                    {summary.exhaustion > 0 && <span>Exh <b>{summary.exhaustion}</b></span>}
                                </div>
                            </>
                        ) : (
                            <p className="muted party-sub">
                                {member.role === 'gm' ? 'Running the game.' : 'No character shared yet.'}
                            </p>
                        )}

                        {isGm && member.userId !== myUserId && (
                            <button
                                className="link-button"
                                type="button"
                                onClick={() => {
                                    if (window.confirm(`Remove ${member.displayName} from the campaign?`)) onKick(member.userId)
                                }}
                            >
                                Remove from campaign
                            </button>
                        )}
                    </article>
                )
            })}
        </div>
    )
}
