'use client'

import type { Persona } from '@framework/schemas/persona'
import { DraggablePersonaCard } from './draggable-persona-card'
import { seatedPersonas } from './use-board-state'
import type { BoardState } from './types'

type Props = {
  personas: readonly Persona[]
  boardState: BoardState
}

export function PersonaShelf({ personas, boardState }: Props) {
  const seated = new Set(seatedPersonas(boardState.seats))

  if (personas.length === 0) {
    return (
      <aside className="font-[var(--font-sans)] text-[var(--text-sm)] text-[color:var(--ink-muted)]">
        No personas yet — the v1 library ships in phase 4.
      </aside>
    )
  }

  return (
    <aside
      aria-label="Persona shelf"
      className="flex flex-row md:flex-col gap-[var(--space-4)] overflow-x-auto md:overflow-visible pb-[var(--space-2)] md:pb-0"
    >
      {personas.map((persona) => (
        <div key={persona.slug} className="shrink-0">
          <DraggablePersonaCard persona={persona} seated={seated.has(persona.slug)} />
        </div>
      ))}
    </aside>
  )
}
