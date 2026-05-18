'use client'

import { Link } from '@/design/primitives/link'

export function DemoShelf() {
  return (
    <aside
      aria-label="Demo shelf"
      className="flex flex-col gap-[var(--space-3)]"
    >
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
        demo &nbsp;·&nbsp; 1 persona
      </p>
      <p className="font-[var(--font-serif)] text-[var(--text-sm)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)]">
        The Product Lead is already at the table.
      </p>
      <p className="font-[var(--font-serif)] italic text-[var(--text-xs)] text-[color:var(--ink-muted)]">
        The other personas need a session — <Link href="/signin?next=/app" variant="default">sign in</Link> to staff the full table.
      </p>
    </aside>
  )
}
