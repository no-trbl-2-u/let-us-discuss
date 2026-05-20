import type { ReactNode } from 'react'

type UsageTileProps = {
  header: string
  body: ReactNode
  secondary?: ReactNode
}

export function UsageTile({ header, body, secondary }: UsageTileProps) {
  return (
    <section className="border border-[color:var(--paper-edge)] rounded-[var(--radius-md)] p-[var(--space-5)] bg-[color:var(--paper-raised)]">
      <h2 className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-3)]">
        {header}
      </h2>
      <div className="font-[var(--font-mono)] text-[var(--text-lg)] text-[color:var(--ink-strong)]">
        {body}
      </div>
      {secondary ? (
        <div className="mt-[var(--space-2)] font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
          {secondary}
        </div>
      ) : null}
    </section>
  )
}
