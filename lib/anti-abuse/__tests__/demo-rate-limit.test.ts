import { checkAndBumpDemoLimit } from '@/lib/anti-abuse/demo-rate-limit'
import { MAX_DEMO_SESSIONS_PER_IP_PER_DAY } from '@/lib/limits'
import type { SupabaseServerClient } from '@/lib/supabase/server'
import { describe, expect, it, vi } from 'vitest'

type RowSpy = { count: number } | null

function mockSupabase(
  row: RowSpy,
  errs: Partial<{ insert: string; update: string; read: string }> = {},
) {
  const maybeSingle = vi
    .fn()
    .mockResolvedValue(
      errs.read
        ? { data: null, error: { message: errs.read } }
        : { data: row, error: null },
    )
  const readEq3 = vi.fn().mockReturnValue({ maybeSingle })
  const readEq2 = vi.fn().mockReturnValue({ eq: readEq3 })
  const readEq1 = vi.fn().mockReturnValue({ eq: readEq2 })
  const readSelect = vi.fn().mockReturnValue({ eq: readEq1 })

  const updEq3 = vi
    .fn()
    .mockResolvedValue(
      errs.update ? { error: { message: errs.update } } : { error: null },
    )
  const updEq2 = vi.fn().mockReturnValue({ eq: updEq3 })
  const updEq1 = vi.fn().mockReturnValue({ eq: updEq2 })
  const update = vi.fn().mockReturnValue({ eq: updEq1 })

  const insert = vi
    .fn()
    .mockResolvedValue(
      errs.insert ? { error: { message: errs.insert } } : { error: null },
    )

  const from = vi.fn().mockReturnValue({
    select: readSelect,
    insert,
    update,
  })
  return {
    client: { from } as unknown as SupabaseServerClient,
    insert,
    update,
  }
}

describe('checkAndBumpDemoLimit', () => {
  it('returns used=1, allowed=true on the first call (no existing row)', async () => {
    const { client, insert, update } = mockSupabase(null)
    const result = await checkAndBumpDemoLimit(client, 'hash-a')
    expect(result.used).toBe(1)
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(MAX_DEMO_SESSIONS_PER_IP_PER_DAY)
    expect(insert).toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })

  it('bumps existing rows and returns allowed=true when still under limit', async () => {
    const { client, update } = mockSupabase({ count: 1 })
    const result = await checkAndBumpDemoLimit(client, 'hash-b')
    expect(result.used).toBe(2)
    expect(result.allowed).toBe(true)
    expect(update).toHaveBeenCalled()
  })

  it('returns allowed=false when the new count exceeds the limit', async () => {
    const { client } = mockSupabase({ count: MAX_DEMO_SESSIONS_PER_IP_PER_DAY })
    const result = await checkAndBumpDemoLimit(client, 'hash-c')
    expect(result.used).toBe(MAX_DEMO_SESSIONS_PER_IP_PER_DAY + 1)
    expect(result.allowed).toBe(false)
  })

  it('throws when Supabase read fails', async () => {
    const { client } = mockSupabase(null, { read: 'boom-read' })
    await expect(checkAndBumpDemoLimit(client, 'x')).rejects.toThrow(
      /boom-read/,
    )
  })

  it('throws when Supabase insert fails', async () => {
    const { client } = mockSupabase(null, { insert: 'boom-insert' })
    await expect(checkAndBumpDemoLimit(client, 'x')).rejects.toThrow(
      /boom-insert/,
    )
  })

  it('throws when Supabase update fails', async () => {
    const { client } = mockSupabase({ count: 1 }, { update: 'boom-update' })
    await expect(checkAndBumpDemoLimit(client, 'x')).rejects.toThrow(
      /boom-update/,
    )
  })
})
