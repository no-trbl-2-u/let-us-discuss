import type { SupabaseServerClient } from '@/lib/supabase/server'

// Rolling 24h count of the user's sessions. Used by /api/sessions to gate
// new sessions against MAX_SESSIONS_PER_DAY. RLS does the heavy lifting:
// the authed client only sees the caller's rows.

export async function countSessionsLast24h(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count, error } = await supabase
    .from('sessions')
    .select('id', { head: true, count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', since)
  if (error) {
    throw new Error(`countSessionsLast24h failed: ${error.message}`)
  }
  return typeof count === 'number' ? count : 0
}
