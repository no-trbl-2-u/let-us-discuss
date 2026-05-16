'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Persona } from '@/lib/schemas/persona'
import { BoardroomEmptyHint } from './boardroom-empty-hint'
import { BoardroomSurface } from './boardroom-surface'
import { PersonaShelf } from './persona-shelf'
import { PitchInput } from './pitch-input'
import { StartSessionButton } from './start-session-button'
import { TranscriptPlaceholder } from './transcript-placeholder'
import type { SeatId } from './types'
import {
  readInitialBoardState,
  useBoardPersistence,
} from './use-board-persistence'
import { useBoardState } from './use-board-state'

type Props = {
  personas: readonly Persona[]
  templateFirstPhaseName: string
  templateFirstPhaseDescription: string
}

export function BoardClient({
  personas,
  templateFirstPhaseName,
  templateFirstPhaseDescription,
}: Props) {
  const [state, dispatch] = useBoardState()
  const [hydrated, setHydrated] = useState(false)
  const personasBySlug = useMemo(
    () => new Map(personas.map((p) => [p.slug, p])),
    [personas],
  )

  // Hydrate once on mount from URL params + sessionStorage. We don't read
  // these on the server (would force-dynamic the entire route on every
  // request); we keep the initial render as the canonical empty state and
  // then dispatch HYDRATE.
  useEffect(() => {
    if (hydrated) return
    const search = typeof window !== 'undefined' ? window.location.search : ''
    const storage = typeof window !== 'undefined' ? window.sessionStorage : null
    const next = readInitialBoardState(search, storage, personas)
    if (next.tag !== 'empty' || next.pitch) {
      dispatch({ type: 'HYDRATE', state: next })
    }
    setHydrated(true)
  }, [hydrated, personas, dispatch])

  useBoardPersistence(state)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over) return
    const personaSlug = (event.active.data.current as { personaSlug?: string } | undefined)
      ?.personaSlug
    const seatId = (event.over.data.current as { seatId?: number } | undefined)?.seatId
    if (!personaSlug || seatId === undefined) return
    dispatch({ type: 'SEAT_PERSONA', personaSlug, seatId: seatId as SeatId })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-[var(--space-6)]">
        <PersonaShelf personas={personas} boardState={state} />
        <section className="flex flex-col gap-[var(--space-5)]">
          <BoardroomSurface boardState={state} personasBySlug={personasBySlug} />
          <BoardroomEmptyHint />
          <PitchInput
            value={state.pitch}
            disabled={state.tag === 'running'}
            onChange={(pitch) => dispatch({ type: 'SET_PITCH', pitch })}
          />
          <StartSessionButton
            disabled={state.tag !== 'ready'}
            onStart={() => dispatch({ type: 'START' })}
            templateFirstPhaseName={templateFirstPhaseName}
          />
          <TranscriptPlaceholder
            visible={state.tag === 'running'}
            excerpt={templateFirstPhaseDescription}
          />
        </section>
      </div>
    </DndContext>
  )
}
