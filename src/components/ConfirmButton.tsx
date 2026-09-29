import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
    className?: string
    disabled?: boolean
    /** What to ask, shown next to Yes / Cancel. */
    question: string
    onConfirm: () => void
    children: ReactNode
}

/**
 * A button that asks "Are you sure?" on the page itself. The browser's own confirm() box can be
 * blocked or auto-dismissed inside app windows, which made buttons like Remove do nothing.
 */
export function ConfirmButton({ className, disabled, question, onConfirm, children }: Props) {
    const [asking, setAsking] = useState(false)

    // Forget the question if the button is disabled or the row goes away.
    useEffect(() => {
        if (disabled) setAsking(false)
    }, [disabled])

    if (!asking) {
        return (
            <button className={className} type="button" disabled={disabled} onClick={() => setAsking(true)}>
                {children}
            </button>
        )
    }

    return (
        <span className="confirm-inline" role="alertdialog" aria-label={question}>
            <span>{question}</span>{' '}
            <button
                className="primary-button"
                type="button"
                onClick={() => {
                    setAsking(false)
                    onConfirm()
                }}
            >
                Yes
            </button>{' '}
            <button className="secondary-button" type="button" onClick={() => setAsking(false)}>
                Cancel
            </button>
        </span>
    )
}
