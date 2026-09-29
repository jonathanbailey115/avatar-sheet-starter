import type { RollModifiers } from '../engine/effects'

/**
 * Green A for advantage, red D for disadvantage. Hover (or focus) shows every source.
 * If both apply they cancel, so a muted badge explains why the roll is normal.
 */
export function RollBadge({ roll }: { roll: RollModifiers }) {
    if (roll.advantage.length === 0 && roll.disadvantage.length === 0) return null

    const lines: string[] = []
    if (roll.advantage.length > 0) lines.push(`Advantage: ${roll.advantage.join(', ')}`)
    if (roll.disadvantage.length > 0) lines.push(`Disadvantage: ${roll.disadvantage.join(', ')}`)
    if (roll.net === 'normal') lines.push('They cancel out: roll normally.')
    const label = lines.join('. ')

    const className =
        roll.net === 'advantage'
            ? 'roll-badge roll-badge-adv'
            : roll.net === 'disadvantage'
              ? 'roll-badge roll-badge-dis'
              : 'roll-badge roll-badge-cancel'
    const text = roll.net === 'advantage' ? 'A' : roll.net === 'disadvantage' ? 'D' : 'A/D'

    return (
        <span className={className} title={label} aria-label={label} tabIndex={0} role="img">
            {text}
        </span>
    )
}
