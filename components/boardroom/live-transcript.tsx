'use client'

import { TurnBubble } from '@/design/primitives/turn-bubble'
import type { Persona } from '@framework/schemas/persona'
import { useEffect, useRef } from 'react'
import type { SessionTurn } from './use-session-state'

type Props = {
  turns: SessionTurn[]
  personasBySlug: Map<string, Persona>
}

function monogramFor(name: string): string {
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase())
  return initials.join('') || '?'
}

export function LiveTranscript({ turns, personasBySlug }: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = endRef.current
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [turns.length])

  if (turns.length === 0) {
    return (
      <TurnBubble
        name="Boardroom"
        voice="moderator"
        monogram="B"
        register="moderator"
        thinking
      />
    )
  }

  return (
    <section
      aria-label="session transcript"
      role="log"
      aria-live="polite"
      className="flex flex-col"
    >
      {turns.map((turn, i) => {
        const persona =
          turn.personaSlug != null ? personasBySlug.get(turn.personaSlug) : null
        const name =
          turn.author === 'user'
            ? 'You'
            : turn.author === 'moderator'
              ? 'Boardroom'
              : (persona?.name ?? turn.personaSlug ?? 'Persona')
        const voice =
          turn.author === 'user'
            ? 'pitch author'
            : turn.author === 'moderator'
              ? 'moderator'
              : (persona?.voice ?? '')
        const monogram = turn.author === 'user' ? 'YOU' : monogramFor(name)
        const isLast = i === turns.length - 1
        return (
          <TurnBubble
            key={turn.id}
            name={name}
            voice={voice}
            monogram={monogram}
            register={turn.author === 'moderator' ? 'moderator' : 'lead'}
            body={turn.body}
            streaming={!turn.closed && isLast}
          />
        )
      })}
      <div ref={endRef} />
    </section>
  )
}
