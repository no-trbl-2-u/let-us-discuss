import { describe, expect, it, vi } from 'vitest'
import {
  ADMIN_RECENT_DAYS,
  ADMIN_TOP_COST_LIMIT,
  loadFlagAndErrorRates,
  loadSessionsPerDay,
  loadTokensPerDay,
  loadTopCostSessions,
} from '@/lib/admin/queries'
import type { SupabaseServerClient } from '@/lib/supabase/server'

const NOW = new Date('2026-05-20T12:00:00Z')
const TODAY = '2026-05-20'
const YESTERDAY = '2026-05-19'

describe('loadSessionsPerDay', () => {
  it('returns last N days oldest-first with 0-backfill for missing days', async () => {
    const gte = vi.fn().mockResolvedValue({
      data: [
        { created_at: `${TODAY}T01:00:00Z` },
        { created_at: `${TODAY}T05:00:00Z` },
        { created_at: `${YESTERDAY}T20:00:00Z` },
      ],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ gte })
    const from = vi.fn().mockReturnValue({ select })
    const client = { from } as unknown as SupabaseServerClient

    const result = await loadSessionsPerDay(client, ADMIN_RECENT_DAYS, NOW)
    expect(from).toHaveBeenCalledWith('sessions')
    expect(select).toHaveBeenCalledWith('created_at')
    expect(result).toHaveLength(ADMIN_RECENT_DAYS)
    const first = result[0]?.day ?? ''
    const last = result[result.length - 1]?.day ?? ''
    expect(first < last).toBe(true)
    const todayBucket = result.find((r) => r.day === TODAY)
    expect(todayBucket?.sessions).toBe(2)
    const yesterdayBucket = result.find((r) => r.day === YESTERDAY)
    expect(yesterdayBucket?.sessions).toBe(1)
    const missingBucket = result.find((r) => r.day === '2026-05-17')
    expect(missingBucket?.sessions).toBe(0)
  })

  it('throws when supabase errors', async () => {
    const gte = vi.fn().mockResolvedValue({ data: null, error: { message: 'rls denied' } })
    const select = vi.fn().mockReturnValue({ gte })
    const from = vi.fn().mockReturnValue({ select })
    const client = { from } as unknown as SupabaseServerClient
    await expect(loadSessionsPerDay(client, 7, NOW)).rejects.toThrow(/rls denied/)
  })
})

describe('loadTokensPerDay', () => {
  it('sums tokens + cost per day, backfilling missing days to 0', async () => {
    const gte = vi.fn().mockResolvedValue({
      data: [
        { created_at: `${TODAY}T01:00:00Z`, total_tokens: 100, cost_cents: 5 },
        { created_at: `${TODAY}T05:00:00Z`, total_tokens: 200, cost_cents: 7 },
        { created_at: `${YESTERDAY}T20:00:00Z`, total_tokens: 50, cost_cents: 2 },
      ],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ gte })
    const from = vi.fn().mockReturnValue({ select })
    const client = { from } as unknown as SupabaseServerClient

    const result = await loadTokensPerDay(client, 7, NOW)
    expect(select).toHaveBeenCalledWith('created_at, total_tokens, cost_cents')
    const today = result.find((r) => r.day === TODAY)
    expect(today?.tokens).toBe(300)
    expect(today?.costCents).toBe(12)
    const yesterday = result.find((r) => r.day === YESTERDAY)
    expect(yesterday?.tokens).toBe(50)
    expect(yesterday?.costCents).toBe(2)
    const empty = result.find((r) => r.day === '2026-05-18')
    expect(empty?.tokens).toBe(0)
    expect(empty?.costCents).toBe(0)
  })

  it('tolerates null token/cost columns', async () => {
    const gte = vi.fn().mockResolvedValue({
      data: [
        { created_at: `${TODAY}T01:00:00Z`, total_tokens: null, cost_cents: null },
      ],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ gte })
    const from = vi.fn().mockReturnValue({ select })
    const client = { from } as unknown as SupabaseServerClient
    const result = await loadTokensPerDay(client, 7, NOW)
    const today = result.find((r) => r.day === TODAY)
    expect(today?.tokens).toBe(0)
    expect(today?.costCents).toBe(0)
  })
})

describe('loadTopCostSessions', () => {
  it('orders by cost_cents desc, limits, and shortens user_id to 8 chars', async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'session-aaa',
          user_id: '01234567-89ab-cdef-0123-456789abcdef',
          total_tokens: 1000,
          cost_cents: 99,
          created_at: '2026-05-20T01:00:00Z',
        },
        {
          id: 'session-bbb',
          user_id: 'fedcba98-7654-3210-fedc-ba9876543210',
          total_tokens: 500,
          cost_cents: 42,
          created_at: '2026-05-19T01:00:00Z',
        },
      ],
      error: null,
    })
    const order = vi.fn().mockReturnValue({ limit })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    const client = { from } as unknown as SupabaseServerClient

    const result = await loadTopCostSessions(client, 5)
    expect(from).toHaveBeenCalledWith('sessions')
    expect(order).toHaveBeenCalledWith('cost_cents', { ascending: false })
    expect(limit).toHaveBeenCalledWith(5)
    expect(result).toHaveLength(2)
    expect(result[0]?.sessionId).toBe('session-aaa')
    expect(result[0]?.userIdPrefix).toBe('01234567')
    expect(result[1]?.userIdPrefix).toBe('fedcba98')
  })

  it('defaults to ADMIN_TOP_COST_LIMIT', async () => {
    const limit = vi.fn().mockResolvedValue({ data: [], error: null })
    const order = vi.fn().mockReturnValue({ limit })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    const client = { from } as unknown as SupabaseServerClient
    await loadTopCostSessions(client)
    expect(limit).toHaveBeenCalledWith(ADMIN_TOP_COST_LIMIT)
  })

  it('tolerates null user_id', async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 's1',
          user_id: null,
          total_tokens: null,
          cost_cents: null,
          created_at: '2026-05-20T01:00:00Z',
        },
      ],
      error: null,
    })
    const order = vi.fn().mockReturnValue({ limit })
    const select = vi.fn().mockReturnValue({ order })
    const from = vi.fn().mockReturnValue({ select })
    const client = { from } as unknown as SupabaseServerClient
    const result = await loadTopCostSessions(client, 1)
    expect(result[0]?.userIdPrefix).toBe('')
    expect(result[0]?.totalTokens).toBe(0)
    expect(result[0]?.costCents).toBe(0)
  })
})

describe('loadFlagAndErrorRates', () => {
  function makeClient(sessions: Array<{ id: string; status: string }>, flagCount: number) {
    const sessionsGte = vi.fn().mockResolvedValue({
      data: sessions,
      error: null,
      count: sessions.length,
    })
    const sessionsSelect = vi.fn().mockReturnValue({ gte: sessionsGte })
    const flagsGte = vi.fn().mockResolvedValue({
      data: null,
      error: null,
      count: flagCount,
    })
    const flagsSelect = vi.fn().mockReturnValue({ gte: flagsGte })
    const from = vi.fn((table: string) => {
      if (table === 'sessions') return { select: sessionsSelect }
      if (table === 'flag_audit') return { select: flagsSelect }
      throw new Error(`unexpected table: ${table}`)
    })
    return { from } as unknown as SupabaseServerClient
  }

  it('computes flag + error rates rounded to one decimal', async () => {
    const client = makeClient(
      [
        { id: 's1', status: 'done' },
        { id: 's2', status: 'done' },
        { id: 's3', status: 'aborted' },
        { id: 's4', status: 'done' },
      ],
      1,
    )
    const summary = await loadFlagAndErrorRates(client, NOW)
    expect(summary.sessionsThisWeek).toBe(4)
    expect(summary.flagsThisWeek).toBe(1)
    expect(summary.abortedThisWeek).toBe(1)
    expect(summary.flagRate).toBe(25)
    expect(summary.errorRate).toBe(25)
  })

  it('returns zero rates with zero sessions (no division by zero)', async () => {
    const client = makeClient([], 0)
    const summary = await loadFlagAndErrorRates(client, NOW)
    expect(summary.sessionsThisWeek).toBe(0)
    expect(summary.flagRate).toBe(0)
    expect(summary.errorRate).toBe(0)
  })
})
