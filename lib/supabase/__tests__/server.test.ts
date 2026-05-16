import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [],
    set: () => undefined,
  }),
}))

describe('createServiceClient', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('throws when SUPABASE_URL is missing', async () => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const { createServiceClient } = await import('@/lib/supabase/server')
    expect(() => createServiceClient()).toThrow('missing-env: SUPABASE_URL')
  })

  it('returns a client when both keys present', async () => {
    process.env.SUPABASE_URL = 'https://x.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service'
    const { createServiceClient } = await import('@/lib/supabase/server')
    const client = createServiceClient()
    expect(client).toBeDefined()
    expect(typeof client.from).toBe('function')
  })
})
