'use client'

import { Link } from '@/design/primitives/link'

export function DemoShelf() {
  return (
    <aside
      aria-label="Demo shelf"
      className="flex flex-col gap-[var(--space-3)]"
    >
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
        demo &nbsp;·&nbsp; one persona
      </p>
      <p className="font-[var(--font-serif)] italic text-[var(--text-xs)] text-[color:var(--ink-muted)]">
        <Link href="/signin?next=/app" variant="default">Sign in</Link> to
        staff the table yourself.
      </p>
    </aside>
  )
}
