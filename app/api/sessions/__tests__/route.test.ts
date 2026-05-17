import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getRouteUser = vi.fn()
const createSession = vi.fn()

vi.mock('@/lib/supabase/auth', () => ({
  getRouteUser: (...args: unknown[]) => getRouteUser(...args),
}))

vi.mock('@/lib/sessions/repo', async () => {
  const actual = await vi.importActual<typeof import('@/lib/sessions/repo')>(
    '@/lib/sessions/repo',
  )
  return {
    ...actual,
    createSession: (...args: unknown[]) => createSession(...args),
  }
})

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

async function readSseBody(res: Response): Promise<string> {
  if (!res.body) throw new Error('expected response body')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let out = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    out += decoder.decode(value)
  }
  return out
}

describe('POST /api/sessions', () => {
  beforeEach(() => {
    getRouteUser.mockReset()
    createSession.mockReset()
  })
  afterEach(() => {
    vi.resetModules()
  })

  it('returns 401 for anonymous callers', async () => {
    getRouteUser.mockResolvedValue(null)
    const { POST } = await import('@/app/api/sessions/route')
    const res = await POST(
      jsonRequest({
        pitch: 'hi',
        personaSlugs: ['a', 'b'],
        templateSlug: 'pitch-to-spec',
      }) as never,
    )
    expect(res.status).toBe(401)
  })

  it('returns 400 on invalid body', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: {} as never,
    })
    const { POST } = await import('@/app/api/sessions/route')
    const res = await POST(
      jsonRequest({ pitch: '', personaSlugs: [] }) as never,
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when body is not JSON', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: {} as never,
    })
    const { POST } = await import('@/app/api/sessions/route')
    const res = await POST(jsonRequest('{not json') as never)
    expect(res.status).toBe(400)
  })

  it('emits session.started then session.error not-implemented on happy path', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: {} as never,
    })
    createSession.mockResolvedValue({ id: 'sid-99' })
    const { POST } = await import('@/app/api/sessions/route')
    const res = await POST(
      jsonRequest({
        pitch: 'one short pitch',
        personaSlugs: ['product-lead', 'skeptical-engineer'],
        templateSlug: 'pitch-to-spec',
      }) as never,
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/text\/event-stream/)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    const body = await readSseBody(res)
    expect(body).toContain('event: session.started')
    expect(body).toContain('"sessionId":"sid-99"')
    expect(body).toContain('event: session.error')
    expect(body).toContain('"code":"not-implemented"')
    // Exactly two records.
    expect(body.split('\n\n').filter((s) => s.trim()).length).toBe(2)
  })

  it('returns 500 if createSession throws', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: {} as never,
    })
    createSession.mockRejectedValue(new Error('db down'))
    const { POST } = await import('@/app/api/sessions/route')
    const res = await POST(
      jsonRequest({
        pitch: 'hi there',
        personaSlugs: ['a', 'b'],
        templateSlug: 'pitch-to-spec',
      }) as never,
    )
    expect(res.status).toBe(500)
  })
})
