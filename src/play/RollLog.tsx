import { ConfirmButton } from '../components/ConfirmButton'
import SectionCard from '../components/SectionCard'
import { useRollLog } from '../store/rollLog'
import { RollResult } from './RollResult'
import { EmptyState } from '../components/EmptyState'

export function RollLog() {
    const entries = useRollLog((state) => state.entries)
    const clear = useRollLog((state) => state.clear)

    return (
        <SectionCard title="Roll log">
            <div className="actions inline-actions">
                <ConfirmButton className="link-button" disabled={entries.length === 0} question="Clear the roll log?" onConfirm={clear}>
                    Clear log
                </ConfirmButton>
            </div>

            {entries.length === 0 ? (
                <EmptyState title="No rolls yet">Tap any modifier on the sheet to roll it.</EmptyState>
            ) : (
                <div className="roll-log">
                    {entries.slice(0, 40).map((entry) => (
                        <RollResult key={entry.id} entry={entry} showWho />
                    ))}
                </div>
            )}
        </SectionCard>
    )
}
