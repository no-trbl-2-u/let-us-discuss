// SSE event union for /api/sessions.
//
// Final shape — phase 7b adds no new variants. The reducer in
// components/boardroom/use-session-state.ts handles every variant; 7a only
// exercises the not-implemented path.

export type SessionPhase =
  | 'clarify'
  | 'confer'
  | 'exec-summary'
  | 'specialists'
  | 'artifact'

export type TurnAuthor = 'persona' | 'user' | 'moderator'

export type SessionErrorCode =
  | 'not-implemented'
  | 'auth'
  | 'config'
  | 'internal'
  | 'budget'
  | 'moderation'
  | 'quota'

export type SessionEvent =
  | { type: 'session.started'; sessionId: string }
  | { type: 'phase.entered'; phase: SessionPhase }
  | {
      type: 'turn.begin'
      turnId: string
      phase: SessionPhase
      author: TurnAuthor
      personaSlug: string | null
      replyingTo: string | null
    }
  | { type: 'turn.delta'; turnId: string; delta: string }
  | { type: 'turn.end'; turnId: string; tokens: number }
  | {
      type: 'checkpoint.clarify'
      questions: { id: string; personaSlug: string; body: string }[]
    }
  | { type: 'checkpoint.exec-summary'; body: string }
  | { type: 'budget.warn'; used: number; remaining: number }
  | { type: 'budget.wrap'; used: number }
  | {
      type: 'artifact.ready'
      specMd: string
      execSummary: string
      callouts: string
    }
  | { type: 'session.done' }
  | { type: 'session.error'; code: SessionErrorCode; message: string }

export type SessionEventType = SessionEvent['type']
