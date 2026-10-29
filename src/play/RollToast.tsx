import { useEffect, useRef, useState } from 'react'
import { useRollLog } from '../store/rollLog'
import { RollResult } from './RollResult'

const SHOW_FOR_MS = 6000

/**
 * Pops the newest roll up at the bottom of the screen so it can be seen while scrolled down the
 * sheet (the roll bar at the top keeps it too). Tapping × or waiting hides it.
 */
export function RollToast({ characterId }: { characterId: string }) {
    const latest = useRollLog((state) => state.entries.find((entry) => entry.characterId === characterId))
    const [visibleId, setVisibleId] = useState<string | null>(null)
    const firstId = useRef(latest?.id)

    useEffect(() => {
        // Only rolls made after the sheet opened pop up.
        if (!latest || latest.id === firstId.current) return
        setVisibleId(latest.id)
        const timer = window.setTimeout(() => setVisibleId(null), SHOW_FOR_MS)
        return () => window.clearTimeout(timer)
    }, [latest])

    if (!latest || visibleId !== latest.id) return null

    return (
        <div className="roll-toast" key={latest.id}>
            <RollResult entry={latest} />
            <button type="button" className="roll-toast-close" aria-label="Hide roll" onClick={() => setVisibleId(null)}>
                ×
            </button>
        </div>
    )
}
