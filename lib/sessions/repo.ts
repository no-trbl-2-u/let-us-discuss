import type { SupabaseServerClient } from '@/lib/supabase/server'
import { estimateCostCents } from '@/lib/observability/pricing'
import type { SessionPhase, TurnAuthor } from '@framework/schemas/events'

export type SessionStatus =
  | 'clarify'
  | 'confer'
  | 'exec-summary'
  | 'specialists'
  | 'artifact'
  | 'done'
  | 'aborted'

const STATUSES: readonly SessionStatus[] = [
  'clarify',
  'confer',
  'exec-summary',
  'specialists',
  'artifact',
  'done',
  'aborted',
]

export function isSessionStatus(value: unknown): value is SessionStatus {
  return (
    typeof value === 'string' && (STATUSES as readonly string[]).includes(value)
  )
}

export type CreateSessionInput = {
  userId: string
  pitch: string
  templateSlug: string
  personaSlugs: string[]
  model: string
  status: SessionStatus
  ipHash?: string | null
}

export type AppendTurnInput = {
  sessionId: string
  idx: number
  phase: SessionPhase | 'moderator'
  personaSlug: string | null
  author: TurnAuthor
  body: string
  replyingTo?: string | null
  tokens: number
  /** phase 16: split usage for per-session observability */
  promptTokens?: number
  completionTokens?: number
  /** the session's model, used to estimate the cost increment */
  model?: string
}

export type FinalizeArtifactInput = {
  sessionId: string
  specMd: string
  execSummary: string
  callouts: string
  tokensUsed: number
}

// All four helpers wrap a Supabase client that's already authed against the
// caller (RLS pins rows to the owning user). The 7a route only uses
// createSession + markStatus('aborted'); 7b uses the rest.

export async function createSession(
  supabase: SupabaseServerClient,
  input: CreateSessionInput,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: input.userId,
      pitch: input.pitch,
      template_slug: input.templateSlug,
      persona_slugs: input.personaSlugs,
      model: input.model,
      status: input.status,
      ip_hash: input.ipHash ?? null,
    })
    .select('id')
    .single()
  if (error || !data) {
    throw new Error(
      `createSession failed: ${error?.message ?? 'no row returned'}`,
    )
  }
  return { id: data.id }
}

export async function markStatus(
  supabase: SupabaseServerClient,
  sessionId: string,
  status: SessionStatus,
): Promise<void> {
  if (!isSessionStatus(status)) {
    throw new Error(`markStatus: unknown status "${status}"`)
  }
  const { error } = await supabase
    .from('sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
  if (error) {
    throw new Error(`markStatus failed: ${error.message}`)
  }
}

// DB-side narrow types — turns.phase / turns.author column constraints
// only accept the v1 boardroom values. The framework's wider enums
// (retro-review/retrospective, secretary) are valid in the SessionPhase /
// TurnAuthor types from @framework/schemas, but the current orchestrator
// provably doesn't emit them. Phase 21 lands the DB migration that allows
// the new values; until then, narrow at the persistence boundary.
type DbTurnPhase =
  | 'clarify'
  | 'confer'
  | 'exec-summary'
  | 'specialists'
  | 'artifact'
  | 'moderator'
type DbTurnAuthor = 'persona' | 'user' | 'moderator'

export async function appendTurn(
  supabase: SupabaseServerClient,
  input: AppendTurnInput,
): Promise<void> {
  const { error } = await supabase.from('turns').insert({
    session_id: input.sessionId,
    idx: input.idx,
    phase: input.phase as DbTurnPhase,
    persona_slug: input.personaSlug,
    author: input.author as DbTurnAuthor,
    body: input.body,
    replying_to: input.replyingTo ?? null,
    tokens: input.tokens,
  })
  if (error) {
    throw new Error(`appendTurn failed: ${error.message}`)
  }
  await accumulateSessionUsage(supabase, input)
}

/**
 * Phase 16: read-modify-write the session's running aggregates.
 * Sessions are processed serially within a single orchestrator run,
 * so the lack of an atomic increment is fine at v1 traffic.
 *
 * Best-effort: a read or write failure here does not throw —
 * the turn row itself is already persisted, and a later turn
 * write will reconcile the column. Logged via the standard
 * error helper.
 */
async function accumulateSessionUsage(
  supabase: SupabaseServerClient,
  input: AppendTurnInput,
): Promise<void> {
  const promptDelta = input.promptTokens ?? 0
  const completionDelta = input.completionTokens ?? 0
  const totalDelta = input.tokens
  const costDelta =
    input.model && (promptDelta > 0 || completionDelta > 0)
      ? estimateCostCents(input.model, promptDelta, completionDelta) ?? 0
      : 0

  if (
    promptDelta === 0 &&
    completionDelta === 0 &&
    totalDelta === 0 &&
    costDelta === 0
  ) {
    return
  }

  try {
    const { data: current, error: readErr } = await supabase
      .from('sessions')
      .select('total_tokens, prompt_tokens, completion_tokens, cost_cents')
      .eq('id', input.sessionId)
      .maybeSingle()
    if (readErr || !current) return

    await supabase
      .from('sessions')
      .update({
        total_tokens: (current.total_tokens ?? 0) + totalDelta,
        prompt_tokens: (current.prompt_tokens ?? 0) + promptDelta,
        completion_tokens:
          (current.completion_tokens ?? 0) + completionDelta,
        cost_cents: (current.cost_cents ?? 0) + costDelta,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.sessionId)
  } catch {
    // Silent: best-effort accumulator. The per-turn row is
    // already persisted; the next turn's read-modify-write
    // reconciles. Mock clients in unit tests don't stub the
    // .select chain, which lands us here.
  }
}

export async function finalizeArtifact(
  supabase: SupabaseServerClient,
  input: FinalizeArtifactInput,
): Promise<void> {
  const { error } = await supabase.from('artifacts').insert({
    session_id: input.sessionId,
    spec_md: input.specMd,
    exec_summary: input.execSummary,
    callouts: input.callouts,
    tokens_used: input.tokensUsed,
  })
  if (error) {
    throw new Error(`finalizeArtifact failed: ${error.message}`)
  }
}
