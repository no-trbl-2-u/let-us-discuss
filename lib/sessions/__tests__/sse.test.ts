import type { SessionEvent } from '@/lib/sessions/events'
import { encodeSseEvent, parseSseChunk } from '@/lib/sessions/sse'
import { describe, expect, it } from 'vitest'

describe('encodeSseEvent', () => {
  it('emits an event line, one data line per JSON newline, and a trailing blank', () => {
    const e: SessionEvent = { type: 'session.started', sessionId: 'sid-1' }
    const out = encodeSseEvent(e)
    expect(out).toBe(`event: session.started\ndata: ${JSON.stringify(e)}\n\n`)
  })

  it('splits payloads with embedded newlines onto multiple data lines', () => {
    const e: SessionEvent = {
      type: 'turn.delta',
      turnId: 't-1',
      delta: 'line1\nline2',
    }
    const out = encodeSseEvent(e)
    expect(out.endsWith('\n\n')).toBe(true)
    // The JSON of the payload itself doesn't contain literal newlines (\n is
    // escaped in JSON), so the encoded body should be a single data line.
    expect(out.split('\ndata:').length).toBe(2)
  })
})

describe('parseSseChunk', () => {
  it('parses one complete record and returns empty rest', () => {
    const buf =
      'event: session.started\ndata: {"type":"session.started","sessionId":"x"}\n\n'
    const { records, rest } = parseSseChunk(buf)
    expect(rest).toBe('')
    expect(records).toEqual([
      {
        event: 'session.started',
        data: '{"type":"session.started","sessionId":"x"}',
      },
    ])
  })

  it('parses multiple records and preserves an unterminated tail', () => {
    const buf =
      'event: a\ndata: {"type":"a"}\n\nevent: b\ndata: {"type":"b"}\n\nevent: c\ndata: {"typ'
    const { records, rest } = parseSseChunk(buf)
    expect(records.map((r) => r.event)).toEqual(['a', 'b'])
    expect(rest).toBe('event: c\ndata: {"typ')
  })

  it('round-trips encode → parse', () => {
    const events: SessionEvent[] = [
      { type: 'session.started', sessionId: 'sid' },
      { type: 'session.error', code: 'not-implemented', message: 'pending' },
    ]
    const buf = events.map(encodeSseEvent).join('')
    const { records, rest } = parseSseChunk(buf)
    expect(rest).toBe('')
    expect(records.map((r) => JSON.parse(r.data))).toEqual(events)
  })
})
