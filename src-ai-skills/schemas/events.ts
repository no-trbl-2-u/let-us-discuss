export type SessionPhase =
  | 'retro-review'
  | 'clarify'
  | 'confer'
  | 'exec-summary'
  | 'specialists'
  | 'artifact'
  | 'retrospective'

export type TurnAuthor = 'persona' | 'user' | 'moderator' | 'secretary'

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
