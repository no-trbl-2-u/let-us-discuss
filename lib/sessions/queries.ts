import type { SessionTurn } from '@/components/boardroom/use-session-state'
import type { SupabaseServerClient } from '@/lib/supabase/server'
import type { SessionStatus } from './repo'

// Reader helpers for the /app/sessions surface (phase 11). RLS pins each
// row to the owning user; these helpers don't re-check ownership — they
// trust the policy + surface RLS-hidden rows as `null`.

export type SessionListItem = {
  id: string
  status: SessionStatus
  totalTokens: number
  createdAt: string
  pitchExcerpt: string
  templateSlug: string
  personaSlugs: string[]
}

export type LoadedSession = {
  id: string
  status: SessionStatus
  model: string
  totalTokens: number
  promptTokens: number
  completionTokens: number
  costCents: number
  createdAt: string
  updatedAt: string
  pitch: string
  templateSlug: string
  personaSlugs: string[]
  artifact: {
    specMd: string
    execSummary: string
    callouts: string
    tokensUsed: number
    finishedAt: string
  } | null
  turnCount: number
}

export type LoadedTranscript = {
  id: string
  status: SessionStatus
  model: string
  totalTokens: number
  promptTokens: number
  completionTokens: number
  costCents: number
  createdAt: string
  pitch: string
  personaSlugs: string[]
  turns: SessionTurn[]
}

const PITCH_EXCERPT_CHARS = 80

function excerpt(body: string, max = PITCH_EXCERPT_CHARS): string {
  const trimmed = body.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max).trimEnd()}…`
}

export async function listSessions(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<SessionListItem[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select(
      'id, status, total_tokens, created_at, pitch, template_slug, persona_slugs',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    throw new Error(`listSessions failed: ${error.message}`)
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status as SessionStatus,
    totalTokens: row.total_tokens,
    createdAt: row.created_at,
    pitchExcerpt: excerpt(row.pitch),
    templateSlug: row.template_slug,
    personaSlugs: row.persona_slugs,
  }))
}

export async function loadSession(
  supabase: SupabaseServerClient,
  userId: string,
  id: string,
): Promise<LoadedSession | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select(
      'id, status, model, total_tokens, prompt_tokens, completion_tokens, cost_cents, created_at, updated_at, pitch, template_slug, persona_slugs',
    )
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle()
  if (error) {
    throw new Error(`loadSession failed: ${error.message}`)
  }
  if (!data) return null

  const { data: artifactRow, error: artErr } = await supabase
    .from('artifacts')
    .select('spec_md, exec_summary, callouts, tokens_used, finished_at')
    .eq('session_id', id)
    .maybeSingle()
  if (artErr) {
    throw new Error(`loadSession.artifact failed: ${artErr.message}`)
  }

  const { count, error: turnsErr } = await supabase
    .from('turns')
    .select('id', { head: true, count: 'exact' })
    .eq('session_id', id)
  if (turnsErr) {
    throw new Error(`loadSession.turnCount failed: ${turnsErr.message}`)
  }

  return {
    id: data.id,
    status: data.status as SessionStatus,
    model: data.model,
    totalTokens: data.total_tokens,
    promptTokens: data.prompt_tokens ?? 0,
    completionTokens: data.completion_tokens ?? 0,
    costCents: data.cost_cents ?? 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    pitch: data.pitch,
    templateSlug: data.template_slug,
    personaSlugs: data.persona_slugs,
    artifact: artifactRow
      ? {
          specMd: artifactRow.spec_md,
          execSummary: artifactRow.exec_summary,
          callouts: artifactRow.callouts,
          tokensUsed: artifactRow.tokens_used,
          finishedAt: artifactRow.finished_at,
        }
      : null,
    turnCount: typeof count === 'number' ? count : 0,
  }
}

export async function loadTranscript(
  supabase: SupabaseServerClient,
  userId: string,
  id: string,
): Promise<LoadedTranscript | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select(
      'id, status, model, total_tokens, prompt_tokens, completion_tokens, cost_cents, created_at, pitch, persona_slugs',
    )
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle()
  if (error) {
    throw new Error(`loadTranscript failed: ${error.message}`)
  }
  if (!data) return null

  const { data: turnRows, error: turnsErr } = await supabase
    .from('turns')
    .select('id, phase, persona_slug, author, body, replying_to, tokens')
    .eq('session_id', id)
    .order('idx', { ascending: true })
  if (turnsErr) {
    throw new Error(`loadTranscript.turns failed: ${turnsErr.message}`)
  }

  const turns: SessionTurn[] = (turnRows ?? []).map((row) => ({
    id: row.id,
    phase: row.phase as SessionTurn['phase'],
    personaSlug: row.persona_slug,
    author: row.author as SessionTurn['author'],
    replyingTo: row.replying_to,
    body: row.body,
    tokens: row.tokens,
    closed: true,
  }))

  return {
    id: data.id,
    status: data.status as SessionStatus,
    model: data.model,
    totalTokens: data.total_tokens,
    promptTokens: data.prompt_tokens ?? 0,
    completionTokens: data.completion_tokens ?? 0,
    costCents: data.cost_cents ?? 0,
    createdAt: data.created_at,
    pitch: data.pitch,
    personaSlugs: data.persona_slugs,
    turns,
  }
}
