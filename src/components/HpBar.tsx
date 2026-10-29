export type HealthLevel = 'healthy' | 'hurt' | 'critical' | 'none'

/** Over half is healthy (green), over a quarter is hurt (amber), the rest is critical (red). */
export function healthLevel(current: number, max: number): HealthLevel {
    if (max <= 0) return 'none'
    const ratio = current / max
    if (ratio > 0.5) return 'healthy'
    if (ratio > 0.25) return 'hurt'
    return 'critical'
}

/** The hit-point bar used on the play sheet and the party board. */
export function HpBar({ current, max, label }: { current: number; max: number; label: string }) {
    const percent = max > 0 ? Math.round((current / max) * 100) : 0
    const level = healthLevel(current, max)
    return (
        <div className="hp-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={current}>
            <div className={level === 'none' ? 'hp-bar-fill' : `hp-bar-fill hp-${level}`} style={{ width: `${percent}%` }} />
        </div>
    )
}
