import type { SessionEvent } from '@framework/schemas/events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getRouteUser = vi.fn()
const createSession = vi.fn()
const markStatusFn = vi.fn()
const appendTurnFn = vi.fn()
const finalizeArtifactFn = vi.fn()
const runConferringSpy = vi.fn()

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
    markStatus: (...args: unknown[]) => markStatusFn(...args),
    appendTurn: (...args: unknown[]) => appendTurnFn(...args),
    finalizeArtifact: (...args: unknown[]) => finalizeArtifactFn(...args),
  }
})

vi.mock('@/lib/anthropic/conferring', async () => {
  const actual = await vi.importActual<
    typeof import('@/lib/anthropic/conferring')
  >('@/lib/anthropic/conferring')
  return {
    ...actual,
    runConferring: (...args: unknown[]) => runConferringSpy(...args),
  }
})

vi.mock('@/lib/personas/load', async () => {
  const personas = [
    {
      slug: 'product-lead',
      name: 'Product lead',
      role: 'lead',
      voice: 'concrete',
      lead: true,
      tools: [],
      summary: 'x'.repeat(40),
      systemPrompt: 'x'.repeat(80),
    },
    {
      slug: 'skeptical-engineer',
      name: 'Skeptical engineer',
      role: 'specialist',
      voice: 'rigorous',
      lead: false,
      tools: [],
      summary: 'x'.repeat(40),
      systemPrompt: 'x'.repeat(80),
    },
    {
      slug: 'secretary',
      name: 'Secretary',
      role: 'secretary',
      voice: 'append-only',
      lead: false,
      tools: [],
      summary: 'x'.repeat(40),
      systemPrompt: 'x'.repeat(80),
    },
  ]
  return { loadPersonas: () => personas }
})

vi.mock('@/lib/templates/load', async () => {
  const template = {
    slug: 'pitch-to-spec',
    name: 'Pitch to spec',
    description: 'desc',
    phases: [
      {
        id: 'clarify',
        name: 'Clarify',
        description: 'short clarify description',
        lead_round_max_questions: 4,
      },
    ],
    escalation: {
      exec_summary_checkpoint: true,
      convergence_min_agreement: 0.7,
      user_redirect_max: 2,
    },
  }
  return {
    loadTemplate: () => template,
    DEFAULT_TEMPLATE_SLUG: 'pitch-to-spec',
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

function emit(events: SessionEvent[]) {
  return async function* () {
    for (const e of events) yield e
  }
}

describe('POST /api/sessions', () => {
  beforeEach(() => {
    getRouteUser.mockReset()
    createSession.mockReset()
    markStatusFn.mockReset()
    appendTurnFn.mockReset()
    finalizeArtifactFn.mockReset()
    runConferringSpy.mockReset()
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
        personaSlugs: ['product-lead', 'skeptical-engineer'],
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

  it('returns 400 for unknown personas', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: {} as never,
    })
    const { POST } = await import('@/app/api/sessions/route')
    const res = await POST(
      jsonRequest({
        pitch: 'hi there',
        personaSlugs: ['no-such-1', 'no-such-2'],
        templateSlug: 'pitch-to-spec',
      }) as never,
    )
    expect(res.status).toBe(400)
  })

  // Skipped: the mocked loadTemplate always returns a valid template, so the
  // unknown-template branch can't be exercised here. The real loadTemplate
  // throws → covered by lib/templates/__tests__/load.test.ts.

  it('returns the SSE stream from the orchestrator, headers + sessionId set', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: {} as never,
    })
    createSession.mockResolvedValue({ id: 'sid-100' })
    runConferringSpy.mockImplementation(() =>
      emit([
        { type: 'phase.entered', phase: 'clarify' },
        { type: 'session.done' },
      ])(),
    )
    const { POST } = await import('@/app/api/sessions/route')
    const res = await POST(
      jsonRequest({
        pitch: 'short pitch',
        personaSlugs: ['product-lead', 'skeptical-engineer'],
        templateSlug: 'pitch-to-spec',
      }) as never,
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Session-Id')).toBe('sid-100')
    expect(res.headers.get('Content-Type')).toMatch(/text\/event-stream/)
    const body = await readSseBody(res)
    expect(body).toContain('event: phase.entered')
    expect(body).toContain('event: session.done')
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
        personaSlugs: ['product-lead', 'skeptical-engineer'],
        templateSlug: 'pitch-to-spec',
      }) as never,
    )
    expect(res.status).toBe(500)
  })

  it('emits session.error internal if the orchestrator throws', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: {} as never,
    })
    createSession.mockResolvedValue({ id: 'sid-200' })
    runConferringSpy.mockImplementation(async function* () {
      throw new Error('orchestrator boom')
      // biome-ignore lint/correctness/noUnreachable: required for AsyncGenerator typing
      yield { type: 'session.done' as const }
    })
    const { POST } = await import('@/app/api/sessions/route')
    const res = await POST(
      jsonRequest({
        pitch: 'hi there',
        personaSlugs: ['product-lead', 'skeptical-engineer'],
        templateSlug: 'pitch-to-spec',
      }) as never,
    )
    expect(res.status).toBe(200)
    const body = await readSseBody(res)
    expect(body).toContain('"code":"internal"')
    expect(body).toContain('"message":"orchestrator boom"')
  })

  it('honors a valid model from the request body', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: {} as never,
    })
    createSession.mockResolvedValue({ id: 'sid-301' })
    runConferringSpy.mockImplementation(() =>
      emit([{ type: 'session.done' }])(),
    )
    const { POST } = await import('@/app/api/sessions/route')
    await POST(
      jsonRequest({
        pitch: 'short pitch',
        personaSlugs: ['product-lead', 'skeptical-engineer'],
        templateSlug: 'pitch-to-spec',
        model: 'claude-sonnet-4-6',
      }) as never,
    )
    const callArg = createSession.mock.calls[0]?.[1] as { model?: string }
    expect(callArg.model).toBe('claude-sonnet-4-6')
  })

  it('falls back to DEFAULT_MODEL when body omits model', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: {} as never,
    })
    createSession.mockResolvedValue({ id: 'sid-302' })
    runConferringSpy.mockImplementation(() =>
      emit([{ type: 'session.done' }])(),
    )
    const { POST } = await import('@/app/api/sessions/route')
    const { DEFAULT_MODEL } = await import('@/lib/anthropic/models')
    await POST(
      jsonRequest({
        pitch: 'short pitch',
        personaSlugs: ['product-lead', 'skeptical-engineer'],
        templateSlug: 'pitch-to-spec',
      }) as never,
    )
    const callArg = createSession.mock.calls[0]?.[1] as { model?: string }
    expect(callArg.model).toBe(DEFAULT_MODEL)
  })

  it('falls back to DEFAULT_MODEL for an unknown model (graceful, not 400)', async () => {
    getRouteUser.mockResolvedValue({
      user: { id: 'u-1' },
      supabase: {} as never,
    })
    createSession.mockResolvedValue({ id: 'sid-303' })
    runConferringSpy.mockImplementation(() =>
      emit([{ type: 'session.done' }])(),
    )
    const { POST } = await import('@/app/api/sessions/route')
    const { DEFAULT_MODEL } = await import('@/lib/anthropic/models')
    const res = await POST(
      jsonRequest({
        pitch: 'short pitch',
        personaSlugs: ['product-lead', 'skeptical-engineer'],
        templateSlug: 'pitch-to-spec',
        model: 'gpt-4-turbo',
      }) as never,
    )
    expect(res.status).toBe(200)
    const callArg = createSession.mock.calls[0]?.[1] as { model?: string }
    expect(callArg.model).toBe(DEFAULT_MODEL)
  })
})
