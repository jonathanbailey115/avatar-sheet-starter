import type { ReactNode } from 'react'

interface Props {
  title: string
  /** Optional control shown at the right of the header (one action at most). */
  action?: ReactNode
  className?: string
  children: ReactNode
}

/** The standard card: a header strip with an accent tick and the title, then the body. */
export default function SectionCard({ title, action, className, children }: Props) {
  return (
    <section className={className ? `card section-card ${className}` : 'card section-card'}>
      <header className="card-head">
        <h2>{title}</h2>
        {action && <div className="card-head-action">{action}</div>}
      </header>
      <div className="card-body">{children}</div>
    </section>
  )
}
