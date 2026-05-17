import { beforeEach, describe, expect, it, vi } from 'vitest'

const getRouteUser = vi.fn()

vi.mock('@/lib/supabase/auth', () => ({
  getRouteUser: (...args: unknown[]) => getRouteUser(...args),
}))

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/sessions/x/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const validUuid = '11111111-2222-4333-8444-555555555555'

describe('POST /api/sessions/[id]/answer', () => {
  beforeEach(() => {
    getRouteUser.mockReset()
  })

  it('returns 401 for anonymous callers', async () => {
    getRouteUser.mockResolvedValue(null)
    const { POST } = await import('@/app/api/sessions/[id]/answer/route')
    const res = await POST(jsonRequest({ body: 'x' }) as never, {
      params: Promise.resolve({ id: validUuid }),
    })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.code).toBe('auth')
  })

  it('returns 400 on non-uuid id', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: {} as never,
    })
    const { POST } = await import('@/app/api/sessions/[id]/answer/route')
    const res = await POST(jsonRequest({ body: 'x' }) as never, {
      params: Promise.resolve({ id: 'not-a-uuid' }),
    })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid-id')
  })

  it('returns 400 when body is missing', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: {} as never,
    })
    const { POST } = await import('@/app/api/sessions/[id]/answer/route')
    const res = await POST(jsonRequest({}) as never, {
      params: Promise.resolve({ id: validUuid }),
    })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid-body')
  })

  it('returns 501 not-implemented on authed valid request', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: {} as never,
    })
    const { POST } = await import('@/app/api/sessions/[id]/answer/route')
    const res = await POST(jsonRequest({ body: 'an answer' }) as never, {
      params: Promise.resolve({ id: validUuid }),
    })
    expect(res.status).toBe(501)
    const body = await res.json()
    expect(body.code).toBe('not-implemented')
    expect(body.message).toMatch(/phase 7b/)
  })
})
