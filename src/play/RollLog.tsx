import SectionCard from '../components/SectionCard'
import { useRollLog } from '../store/rollLog'
import { RollResult } from './RollResult'

export function RollLog() {
    const entries = useRollLog((state) => state.entries)
    const clear = useRollLog((state) => state.clear)

    return (
        <SectionCard title="Roll log">
            <div className="actions inline-actions">
                <button
                    className="link-button"
                    type="button"
                    disabled={entries.length === 0}
                    onClick={() => {
                        if (window.confirm('Clear the roll log?')) clear()
                    }}
                >
                    Clear log
                </button>
            </div>

            {entries.length === 0 ? (
                <p className="muted">Rolls will appear here.</p>
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
