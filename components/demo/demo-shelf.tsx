'use client'

import type { Persona } from '@/lib/schemas/persona'
import { Link } from '@/design/primitives/link'
import { monogramFor } from '@/lib/personas/monogram'
import { PersonaCard } from '@/design/primitives/persona-card'

type Props = {
  persona: Persona
}

export function DemoShelf({ persona }: Props) {
  return (
    <aside
      aria-label="Demo shelf"
      className="flex flex-col gap-[var(--space-3)]"
    >
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
        demo &nbsp;·&nbsp; 1 persona
      </p>
      <PersonaCard
        draggable={false}
        state="staffed"
        name={persona.name}
        role={persona.role}
        voice={persona.voice}
        blurb={persona.summary}
        monogram={monogramFor(persona.name)}
      />
      <p className="font-[var(--font-serif)] italic text-[var(--text-xs)] text-[color:var(--ink-muted)]">
        The other personas need a session — <Link href="/signin?next=/app" variant="default">sign in</Link> to staff the full table.
      </p>
    </aside>
  )
}
