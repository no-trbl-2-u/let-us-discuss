import { describe, expect, it, vi } from 'vitest'
import { getUserUsageSummary } from '@/lib/usage/summary'
import type { SupabaseServerClient } from '@/lib/supabase/server'

const NOW = new Date('2026-05-20T12:00:00Z')

function makeClient(
  rows: Array<{ created_at: string; total_tokens: number | null; cost_cents: number | null }>,
  error: { message: string } | null = null,
) {
  const gte = vi.fn().mockResolvedValue({ data: error ? null : rows, error })
  const eq = vi.fn().mockReturnValue({ gte })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  return { client: { from } as unknown as SupabaseServerClient, from, select, eq, gte }
}

describe('getUserUsageSummary', () => {
  it('returns zeros for every window on empty result', async () => {
    const { client } = makeClient([])
    const out = await getUserUsageSummary(client, 'u-1', NOW)
    for (const win of ['today', '7d', '30d'] as const) {
      expect(out[win].sessions).toBe(0)
      expect(out[win].tokens).toBe(0)
      expect(out[win].costCents).toBe(0)
    }
  })

  it('queries sessions filtered by user_id with 30d trailing window', async () => {
    const { client, from, select, eq, gte } = makeClient([])
    await getUserUsageSummary(client, 'u-1', NOW)
    expect(from).toHaveBeenCalledWith('sessions')
    expect(select).toHaveBeenCalledWith('created_at, total_tokens, cost_cents')
    expect(eq).toHaveBeenCalledWith('user_id', 'u-1')
    const sinceArg = (gte.mock.calls[0] ?? [])[1] as string
    expect(sinceArg).toBe(new Date(NOW.getTime() - 30 * 86_400_000).toISOString())
  })

  it('assigns rows to today / 7d / 30d windows correctly', async () => {
    // NOW = 2026-05-20T12:00:00Z. UTC day "today" starts at
    // 2026-05-20T00:00:00Z. A row 2h ago is inside today; a row
    // 3 days ago is inside 7d but not today; a row 8 days ago is
    // inside 30d only.
    const twoHoursAgo = new Date(NOW.getTime() - 2 * 3_600_000).toISOString()
    const threeDaysAgo = new Date(NOW.getTime() - 3 * 86_400_000).toISOString()
    const eightDaysAgo = new Date(NOW.getTime() - 8 * 86_400_000).toISOString()
    const { client } = makeClient([
      { created_at: twoHoursAgo, total_tokens: 1000, cost_cents: 12 },
      { created_at: threeDaysAgo, total_tokens: 300, cost_cents: 4 },
      { created_at: eightDaysAgo, total_tokens: 500, cost_cents: 5 },
    ])
    const out = await getUserUsageSummary(client, 'u-1', NOW)
    expect(out['30d'].sessions).toBe(3)
    expect(out['30d'].tokens).toBe(1800)
    expect(out['30d'].costCents).toBe(21)
    expect(out['7d'].sessions).toBe(2)
    expect(out['7d'].tokens).toBe(1300)
    expect(out['7d'].costCents).toBe(16)
    expect(out['today'].sessions).toBe(1)
    expect(out['today'].tokens).toBe(1000)
    expect(out['today'].costCents).toBe(12)
  })

  it('tolerates null token / cost columns', async () => {
    const recent = new Date(NOW.getTime() - 60_000).toISOString()
    const { client } = makeClient([
      { created_at: recent, total_tokens: null, cost_cents: null },
    ])
    const out = await getUserUsageSummary(client, 'u-1', NOW)
    expect(out['today'].sessions).toBe(1)
    expect(out['today'].tokens).toBe(0)
    expect(out['today'].costCents).toBe(0)
  })

  it('throws when supabase errors', async () => {
    const { client } = makeClient([], { message: 'rls denied' })
    await expect(getUserUsageSummary(client, 'u-1', NOW)).rejects.toThrow(
      /rls denied/,
    )
  })
})
