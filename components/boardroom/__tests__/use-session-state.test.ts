import {
  type SessionAction,
  initialSessionState,
  sessionReducer,
} from '@/components/boardroom/use-session-state'
import type { SessionEvent } from '@framework/schemas/events'
import { describe, expect, it } from 'vitest'

function apply(events: SessionEvent[]) {
  return events.reduce(
    (s, event) => sessionReducer(s, { type: 'event', event }),
    initialSessionState(),
  )
}

describe('sessionReducer', () => {
  it('starts idle with empty state', () => {
    expect(initialSessionState()).toEqual({
      status: 'idle',
      sessionId: null,
      currentPhase: null,
      turns: [],
      currentCheckpoint: null,
      artifact: null,
      budget: { used: 0, warned: false, wrapped: false },
      error: null,
    })
  })

  it('transitions to running on session.started and records sessionId', () => {
    const s = apply([{ type: 'session.started', sessionId: 'sid-1' }])
    expect(s.status).toBe('running')
    expect(s.sessionId).toBe('sid-1')
  })

  it('transitions to error on session.error not-implemented', () => {
    const s = apply([
      { type: 'session.started', sessionId: 'sid-1' },
      { type: 'session.error', code: 'not-implemented', message: 'pending' },
    ])
    expect(s.status).toBe('error')
    expect(s.error).toEqual({ code: 'not-implemented', message: 'pending' })
  })

  it('handles a turn begin/delta/end sequence', () => {
    const s = apply([
      { type: 'session.started', sessionId: 'sid' },
      {
        type: 'turn.begin',
        turnId: 't1',
        phase: 'clarify',
        author: 'persona',
        personaSlug: 'product-lead',
        replyingTo: null,
      },
      { type: 'turn.delta', turnId: 't1', delta: 'hello ' },
      { type: 'turn.delta', turnId: 't1', delta: 'world' },
      { type: 'turn.end', turnId: 't1', tokens: 12 },
    ])
    expect(s.turns).toHaveLength(1)
    expect(s.turns[0]).toMatchObject({
      id: 't1',
      body: 'hello world',
      tokens: 12,
      closed: true,
    })
  })

  it('ignores deltas to a closed turn', () => {
    const s = apply([
      { type: 'session.started', sessionId: 'sid' },
      {
        type: 'turn.begin',
        turnId: 't1',
        phase: 'clarify',
        author: 'persona',
        personaSlug: 'product-lead',
        replyingTo: null,
      },
      { type: 'turn.end', turnId: 't1', tokens: 0 },
      { type: 'turn.delta', turnId: 't1', delta: 'late' },
    ])
    expect(s.turns[0]?.body).toBe('')
  })

  it('records clarify and exec-summary checkpoints', () => {
    const sClarify = apply([
      {
        type: 'checkpoint.clarify',
        questions: [{ id: 'q1', personaSlug: 'product-lead', body: 'who?' }],
      },
    ])
    expect(sClarify.currentCheckpoint).toEqual({
      kind: 'clarify',
      questions: [{ id: 'q1', personaSlug: 'product-lead', body: 'who?' }],
    })

    const sExec = apply([
      { type: 'checkpoint.exec-summary', body: 'summary text' },
    ])
    expect(sExec.currentCheckpoint).toEqual({
      kind: 'exec-summary',
      body: 'summary text',
    })
  })

  it('flags budget warned and wrapped', () => {
    const s = apply([
      { type: 'budget.warn', used: 50000, remaining: 10000 },
      { type: 'budget.wrap', used: 60000 },
    ])
    expect(s.budget).toEqual({ used: 60000, warned: true, wrapped: true })
  })

  it('captures the artifact bundle on artifact.ready', () => {
    const s = apply([
      {
        type: 'artifact.ready',
        specMd: '# spec',
        execSummary: 'sum',
        callouts: '- x',
      },
    ])
    expect(s.artifact).toEqual({
      specMd: '# spec',
      execSummary: 'sum',
      callouts: '- x',
    })
  })

  it('reset action restores the initial state', () => {
    const after = sessionReducer(
      apply([{ type: 'session.started', sessionId: 'sid' }]),
      { type: 'reset' } satisfies SessionAction,
    )
    expect(after).toEqual(initialSessionState())
  })
})
