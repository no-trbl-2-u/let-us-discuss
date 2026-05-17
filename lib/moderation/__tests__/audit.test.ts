import { writeFlagAudit } from '@/lib/moderation/audit'
import type { SupabaseServerClient } from '@/lib/supabase/server'
import { describe, expect, it, vi } from 'vitest'

function mockSupabase(insertResult: { error: { message: string } | null }) {
  const insert = vi.fn().mockResolvedValue(insertResult)
  const from = vi.fn().mockReturnValue({ insert })
  return {
    client: { from } as unknown as SupabaseServerClient,
    insert,
  }
}

describe('writeFlagAudit', () => {
  it('inserts a row with the expected shape', async () => {
    const { client, insert } = mockSupabase({ error: null })
    await writeFlagAudit(client, {
      sessionId: 'sid-1',
      surface: 'input',
      text: 'flagged text',
      verdict: {
        flagged: true,
        allowed: false,
        source: 'openai',
        categories: { harassment: true },
      },
    })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'sid-1',
        surface: 'input',
        text: 'flagged text',
      }),
    )
  })

  it('swallows supabase errors with a warn', async () => {
    const { client } = mockSupabase({ error: { message: 'rls denied' } })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(
      writeFlagAudit(client, {
        sessionId: 'sid-1',
        surface: 'output',
        text: 'x',
        verdict: { flagged: true, allowed: false, source: 'openai' },
      }),
    ).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('swallows thrown exceptions with a warn', async () => {
    const insert = vi.fn().mockRejectedValue(new Error('boom'))
    const from = vi.fn().mockReturnValue({ insert })
    const client = { from } as unknown as SupabaseServerClient
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(
      writeFlagAudit(client, {
        sessionId: 'sid-1',
        surface: 'output',
        text: 'x',
        verdict: { flagged: true, allowed: false, source: 'openai' },
      }),
    ).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
