'use client'

import type { SessionEvent } from '@/lib/sessions/events'
import { parseSseChunk } from '@/lib/sessions/sse'

export type StartSessionInput = {
  pitch: string
  personaSlugs: string[]
  templateSlug: string
}

export type StartSessionResult =
  | { ok: true }
  | { ok: false; error: SessionEvent & { type: 'session.error' } }

// fetch() + ReadableStream parser. EventSource can't POST and we need to send
// the body; the cost is hand-rolled SSE parsing (see lib/sessions/sse.ts).
export async function startSession(
  input: StartSessionInput,
  onEvent: (event: SessionEvent) => void,
  options: { signal?: AbortSignal } = {},
): Promise<StartSessionResult> {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(input),
    signal: options.signal,
  })

  if (!response.ok || !response.body) {
    const error: SessionEvent = {
      type: 'session.error',
      code: response.status === 401 ? 'auth' : 'internal',
      message:
        response.status === 401
          ? 'sign in required'
          : `session start failed (status ${response.status})`,
    }
    onEvent(error)
    return {
      ok: false,
      error: error as SessionEvent & { type: 'session.error' },
    }
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const { records, rest } = parseSseChunk(buffer)
    buffer = rest
    for (const record of records) {
      let parsed: unknown
      try {
        parsed = JSON.parse(record.data)
      } catch {
        continue
      }
      if (parsed && typeof parsed === 'object' && 'type' in parsed) {
        onEvent(parsed as SessionEvent)
      }
    }
  }
  return { ok: true }
}
