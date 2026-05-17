'use client'

import {
  DEMO_AUTO_ADVANCE_MS,
  MAX_DEMO_SESSIONS_PER_IP_PER_DAY,
} from '@/lib/limits'
import type { Persona } from '@/lib/schemas/persona'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DemoAlreadyUsed } from './demo-already-used'
import { DemoArtifactPreview } from './demo-artifact-preview'
import { DemoCTA } from './demo-cta'
import { DemoPitchInput } from './demo-pitch-input'
import { DemoRateLimitedCard } from './demo-rate-limited-card'
import { DemoShelf } from './demo-shelf'
import { DemoStartButton } from './demo-start-button'
import { DemoSurface } from './demo-surface'
import { DemoTranscript } from './demo-transcript'
import {
  readInitialDemoState,
  useDemoPersistence,
} from './use-demo-persistence'
import { useDemoState } from './use-demo-state'

type Props = {
  persona: Persona
}

type RateLimited = { used: number; limit: number }

export function TryClient({ persona }: Props) {
  const [state, dispatch] = useDemoState()
  const [hydrated, setHydrated] = useState(false)
  const [rateLimited, setRateLimited] = useState<RateLimited | null>(null)
  // True iff on first mount we found the demo-used flag already set.
  const alreadyUsedOnMount = useRef(false)

  useEffect(() => {
    if (hydrated) return
    const storage = typeof window !== 'undefined' ? window.sessionStorage : null
    const next = readInitialDemoState(storage)
    if (next.tag === 'done') alreadyUsedOnMount.current = true
    if (next.tag !== 'empty' || next.pitch) {
      dispatch({ type: 'HYDRATE', state: next })
    }
    setHydrated(true)
  }, [hydrated, dispatch])

  useDemoPersistence(state)

  // Auto-advance the canned transcript while running.
  useEffect(() => {
    if (state.tag !== 'running') return
    const timer = window.setTimeout(() => {
      dispatch({ type: 'ADVANCE' })
    }, DEMO_AUTO_ADVANCE_MS)
    return () => window.clearTimeout(timer)
  }, [state, dispatch])

  const handleStart = useCallback(async () => {
    try {
      const res = await fetch('/api/demo/begin', { method: 'POST' })
      if (res.status === 429) {
        const data = (await res.json().catch(() => ({}))) as {
          used?: number
          limit?: number
        }
        setRateLimited({
          used: data.used ?? MAX_DEMO_SESSIONS_PER_IP_PER_DAY,
          limit: data.limit ?? MAX_DEMO_SESSIONS_PER_IP_PER_DAY,
        })
        return
      }
    } catch {
      // Fail-open: a network blip on the rate-limit ping shouldn't block
      // the canned demo.
    }
    dispatch({ type: 'START' })
  }, [dispatch])

  if (hydrated && alreadyUsedOnMount.current) {
    return <DemoAlreadyUsed />
  }

  if (rateLimited) {
    return (
      <DemoRateLimitedCard used={rateLimited.used} limit={rateLimited.limit} />
    )
  }

  const revealIndex = state.tag === 'running' ? state.revealIndex : null
  const done = state.tag === 'done'
  const showTranscript = state.tag === 'running' || state.tag === 'done'

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-[var(--space-6)]">
      <DemoShelf persona={persona} />
      <section className="flex flex-col gap-[var(--space-5)]">
        <DemoSurface persona={persona} tag={state.tag} />
        <DemoPitchInput
          value={state.pitch}
          disabled={state.tag === 'running' || state.tag === 'done'}
          onChange={(pitch) => dispatch({ type: 'SET_PITCH', pitch })}
        />
        {!showTranscript && (
          <DemoStartButton
            disabled={state.tag !== 'ready'}
            onStart={() => {
              void handleStart()
            }}
          />
        )}
        {showTranscript && (
          <DemoTranscript
            persona={persona}
            revealIndex={revealIndex}
            done={done}
            onSkip={() => dispatch({ type: 'SKIP' })}
          />
        )}
        {done && (
          <>
            <DemoArtifactPreview />
            <DemoCTA />
          </>
        )}
      </section>
    </div>
  )
}
