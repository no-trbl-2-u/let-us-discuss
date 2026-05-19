'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Persona } from '@framework/schemas/persona'
import { monogramFor } from '@/lib/personas/monogram'
import { PersonaCard } from '@/design/primitives/persona-card'

type Props = {
  persona: Persona
  seated: boolean
}

export function DraggablePersonaCard({ persona, seated }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `persona:${persona.slug}`,
      data: { personaSlug: persona.slug },
      disabled: seated,
    })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  // The wrapper is the focusable + dnd-kit-driven button.
  // The inner PersonaCard renders as a pure article (no
  // button role, no own tabIndex) so screen readers and
  // keyboard tab order only see one interactive surface.
  return (
    <div
      ref={setNodeRef}
      style={style}
      aria-label={
        seated
          ? `${persona.name} — seated at the boardroom table`
          : `${persona.name} — press space or enter to pick up, then arrow keys to choose a seat`
      }
      className="rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ring-offset)]"
      {...listeners}
      {...attributes}
    >
      <PersonaCard
        name={persona.name}
        role={persona.role}
        voice={persona.voice}
        blurb={persona.summary}
        monogram={monogramFor(persona.name)}
        state={isDragging ? 'dragging' : seated ? 'staffed' : 'resting'}
        draggable={false}
      />
    </div>
  )
}
