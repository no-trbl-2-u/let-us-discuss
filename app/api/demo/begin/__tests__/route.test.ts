import { beforeEach, describe, expect, it, vi } from 'vitest'

const checkAndBumpDemoLimit = vi.fn()
const createServiceClient = vi.fn(() => ({}))

vi.mock('@/lib/anti-abuse/demo-rate-limit', () => ({
  checkAndBumpDemoLimit: (...args: unknown[]) => checkAndBumpDemoLimit(...args),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient,
}))

function request(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/demo/begin', {
    method: 'POST',
    headers,
  })
}

describe('POST /api/demo/begin', () => {
  const originalEnv = process.env
  beforeEach(() => {
    process.env = { ...originalEnv, IP_HASH_SALT: 'pepper' }
    checkAndBumpDemoLimit.mockReset()
  })

  it('returns 200 with source=unresolved when no IP header is present', async () => {
    const { POST } = await import('@/app/api/demo/begin/route')
    const res = await POST(request() as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.source).toBe('unresolved')
    expect(checkAndBumpDemoLimit).not.toHaveBeenCalled()
  })

  it('returns 200 on allowed', async () => {
    checkAndBumpDemoLimit.mockResolvedValue({
      allowed: true,
      used: 1,
      limit: 3,
    })
    const { POST } = await import('@/app/api/demo/begin/route')
    const res = await POST(
      request({ 'x-forwarded-for': '203.0.113.1' }) as never,
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.used).toBe(1)
    expect(body.limit).toBe(3)
  })

  it('returns 429 with code=demo-quota when over limit', async () => {
    checkAndBumpDemoLimit.mockResolvedValue({
      allowed: false,
      used: 4,
      limit: 3,
    })
    const { POST } = await import('@/app/api/demo/begin/route')
    const res = await POST(
      request({ 'x-forwarded-for': '203.0.113.1' }) as never,
    )
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.code).toBe('demo-quota')
    expect(body.used).toBe(4)
  })

  it('fails open (200) on DB error', async () => {
    checkAndBumpDemoLimit.mockRejectedValue(new Error('db down'))
    const { POST } = await import('@/app/api/demo/begin/route')
    const res = await POST(
      request({ 'x-forwarded-for': '203.0.113.1' }) as never,
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.source).toBe('error')
  })
})
