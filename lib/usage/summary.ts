import type { SupabaseServerClient } from '@/lib/supabase/server'

export type UsageWindow = 'today' | '7d' | '30d'

export type WindowSummary = {
  window: UsageWindow
  sessions: number
  tokens: number
  costCents: number
}

const DAY_MS = 86_400_000
const WINDOW_DAYS: Record<UsageWindow, number> = {
  today: 1,
  '7d': 7,
  '30d': 30,
}

function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function windowSinceIso(window: UsageWindow, now: Date): string {
  if (window === 'today') return utcDayStart(now).toISOString()
  return new Date(now.getTime() - WINDOW_DAYS[window] * DAY_MS).toISOString()
}

type SessionsRow = {
  created_at: string
  total_tokens: number | null
  cost_cents: number | null
}

export async function getUserUsageSummary(
  supabase: SupabaseServerClient,
  userId: string,
  now: Date = new Date(),
): Promise<Record<UsageWindow, WindowSummary>> {
  const since30 = windowSinceIso('30d', now)
  const { data, error } = await supabase
    .from('sessions')
    .select('created_at, total_tokens, cost_cents')
    .eq('user_id', userId)
    .gte('created_at', since30)
  if (error) throw new Error(`getUserUsageSummary failed: ${error.message}`)
  const rows = (data ?? []) as SessionsRow[]
  const sinceToday = windowSinceIso('today', now)
  const since7 = windowSinceIso('7d', now)
  const empty = (): WindowSummary => ({
    window: 'today',
    sessions: 0,
    tokens: 0,
    costCents: 0,
  })
  const out: Record<UsageWindow, WindowSummary> = {
    today: { ...empty(), window: 'today' },
    '7d': { ...empty(), window: '7d' },
    '30d': { ...empty(), window: '30d' },
  }
  for (const row of rows) {
    const tokens = row.total_tokens ?? 0
    const cost = row.cost_cents ?? 0
    out['30d'].sessions += 1
    out['30d'].tokens += tokens
    out['30d'].costCents += cost
    if (row.created_at >= since7) {
      out['7d'].sessions += 1
      out['7d'].tokens += tokens
      out['7d'].costCents += cost
    }
    if (row.created_at >= sinceToday) {
      out['today'].sessions += 1
      out['today'].tokens += tokens
      out['today'].costCents += cost
    }
  }
  return out
}
