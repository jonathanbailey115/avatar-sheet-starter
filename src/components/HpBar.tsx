function healthClass(current: number, max: number): string {
    if (max <= 0) return 'hp-bar-fill'
    const ratio = current / max
    if (ratio > 0.5) return 'hp-bar-fill hp-healthy'
    if (ratio > 0.25) return 'hp-bar-fill hp-hurt'
    return 'hp-bar-fill hp-critical'
}

/** The hit-point bar used on the play sheet and the party board. */
export function HpBar({ current, max, label }: { current: number; max: number; label: string }) {
    const percent = max > 0 ? Math.round((current / max) * 100) : 0
    return (
        <div className="hp-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={current}>
            <div className={healthClass(current, max)} style={{ width: `${percent}%` }} />
        </div>
    )
}
