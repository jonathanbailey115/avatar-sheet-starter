import type { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
}

export default function SectionCard({ title, children }: Props) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  )
}