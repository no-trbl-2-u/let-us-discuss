import type { SupabaseServerClient } from '@/lib/supabase/server'

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
  phase:
    | 'clarify'
    | 'confer'
    | 'exec-summary'
    | 'specialists'
    | 'artifact'
    | 'moderator'
  personaSlug: string | null
  author: 'persona' | 'user' | 'moderator'
  body: string
  replyingTo?: string | null
  tokens: number
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

export async function appendTurn(
  supabase: SupabaseServerClient,
  input: AppendTurnInput,
): Promise<void> {
  const { error } = await supabase.from('turns').insert({
    session_id: input.sessionId,
    idx: input.idx,
    phase: input.phase,
    persona_slug: input.personaSlug,
    author: input.author,
    body: input.body,
    replying_to: input.replyingTo ?? null,
    tokens: input.tokens,
  })
  if (error) {
    throw new Error(`appendTurn failed: ${error.message}`)
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
