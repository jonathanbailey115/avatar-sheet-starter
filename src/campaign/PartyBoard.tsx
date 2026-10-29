import { ConfirmButton } from '../components/ConfirmButton'
import { ElementEmblem } from '../components/ElementEmblem'
import { HpBar, healthLevel } from '../components/HpBar'
import { elementThemeForClassName } from '../lib/element'
import { useRulesContent } from '../store/rules'
import type { CampaignMember, MemberStatus } from './types'

type PartyBoardProps = {
    members: CampaignMember[]
    statuses: MemberStatus[]
    myUserId: string
    isGm: boolean
    onKick: (userId: string) => void
}

const STATE_LABEL = { conscious: '', dying: 'Dying', stable: 'Stable at 0', dead: 'Dead' } as const

const HEALTH_WORD = { healthy: 'Healthy', hurt: 'Hurt', critical: 'Critical', none: '' } as const

/** Everyone at the table with their current HP and state. This is the GM's view of the party. */
export function PartyBoard({ members, statuses, myUserId, isGm, onKick }: PartyBoardProps) {
    const { classes } = useRulesContent()
    const statusOf = (userId: string) => statuses.find((item) => item.userId === userId)?.summary
    const ordered = [...members].sort((a, b) => (a.role === b.role ? a.displayName.localeCompare(b.displayName) : a.role === 'gm' ? -1 : 1))

    return (
        <div className="party-board">
            {ordered.map((member) => {
                const summary = statusOf(member.userId)
                const life = summary?.lifeState ?? 'none'
                const element = summary ? elementThemeForClassName(summary.className, classes) : 'neutral'
                const health = summary && life === 'conscious' ? healthLevel(summary.hp, summary.maxHp) : 'none'

                return (
                    <article
                        key={member.userId}
                        className={`party-card party-${life}`}
                        data-element={element}
                        data-health={health}
                    >
                        <header>
                            {summary ? <ElementEmblem element={element} size="sm" /> : null}
                            <div className="party-who">
                                <strong>{summary ? summary.name : member.displayName}</strong>
                                <small className="muted">
                                    {summary
                                        ? `${member.displayName}${member.userId === myUserId ? ' (you)' : ''}`
                                        : member.userId === myUserId
                                          ? 'You'
                                          : ''}
                                </small>
                            </div>
                            {member.role === 'gm' && <span className="roll-tag roll-tag-gm">GM</span>}
                            {STATE_LABEL[summary?.lifeState ?? 'conscious'] && (
                                <span className={`roll-tag party-state party-state-${life}`}>
                                    {STATE_LABEL[summary?.lifeState ?? 'conscious']}
                                </span>
                            )}
                        </header>

                        {summary ? (
                            <>
                                <p className="muted party-sub">
                                    {summary.className} {summary.level} · {summary.lineageName}
                                </p>
                                <div className="party-hp">
                                    <strong className="party-hp-now">{summary.hp}</strong>
                                    <span className="party-hp-max">/ {summary.maxHp}</span>
                                    {summary.tempHp > 0 && <small className="hp-temp">+{summary.tempHp} temp</small>}
                                    {HEALTH_WORD[health] && <span className="party-health">{HEALTH_WORD[health]}</span>}
                                </div>
                                <HpBar current={summary.hp} max={summary.maxHp} label={`${summary.name} hit points`} />
                                <div className="party-stats">
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
                            <ConfirmButton
                                className="link-button"
                                question={`Remove ${member.displayName}?`}
                                onConfirm={() => onKick(member.userId)}
                            >
                                Remove from campaign
                            </ConfirmButton>
                        )}
                    </article>
                )
            })}
        </div>
    )
}
