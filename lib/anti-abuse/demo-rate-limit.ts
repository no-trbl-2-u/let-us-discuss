import { MAX_DEMO_SESSIONS_PER_IP_PER_DAY } from '@/lib/limits'
import type { SupabaseServerClient } from '@/lib/supabase/server'

// One row per (ip_hash, day_utc, 'demo'). Read-then-write is racey under
// load, but the table is tiny, the failure mode is "one extra demo
// session", and v1 traffic doesn't justify a stored procedure. Returns the
// post-bump count + the limit; caller gates against allowed.

export type DemoRateLimitResult = {
  allowed: boolean
  used: number
  limit: number
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function checkAndBumpDemoLimit(
  supabase: SupabaseServerClient,
  ipHash: string,
): Promise<DemoRateLimitResult> {
  const day = todayUtc()
  const limit = MAX_DEMO_SESSIONS_PER_IP_PER_DAY

  const { data: existing, error: readErr } = await supabase
    .from('ip_rate_limits')
    .select('count')
    .eq('ip_hash', ipHash)
    .eq('day_utc', day)
    .eq('surface', 'demo')
    .maybeSingle()
  if (readErr) {
    throw new Error(`demo rate-limit read failed: ${readErr.message}`)
  }

  if (!existing) {
    const { error: insertErr } = await supabase
      .from('ip_rate_limits')
      .insert({ ip_hash: ipHash, day_utc: day, surface: 'demo', count: 1 })
    if (insertErr) {
      throw new Error(`demo rate-limit insert failed: ${insertErr.message}`)
    }
    return { allowed: 1 <= limit, used: 1, limit }
  }

  const next = existing.count + 1
  const { error: updErr } = await supabase
    .from('ip_rate_limits')
    .update({ count: next })
    .eq('ip_hash', ipHash)
    .eq('day_utc', day)
    .eq('surface', 'demo')
  if (updErr) {
    throw new Error(`demo rate-limit update failed: ${updErr.message}`)
  }
  return { allowed: next <= limit, used: next, limit }
}
