import { countSessionsLast24h } from '@/lib/anti-abuse/quota'
import type { SupabaseServerClient } from '@/lib/supabase/server'
import { describe, expect, it, vi } from 'vitest'

function mockSupabase(countResult: {
  count: number | null
  error: { message: string } | null
}) {
  const gte = vi.fn().mockResolvedValue(countResult)
  const eq = vi.fn().mockReturnValue({ gte })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  return {
    client: { from } as unknown as SupabaseServerClient,
    select,
    eq,
    gte,
    from,
  }
}

describe('countSessionsLast24h', () => {
  it('returns the count returned by Supabase', async () => {
    const { client } = mockSupabase({ count: 4, error: null })
    expect(await countSessionsLast24h(client, 'u-1')).toBe(4)
  })

  it('returns 0 when Supabase returns null count', async () => {
    const { client } = mockSupabase({ count: null, error: null })
    expect(await countSessionsLast24h(client, 'u-1')).toBe(0)
  })

  it('throws when Supabase reports an error', async () => {
    const { client } = mockSupabase({ count: null, error: { message: 'rls' } })
    await expect(countSessionsLast24h(client, 'u-1')).rejects.toThrow(/rls/)
  })

  it('calls .from("sessions") and filters by user_id + created_at', async () => {
    const { client, from, eq, gte } = mockSupabase({ count: 0, error: null })
    await countSessionsLast24h(client, 'u-42')
    expect(from).toHaveBeenCalledWith('sessions')
    expect(eq).toHaveBeenCalledWith('user_id', 'u-42')
    expect(gte).toHaveBeenCalledWith('created_at', expect.any(String))
  })
})
