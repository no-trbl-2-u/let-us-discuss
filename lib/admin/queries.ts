import type { SupabaseServerClient } from '@/lib/supabase/server'

export const ADMIN_RECENT_DAYS = 7
export const ADMIN_TOP_COST_LIMIT = 10

export type DayBucket = { day: string; sessions: number }
export type TokenBucket = { day: string; tokens: number; costCents: number }
export type TopCostRow = {
  sessionId: string
  userIdPrefix: string
  costCents: number
  totalTokens: number
  createdAt: string
}
export type RateSummary = {
  sessionsThisWeek: number
  flagsThisWeek: number
  abortedThisWeek: number
  flagRate: number
  errorRate: number
}

function utcDayKey(iso: string): string {
  return iso.slice(0, 10)
}

function lastNDayKeys(days: number, now = new Date()): string[] {
  const keys: string[] = []
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  for (let i = days - 1; i >= 0; i -= 1) {
    const t = new Date(base - i * 86_400_000)
    keys.push(t.toISOString().slice(0, 10))
  }
  return keys
}

function trailingWindowStartIso(days: number, now = new Date()): string {
  const t = new Date(now.getTime() - days * 86_400_000)
  return t.toISOString()
}

export async function loadSessionsPerDay(
  supabase: SupabaseServerClient,
  days = ADMIN_RECENT_DAYS,
  now: Date = new Date(),
): Promise<DayBucket[]> {
  const since = trailingWindowStartIso(days, now)
  const { data, error } = await supabase
    .from('sessions')
    .select('created_at')
    .gte('created_at', since)
  if (error) throw new Error(`loadSessionsPerDay failed: ${error.message}`)
  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const key = utcDayKey((row as { created_at: string }).created_at)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return lastNDayKeys(days, now).map((day) => ({
    day,
    sessions: counts.get(day) ?? 0,
  }))
}

export async function loadTokensPerDay(
  supabase: SupabaseServerClient,
  days = ADMIN_RECENT_DAYS,
  now: Date = new Date(),
): Promise<TokenBucket[]> {
  const since = trailingWindowStartIso(days, now)
  const { data, error } = await supabase
    .from('sessions')
    .select('created_at, total_tokens, cost_cents')
    .gte('created_at', since)
  if (error) throw new Error(`loadTokensPerDay failed: ${error.message}`)
  const tokens = new Map<string, number>()
  const cents = new Map<string, number>()
  for (const row of data ?? []) {
    const r = row as { created_at: string; total_tokens: number | null; cost_cents: number | null }
    const key = utcDayKey(r.created_at)
    tokens.set(key, (tokens.get(key) ?? 0) + (r.total_tokens ?? 0))
    cents.set(key, (cents.get(key) ?? 0) + (r.cost_cents ?? 0))
  }
  return lastNDayKeys(days, now).map((day) => ({
    day,
    tokens: tokens.get(day) ?? 0,
    costCents: cents.get(day) ?? 0,
  }))
}

export async function loadTopCostSessions(
  supabase: SupabaseServerClient,
  limit = ADMIN_TOP_COST_LIMIT,
): Promise<TopCostRow[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, user_id, total_tokens, cost_cents, created_at')
    .order('cost_cents', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`loadTopCostSessions failed: ${error.message}`)
  return (data ?? []).map((row) => {
    const r = row as {
      id: string
      user_id: string | null
      total_tokens: number | null
      cost_cents: number | null
      created_at: string
    }
    return {
      sessionId: r.id,
      userIdPrefix: (r.user_id ?? '').slice(0, 8),
      costCents: r.cost_cents ?? 0,
      totalTokens: r.total_tokens ?? 0,
      createdAt: r.created_at,
    }
  })
}

export async function loadFlagAndErrorRates(
  supabase: SupabaseServerClient,
  now: Date = new Date(),
): Promise<RateSummary> {
  const since = trailingWindowStartIso(ADMIN_RECENT_DAYS, now)
  const sessionsRes = await supabase
    .from('sessions')
    .select('id, status', { count: 'exact', head: false })
    .gte('created_at', since)
  if (sessionsRes.error) {
    throw new Error(`loadFlagAndErrorRates(sessions) failed: ${sessionsRes.error.message}`)
  }
  const sessionsRows = (sessionsRes.data ?? []) as Array<{ id: string; status: string }>
  const sessionsThisWeek = sessionsRows.length
  const abortedThisWeek = sessionsRows.filter((r) => r.status === 'aborted').length

  const flagsRes = await supabase
    .from('flag_audit')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)
  if (flagsRes.error) {
    throw new Error(`loadFlagAndErrorRates(flags) failed: ${flagsRes.error.message}`)
  }
  const flagsThisWeek = flagsRes.count ?? 0

  const flagRate =
    sessionsThisWeek === 0 ? 0 : Math.round((flagsThisWeek / sessionsThisWeek) * 1000) / 10
  const errorRate =
    sessionsThisWeek === 0 ? 0 : Math.round((abortedThisWeek / sessionsThisWeek) * 1000) / 10

  return {
    sessionsThisWeek,
    flagsThisWeek,
    abortedThisWeek,
    flagRate,
    errorRate,
  }
}
