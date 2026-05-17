import { beforeEach, describe, expect, it, vi } from 'vitest'

const getRouteUser = vi.fn()

const maybeSingle = vi.fn()
const eq = vi.fn().mockReturnValue({ maybeSingle })
const select = vi.fn().mockReturnValue({ eq })
const from = vi.fn().mockReturnValue({ select })

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
    from.mockClear()
    select.mockClear()
    eq.mockClear()
    maybeSingle.mockReset()
  })

  it('returns 401 for anonymous callers', async () => {
    getRouteUser.mockResolvedValue(null)
    const { POST } = await import('@/app/api/sessions/[id]/answer/route')
    const res = await POST(
      jsonRequest({ kind: 'clarify', body: 'x' }) as never,
      {
        params: Promise.resolve({ id: validUuid }),
      },
    )
    expect(res.status).toBe(401)
    expect((await res.json()).code).toBe('auth')
  })

  it('returns 400 on non-uuid id', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: { from } as never,
    })
    const { POST } = await import('@/app/api/sessions/[id]/answer/route')
    const res = await POST(
      jsonRequest({ kind: 'clarify', body: 'x' }) as never,
      {
        params: Promise.resolve({ id: 'not-a-uuid' }),
      },
    )
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid-id')
  })

  it('returns 400 when body kind is missing', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: { from } as never,
    })
    const { POST } = await import('@/app/api/sessions/[id]/answer/route')
    const res = await POST(jsonRequest({}) as never, {
      params: Promise.resolve({ id: validUuid }),
    })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('invalid-body')
  })

  it('returns 404 when the session row is not owned by the caller', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: { from } as never,
    })
    maybeSingle.mockResolvedValue({ data: null, error: null })
    const { POST } = await import('@/app/api/sessions/[id]/answer/route')
    const res = await POST(
      jsonRequest({ kind: 'clarify', body: 'answer' }) as never,
      { params: Promise.resolve({ id: validUuid }) },
    )
    expect(res.status).toBe(404)
    expect((await res.json()).code).toBe('not-found')
  })

  it('returns 409 session-resume-lost when no orchestrator is waiting', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: { from } as never,
    })
    maybeSingle.mockResolvedValue({ data: { id: validUuid }, error: null })
    const { _resetForTests } = await import('@/lib/sessions/resume-map')
    _resetForTests()
    const { POST } = await import('@/app/api/sessions/[id]/answer/route')
    const res = await POST(
      jsonRequest({ kind: 'clarify', body: 'answer' }) as never,
      { params: Promise.resolve({ id: validUuid }) },
    )
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('session-resume-lost')
  })

  it('delivers the answer and returns 200 when an orchestrator is waiting', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: { from } as never,
    })
    maybeSingle.mockResolvedValue({ data: { id: validUuid }, error: null })
    const { waitForAnswer, _resetForTests } = await import(
      '@/lib/sessions/resume-map'
    )
    _resetForTests()
    const waiter = waitForAnswer(validUuid)
    const { POST } = await import('@/app/api/sessions/[id]/answer/route')
    const res = await POST(
      jsonRequest({ kind: 'clarify', body: 'real answer' }) as never,
      { params: Promise.resolve({ id: validUuid }) },
    )
    expect(res.status).toBe(200)
    const delivered = await waiter
    expect(delivered).toEqual({ kind: 'clarify', body: 'real answer' })
  })
})
