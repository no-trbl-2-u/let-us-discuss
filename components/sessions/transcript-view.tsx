'use client'

import { LiveTranscript } from '@/components/boardroom/live-transcript'
import type { SessionTurn } from '@/components/boardroom/use-session-state'
import type { Persona } from '@/lib/schemas/persona'
import { useMemo } from 'react'

type Props = {
  turns: SessionTurn[]
  personas: readonly Persona[]
}

export function TranscriptView({ turns, personas }: Props) {
  const personasBySlug = useMemo(
    () => new Map(personas.map((p) => [p.slug, p])),
    [personas],
  )
  return <LiveTranscript turns={turns} personasBySlug={personasBySlug} />
}
