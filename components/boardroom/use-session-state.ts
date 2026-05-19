'use client'

import type {
  SessionErrorCode,
  SessionEvent,
  SessionPhase,
  TurnAuthor,
} from '@framework/schemas/events'
import { useReducer } from 'react'

export type SessionTurn = {
  id: string
  phase: SessionPhase
  personaSlug: string | null
  author: TurnAuthor
  replyingTo: string | null
  body: string
  tokens: number
  closed: boolean
}

export type SessionCheckpoint =
  | {
      kind: 'clarify'
      questions: { id: string; personaSlug: string; body: string }[]
    }
  | { kind: 'exec-summary'; body: string }

export type SessionArtifact = {
  specMd: string
  execSummary: string
  callouts: string
}

export type SessionBudget = {
  used: number
  warned: boolean
  wrapped: boolean
}

export type SessionError = {
  code: SessionErrorCode
  message: string
}

export type SessionState = {
  status: 'idle' | 'running' | 'done' | 'error'
  sessionId: string | null
  currentPhase: SessionPhase | null
  turns: SessionTurn[]
  currentCheckpoint: SessionCheckpoint | null
  artifact: SessionArtifact | null
  budget: SessionBudget
  error: SessionError | null
}

export type SessionAction =
  | { type: 'event'; event: SessionEvent }
  | { type: 'reset' }

export function initialSessionState(): SessionState {
  return {
    status: 'idle',
    sessionId: null,
    currentPhase: null,
    turns: [],
    currentCheckpoint: null,
    artifact: null,
    budget: { used: 0, warned: false, wrapped: false },
    error: null,
  }
}

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  if (action.type === 'reset') return initialSessionState()
  const event = action.event
  switch (event.type) {
    case 'session.started':
      return {
        ...state,
        status: 'running',
        sessionId: event.sessionId,
        error: null,
      }
    case 'phase.entered':
      return { ...state, currentPhase: event.phase, currentCheckpoint: null }
    case 'turn.begin': {
      const turn: SessionTurn = {
        id: event.turnId,
        phase: event.phase,
        personaSlug: event.personaSlug,
        author: event.author,
        replyingTo: event.replyingTo,
        body: '',
        tokens: 0,
        closed: false,
      }
      return { ...state, turns: [...state.turns, turn] }
    }
    case 'turn.delta':
      return {
        ...state,
        turns: state.turns.map((t) =>
          t.id === event.turnId && !t.closed
            ? { ...t, body: t.body + event.delta }
            : t,
        ),
      }
    case 'turn.end':
      return {
        ...state,
        turns: state.turns.map((t) =>
          t.id === event.turnId
            ? { ...t, tokens: event.tokens, closed: true }
            : t,
        ),
      }
    case 'checkpoint.clarify':
      return {
        ...state,
        currentCheckpoint: { kind: 'clarify', questions: event.questions },
      }
    case 'checkpoint.exec-summary':
      return {
        ...state,
        currentCheckpoint: { kind: 'exec-summary', body: event.body },
      }
    case 'budget.warn':
      return {
        ...state,
        budget: { ...state.budget, used: event.used, warned: true },
      }
    case 'budget.wrap':
      return {
        ...state,
        budget: { ...state.budget, used: event.used, wrapped: true },
      }
    case 'artifact.ready':
      return {
        ...state,
        artifact: {
          specMd: event.specMd,
          execSummary: event.execSummary,
          callouts: event.callouts,
        },
      }
    case 'session.done':
      return { ...state, status: 'done' }
    case 'session.error':
      return {
        ...state,
        status: 'error',
        error: { code: event.code, message: event.message },
      }
  }
}

export function useSessionState() {
  return useReducer(sessionReducer, undefined, initialSessionState)
}
