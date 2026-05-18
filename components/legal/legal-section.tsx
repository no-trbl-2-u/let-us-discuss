import type { ReactNode } from 'react'

interface LegalSectionProps {
  id: string
  title: string
  children: ReactNode
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="mt-[var(--space-6)] scroll-mt-[var(--space-7)]"
    >
      <h2
        id={`${id}-heading`}
        className="font-[var(--font-serif)] font-semibold text-[var(--text-xl)] leading-[var(--leading-heading)] tracking-[var(--tracking-tight)] text-[color:var(--ink-strong)] mb-[var(--space-3)]"
      >
        <a
          href={`#${id}`}
          className="no-underline text-[color:var(--ink-strong)] hover:text-[color:var(--accent)]"
        >
          {title}
        </a>
      </h2>
      <div className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch] flex flex-col gap-[var(--space-4)]">
        {children}
      </div>
    </section>
  )
}
