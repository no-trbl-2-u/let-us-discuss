import type { SupabaseServerClient } from '@/lib/supabase/server'
import type { Retro } from './types'

export async function loadRecentRetros(
  supabase: SupabaseServerClient,
  userId: string,
  limit: number,
): Promise<Retro[]> {
  const { data, error } = await supabase
    .from('retros')
    .select(
      'id, session_id, pitch_excerpt, entry_md, for_next_time, created_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    throw new Error(`loadRecentRetros failed: ${error.message}`)
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    pitchExcerpt: row.pitch_excerpt,
    entryMd: row.entry_md,
    forNextTime: row.for_next_time ?? [],
    createdAt: row.created_at,
  }))
}

export type AppendRetroInput = {
  sessionId: string
  userId: string
  pitchExcerpt: string
  entryMd: string
  forNextTime: string[]
}

export async function appendRetro(
  supabase: SupabaseServerClient,
  input: AppendRetroInput,
): Promise<void> {
  const { error } = await supabase.from('retros').insert({
    session_id: input.sessionId,
    user_id: input.userId,
    pitch_excerpt: input.pitchExcerpt,
    entry_md: input.entryMd,
    for_next_time: input.forNextTime,
  })
  if (error) {
    throw new Error(`appendRetro failed: ${error.message}`)
  }
}

/**
 * Parses the "For next time" section of the secretary's Mode 2
 * compiled markdown. The persona file locks the output shape:
 *
 *   ### For next time
 *   - <one carry-forward, 1 line>
 *   - <one carry-forward, 1 line>
 *   - <one carry-forward, 1 line>
 *
 * Returns the bullet bodies (with the leading "- " stripped). Empty
 * array when the section is absent, when the body is the "(none)"
 * sentinel, or when the parser hits the next H3.
 *
 * Defensive: caps at 6 bullets so a misbehaving persona output can't
 * produce a runaway carry-forward list.
 */
export function parseForNextTimeBullets(entryMd: string): string[] {
  if (!entryMd) return []
  const lines = entryMd.split('\n')
  let inSection = false
  const out: string[] = []
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (/^#{2,4}\s*for next time\s*$/i.test(line)) {
      inSection = true
      continue
    }
    if (inSection) {
      if (/^#{2,4}\s+/.test(line)) break
      if (!line) continue
      if (/^\(?none\)?$/i.test(line)) continue
      const m = line.match(/^[-*•]\s+(.+)$/)
      if (m) {
        const body = m[1]?.trim()
        if (body && body.length > 0) {
          out.push(body)
          if (out.length >= 6) break
        }
      }
    }
  }
  return out
}
