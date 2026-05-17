import { _resetWarnedForTests, moderate } from '@/lib/moderation/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('moderate', () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env = { ...originalEnv }
    _resetWarnedForTests()
    global.fetch = vi.fn()
  })
  afterEach(() => {
    process.env = originalEnv
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('returns allowed + source=unconfigured when OPENAI_API_KEY is unset', async () => {
    // biome-ignore lint/performance/noDelete: assignment to undefined leaves the string in process.env
    delete process.env.OPENAI_API_KEY
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const v = await moderate('hello')
    expect(v.flagged).toBe(false)
    expect(v.allowed).toBe(true)
    expect(v.source).toBe('unconfigured')
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('warns only once per process when API key stays unset', async () => {
    // biome-ignore lint/performance/noDelete: assignment to undefined leaves the string in process.env
    delete process.env.OPENAI_API_KEY
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await moderate('a')
    await moderate('b')
    await moderate('c')
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('returns flagged when OpenAI returns flagged:true', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [{ flagged: true, categories: { harassment: true } }],
        }),
        { status: 200 },
      ),
    )
    const v = await moderate('flagged text', { surface: 'input' })
    expect(v.flagged).toBe(true)
    expect(v.allowed).toBe(false)
    expect(v.source).toBe('openai')
    expect(v.categories).toEqual({ harassment: true })
  })

  it('returns allowed when OpenAI returns flagged:false', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ results: [{ flagged: false }] }), {
        status: 200,
      }),
    )
    const v = await moderate('clean text', { surface: 'output' })
    expect(v.flagged).toBe(false)
    expect(v.allowed).toBe(true)
    expect(v.source).toBe('openai')
  })

  it('fails closed (flagged=true) when fetch throws', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('network down'),
    )
    const v = await moderate('whatever')
    expect(v.flagged).toBe(true)
    expect(v.source).toBe('error')
    expect(v.error).toMatch(/network down/)
  })

  it('fails closed on non-200 response', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('oops', { status: 500 }),
    )
    const v = await moderate('whatever')
    expect(v.flagged).toBe(true)
    expect(v.source).toBe('error')
  })
})
