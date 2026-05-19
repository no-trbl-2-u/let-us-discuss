import { startSession } from '@/components/boardroom/session-stream'
import type { SessionEvent } from '@framework/schemas/events'
import { encodeSseEvent } from '@/lib/sessions/sse'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function sseResponse(events: SessionEvent[]): Response {
  const body = events.map(encodeSseEvent).join('')
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body))
      controller.close()
    },
  })
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

describe('startSession', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('parses the two-event not-implemented stream and forwards events in order', async () => {
    const events: SessionEvent[] = [
      { type: 'session.started', sessionId: 'sid-7' },
      { type: 'session.error', code: 'not-implemented', message: 'pending' },
    ]
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      sseResponse(events),
    )
    const received: SessionEvent[] = []
    const result = await startSession(
      { pitch: 'p', personaSlugs: ['a', 'b'], templateSlug: 'pitch-to-spec' },
      (e) => received.push(e),
    )
    expect(result.ok).toBe(true)
    expect(received).toEqual(events)
  })

  it('emits session.error code=auth on 401', async () => {
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('nope', { status: 401 }),
    )
    const received: SessionEvent[] = []
    const result = await startSession(
      { pitch: 'p', personaSlugs: ['a', 'b'], templateSlug: 'pitch-to-spec' },
      (e) => received.push(e),
    )
    expect(result.ok).toBe(false)
    expect(received).toEqual([
      { type: 'session.error', code: 'auth', message: 'sign in required' },
    ])
  })

  it('emits session.error code=internal on 500', async () => {
    ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('boom', { status: 500 }),
    )
    const received: SessionEvent[] = []
    const result = await startSession(
      { pitch: 'p', personaSlugs: ['a', 'b'], templateSlug: 'pitch-to-spec' },
      (e) => received.push(e),
    )
    expect(result.ok).toBe(false)
    const first = received[0]
    expect(first).toBeDefined()
    if (first?.type === 'session.error') {
      expect(first.code).toBe('internal')
    } else {
      throw new Error('expected first event to be session.error')
    }
  })
})
