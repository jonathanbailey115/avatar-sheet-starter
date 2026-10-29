import type { ReactNode } from 'react'

/** A dashed box with a short title, one line of help and, optionally, the next step to take. */
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
    return (
        <div className="empty-state">
            <strong>{title}</strong>
            {children && <p>{children}</p>}
            {action}
        </div>
    )
}
