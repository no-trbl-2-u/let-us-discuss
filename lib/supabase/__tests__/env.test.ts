import { describe, expect, it } from 'vitest'
import { readEnv, requireEnv } from '@/lib/supabase/env'

describe('readEnv', () => {
  it('returns the trimmed value when set', () => {
    expect(readEnv('SUPABASE_URL', { SUPABASE_URL: '  https://x.supabase.co  ' })).toBe(
      'https://x.supabase.co',
    )
  })

  it('returns a missing-env reason when unset', () => {
    expect(readEnv('SUPABASE_URL', {})).toEqual({
      ok: false,
      reason: 'missing-env: SUPABASE_URL',
    })
  })

  it('returns a missing-env reason when whitespace-only', () => {
    expect(readEnv('SUPABASE_ANON_KEY', { SUPABASE_ANON_KEY: '   ' })).toEqual({
      ok: false,
      reason: 'missing-env: SUPABASE_ANON_KEY',
    })
  })
})

describe('requireEnv', () => {
  it('returns the value when set', () => {
    expect(requireEnv('SUPABASE_URL', { SUPABASE_URL: 'https://x.co' })).toBe(
      'https://x.co',
    )
  })

  it('throws with the missing-env reason when unset', () => {
    expect(() => requireEnv('SUPABASE_URL', {})).toThrow(
      'missing-env: SUPABASE_URL',
    )
  })
})
