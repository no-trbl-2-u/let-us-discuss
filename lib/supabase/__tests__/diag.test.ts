import { describe, expect, it, vi } from 'vitest'
import { runDiagProbe } from '@/lib/supabase/diag'

const fullEnv = {
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
}

describe('runDiagProbe', () => {
  it('returns missing-env when SUPABASE_URL absent', async () => {
    const result = await runDiagProbe({ env: {} })
    expect(result).toEqual({ ok: false, reason: 'missing-env: SUPABASE_URL' })
  })

  it('returns missing-env when only the service-role key absent', async () => {
    const result = await runDiagProbe({
      env: { SUPABASE_URL: 'x', SUPABASE_ANON_KEY: 'y' },
    })
    expect(result).toEqual({
      ok: false,
      reason: 'missing-env: SUPABASE_SERVICE_ROLE_KEY',
    })
  })

  it('returns ok-true when the probe resolves cleanly', async () => {
    const getSession = vi.fn().mockResolvedValue({ error: null })
    const result = await runDiagProbe({
      env: fullEnv,
      makeClient: () => ({ auth: { getSession } }),
    })
    expect(result).toEqual({
      ok: true,
      value: 1,
      env: { url: 'set', anon: 'set', service: 'set' },
    })
    expect(getSession).toHaveBeenCalledOnce()
  })

  it('returns probe-failed when getSession reports an error', async () => {
    const getSession = vi
      .fn()
      .mockResolvedValue({ error: { message: 'invalid jwt' } })
    const result = await runDiagProbe({
      env: fullEnv,
      makeClient: () => ({ auth: { getSession } }),
    })
    expect(result).toEqual({
      ok: false,
      reason: 'probe-failed: invalid jwt',
    })
  })

  it('returns probe-threw when the SDK throws', async () => {
    const getSession = vi.fn().mockRejectedValue(new Error('network'))
    const result = await runDiagProbe({
      env: fullEnv,
      makeClient: () => ({ auth: { getSession } }),
    })
    expect(result).toEqual({ ok: false, reason: 'probe-threw: network' })
  })
})
