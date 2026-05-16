'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Persona } from '@/lib/schemas/persona'
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

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <PersonaCard
        name={persona.name}
        role={persona.role}
        voice={persona.voice}
        blurb={persona.summary}
        monogram={monogramFor(persona.name)}
        state={isDragging ? 'dragging' : seated ? 'staffed' : 'resting'}
        draggable={!seated}
        aria-label={`${persona.name} — drag to seat`}
      />
    </div>
  )
}
