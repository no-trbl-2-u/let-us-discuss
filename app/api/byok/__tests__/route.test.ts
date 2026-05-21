import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getRouteUser = vi.fn()
const setKey = vi.fn()
const deleteKey = vi.fn()

vi.mock('@/lib/supabase/auth', () => ({
  getRouteUser: (...args: unknown[]) => getRouteUser(...args),
}))

vi.mock('@/lib/byok/repo', async () => {
  const actual = await vi.importActual<typeof import('@/lib/byok/repo')>(
    '@/lib/byok/repo',
  )
  return {
    ...actual,
    setKey: (...args: unknown[]) => setKey(...args),
    deleteKey: (...args: unknown[]) => deleteKey(...args),
  }
})

import { DELETE, POST } from '@/app/api/byok/route'
import { MASTER_KEY_BYTES } from '@/lib/byok/master-key'

function req(body: unknown): { json: () => Promise<unknown> } {
  return { json: async () => body }
}

const SAMPLE_KEY = 'sk-ant-api03-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

describe('POST /api/byok', () => {
  const originalEnv = process.env.BYOK_MASTER_KEY

  beforeEach(() => {
    getRouteUser.mockReset()
    setKey.mockReset()
    deleteKey.mockReset()
    process.env.BYOK_MASTER_KEY = randomBytes(MASTER_KEY_BYTES).toString(
      'base64',
    )
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.BYOK_MASTER_KEY
    } else {
      process.env.BYOK_MASTER_KEY = originalEnv
    }
  })

  it('returns 503 when BYOK_MASTER_KEY is unset', async () => {
    delete process.env.BYOK_MASTER_KEY
    const res = await POST(req({ key: SAMPLE_KEY }) as never)
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ code: 'byok-not-enabled' })
    expect(getRouteUser).not.toHaveBeenCalled()
  })

  it('returns 401 when anonymous', async () => {
    getRouteUser.mockResolvedValue(null)
    const res = await POST(req({ key: SAMPLE_KEY }) as never)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ code: 'unauthorized' })
  })

  it('returns 400 on missing / empty / too-short key', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    })
    for (const body of [{}, { key: '' }, { key: 'short' }]) {
      const res = await POST(req(body) as never)
      expect(res.status).toBe(400)
      const payload = (await res.json()) as { code: string }
      expect(payload.code).toBe('invalid-body')
    }
    expect(setKey).not.toHaveBeenCalled()
  })

  it('returns the masked summary on the happy path', async () => {
    const supabase = { from: vi.fn() }
    getRouteUser.mockResolvedValue({
      user: { id: 'user-1' },
      supabase,
    })
    setKey.mockResolvedValue({
      mask: `${SAMPLE_KEY.slice(0, 6)}…${SAMPLE_KEY.slice(-4)}`,
      keyVersion: 1,
      updatedAt: '2026-05-20T00:00:00Z',
    })
    const res = await POST(req({ key: SAMPLE_KEY }) as never)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      ok: true,
      mask: expect.stringMatching(/^sk-ant.+/),
      keyVersion: 1,
    })
    expect(setKey).toHaveBeenCalledWith(supabase, 'user-1', SAMPLE_KEY)
  })

  it('returns 500 when setKey throws', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    })
    setKey.mockRejectedValue(new Error('boom'))
    const res = await POST(req({ key: SAMPLE_KEY }) as never)
    expect(res.status).toBe(500)
  })

  it('returns 400 on invalid JSON body', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    })
    const reqWithBadJson = {
      json: async () => {
        throw new SyntaxError('Unexpected token')
      },
    }
    const res = await POST(reqWithBadJson as never)
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/byok', () => {
  const originalEnv = process.env.BYOK_MASTER_KEY

  beforeEach(() => {
    getRouteUser.mockReset()
    setKey.mockReset()
    deleteKey.mockReset()
    process.env.BYOK_MASTER_KEY = randomBytes(MASTER_KEY_BYTES).toString(
      'base64',
    )
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.BYOK_MASTER_KEY
    } else {
      process.env.BYOK_MASTER_KEY = originalEnv
    }
  })

  it('returns 503 when BYOK_MASTER_KEY is unset', async () => {
    delete process.env.BYOK_MASTER_KEY
    const res = await DELETE({} as never)
    expect(res.status).toBe(503)
  })

  it('returns 401 when anonymous', async () => {
    getRouteUser.mockResolvedValue(null)
    const res = await DELETE({} as never)
    expect(res.status).toBe(401)
  })

  it('returns {ok:true} on the happy path', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'user-1' },
      supabase: { from: vi.fn() },
    })
    deleteKey.mockResolvedValue(undefined)
    const res = await DELETE({} as never)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(deleteKey).toHaveBeenCalledWith(expect.any(Object), 'user-1')
  })

  it('returns 500 when deleteKey throws', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    })
    deleteKey.mockRejectedValue(new Error('boom'))
    const res = await DELETE({} as never)
    expect(res.status).toBe(500)
  })
})
