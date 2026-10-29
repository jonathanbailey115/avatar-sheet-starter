import SectionCard from '../components/SectionCard'
import type { CampaignMember, MemberStatus } from './types'

/** For the GM only: who has taken an extra class or subclass, which master taught it, and whether it is approved. */
export function MastersNote({ members, statuses }: { members: CampaignMember[]; statuses: MemberStatus[] }) {
    const rows = statuses.flatMap((status) => {
        const notes = status.summary.classNotes ?? []
        if (notes.length === 0) return []
        const owner = members.find((member) => member.userId === status.userId)?.displayName ?? 'Player'
        return [{ key: status.userId, name: status.summary.name, owner, notes }]
    })
    if (rows.length === 0) return null

    return (
        <SectionCard title="Masters and approvals (GM note)">
            <p className="muted">Extra classes and second subclasses the party has taken. Only you see this.</p>
            <ul className="stats">
                {rows.map((row) => (
                    <li key={row.key}>
                        <strong>{row.name}</strong> <span className="muted">({row.owner})</span>
                        <ul>
                            {row.notes.map((note, index) => (
                                <li key={index}>
                                    {note.className} {note.level}
                                    {note.subclassName ? ` · ${note.subclassName}` : ''} ·{' '}
                                    {note.master ? `taught by ${note.master}` : 'no master recorded'} ·{' '}
                                    <span className={note.gmApproved ? 'status-ok' : 'roll-error'}>{note.gmApproved ? 'GM approved' : 'not approved yet'}</span>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </SectionCard>
    )
}
