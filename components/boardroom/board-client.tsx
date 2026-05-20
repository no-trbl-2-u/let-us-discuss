'use client'

import type { Persona } from '@framework/schemas/persona'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_MODEL, resolveModel } from '@/lib/anthropic/models'
import { ArtifactPreviewGrid } from './artifact-preview-grid'
import { ModelPicker } from './model-picker'
import { BoardroomEmptyHint } from './boardroom-empty-hint'
import { BoardroomSurface } from './boardroom-surface'
import { BudgetBanner } from './budget-banner'
import { ClarifyPrompt } from './clarify-prompt'
import { ExecSummaryCard } from './exec-summary-card'
import { RetroReviewCheckpoint } from './retro-review-checkpoint'
import { LiveTranscript } from './live-transcript'
import { PersonaShelf } from './persona-shelf'
import { PitchInput } from './pitch-input'
import { SessionErrorCard } from './session-error'
import { sendAnswer, startSession } from './session-stream'
import { StartSessionButton } from './start-session-button'
import type { SeatId } from './types'
import {
  readInitialBoardState,
  useBoardPersistence,
} from './use-board-persistence'
import { seatedPersonas, useBoardState } from './use-board-state'
import { useSessionState } from './use-session-state'

type Props = {
  personas: readonly Persona[]
  templateFirstPhaseName: string
  templateSlug: string
}

export function BoardClient({
  personas,
  templateFirstPhaseName,
  templateSlug,
}: Props) {
  const [state, dispatch] = useBoardState()
  const [session, sessionDispatch] = useSessionState()
  const [hydrated, setHydrated] = useState(false)
  const [model, setModel] = useState<string>(DEFAULT_MODEL)
  const personasBySlug = useMemo(
    () => new Map(personas.map((p) => [p.slug, p])),
    [personas],
  )

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
    const personaSlug = (
      event.active.data.current as { personaSlug?: string } | undefined
    )?.personaSlug
    const seatId = (event.over.data.current as { seatId?: number } | undefined)
      ?.seatId
    if (!personaSlug || seatId === undefined) return
    dispatch({ type: 'SEAT_PERSONA', personaSlug, seatId: seatId as SeatId })
  }

  const handleStart = useCallback(() => {
    dispatch({ type: 'START' })
    sessionDispatch({ type: 'reset' })
    void startSession(
      {
        pitch: state.pitch,
        personaSlugs: seatedPersonas(state.seats),
        templateSlug,
        model: resolveModel(model),
      },
      (ev) => sessionDispatch({ type: 'event', event: ev }),
    )
  }, [dispatch, sessionDispatch, state.pitch, state.seats, templateSlug, model])

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' })
    sessionDispatch({ type: 'reset' })
  }, [dispatch, sessionDispatch])

  const sessionId = session.sessionId
  const submitClarify = useCallback(
    (answer: string) => {
      if (!sessionId) return
      void sendAnswer(sessionId, { kind: 'clarify', body: answer })
    },
    [sessionId],
  )
  const submitAccept = useCallback(() => {
    if (!sessionId) return
    void sendAnswer(sessionId, { kind: 'exec-summary-accept', body: 'accept' })
  }, [sessionId])
  const submitRedirect = useCallback(
    (body: string) => {
      if (!sessionId) return
      void sendAnswer(sessionId, { kind: 'exec-summary-redirect', body })
    },
    [sessionId],
  )
  const submitRetroReview = useCallback(
    (picked: string[]) => {
      if (!sessionId) return
      void sendAnswer(sessionId, { kind: 'retro-review', picked })
    },
    [sessionId],
  )

  const checkpoint = session.currentCheckpoint
  const showError = session.error !== null
  const showArtifact = session.artifact !== null && session.status === 'done'

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-[var(--space-6)]">
        <div className="flex flex-col gap-[var(--space-3)]">
          <PersonaShelf personas={personas} boardState={state} />
          <p
            aria-label="secretary at the table"
            className="font-[var(--font-mono)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]"
          >
            Plus the Secretary &nbsp;·&nbsp; logs every phase boundary
          </p>
        </div>
        <section className="flex flex-col gap-[var(--space-5)]">
          <BoardroomSurface
            boardState={state}
            personasBySlug={personasBySlug}
          />
          <BoardroomEmptyHint />
          <PitchInput
            value={state.pitch}
            disabled={state.tag === 'running'}
            onChange={(pitch) => dispatch({ type: 'SET_PITCH', pitch })}
          />
          <ModelPicker
            value={model}
            onChange={setModel}
            disabled={state.tag === 'running'}
          />
          <StartSessionButton
            disabled={state.tag !== 'ready'}
            onStart={handleStart}
            templateFirstPhaseName={templateFirstPhaseName}
          />
          {state.tag === 'running' && session.status !== 'idle' && (
            <>
              <LiveTranscript
                turns={session.turns}
                personasBySlug={personasBySlug}
              />
              <BudgetBanner budget={session.budget} />
              {checkpoint?.kind === 'clarify' && !showError && (
                <ClarifyPrompt
                  questions={checkpoint.questions}
                  onSubmit={submitClarify}
                />
              )}
              {checkpoint?.kind === 'exec-summary' && !showError && (
                <ExecSummaryCard
                  summary={checkpoint.body}
                  onAccept={submitAccept}
                  onRedirect={submitRedirect}
                />
              )}
              {checkpoint?.kind === 'retro-review' && !showError && (
                <RetroReviewCheckpoint
                  items={checkpoint.items}
                  onSubmit={submitRetroReview}
                />
              )}
              {showArtifact && session.artifact && (
                <ArtifactPreviewGrid
                  artifact={session.artifact}
                  tokensUsed={session.budget.used}
                  wrapped={session.budget.wrapped}
                  sessionId={session.sessionId}
                />
              )}
              {showError && session.error && (
                <SessionErrorCard error={session.error} onReset={handleReset} />
              )}
            </>
          )}
        </section>
      </div>
    </DndContext>
  )
}
