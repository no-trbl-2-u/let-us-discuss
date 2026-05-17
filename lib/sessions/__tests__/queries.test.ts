import {
  listSessions,
  loadSession,
  loadTranscript,
} from '@/lib/sessions/queries'
import type { SupabaseServerClient } from '@/lib/supabase/server'
import { describe, expect, it, vi } from 'vitest'

function chain(handlers: Record<string, unknown>): unknown {
  return handlers
}

describe('listSessions', () => {
  it('orders by created_at desc and filters by user_id; maps to SessionListItem', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'sid-1',
          status: 'done',
          total_tokens: 1234,
          created_at: '2026-05-16T12:00:00Z',
          pitch: 'A short pitch we expect to be excerpted later if too long',
          template_slug: 'pitch-to-spec',
          persona_slugs: ['product-lead', 'skeptical-engineer'],
        },
      ],
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    const client = { from } as unknown as SupabaseServerClient
    const items = await listSessions(client, 'u-1')
    expect(from).toHaveBeenCalledWith('sessions')
    expect(eq).toHaveBeenCalledWith('user_id', 'u-1')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(items).toHaveLength(1)
    expect(items[0]?.id).toBe('sid-1')
    expect(items[0]?.pitchExcerpt).toContain('A short pitch')
  })

  it('truncates pitches longer than 80 chars with ellipsis', async () => {
    const longPitch = 'x'.repeat(200)
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'sid-2',
          status: 'aborted',
          total_tokens: 0,
          created_at: '2026-05-16T12:00:00Z',
          pitch: longPitch,
          template_slug: 'pitch-to-spec',
          persona_slugs: [],
        },
      ],
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    const client = { from } as unknown as SupabaseServerClient
    const items = await listSessions(client, 'u-1')
    expect(items[0]?.pitchExcerpt.length).toBeLessThanOrEqual(81)
    expect(items[0]?.pitchExcerpt.endsWith('…')).toBe(true)
  })

  it('throws when Supabase errors', async () => {
    const order = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'rls denied' } })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    const client = { from } as unknown as SupabaseServerClient
    await expect(listSessions(client, 'u-1')).rejects.toThrow(/rls denied/)
  })
})

describe('loadSession', () => {
  function makeClient({
    sessionRow,
    artifactRow,
    count,
  }: {
    sessionRow: unknown
    artifactRow: unknown
    count: number
  }) {
    const sessionMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: sessionRow, error: null })
    const sessionEq2 = vi
      .fn()
      .mockReturnValue({ maybeSingle: sessionMaybeSingle })
    const sessionEq1 = vi.fn().mockReturnValue({ eq: sessionEq2 })
    const sessionSelect = vi.fn().mockReturnValue({ eq: sessionEq1 })

    const artMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: artifactRow, error: null })
    const artEq = vi.fn().mockReturnValue({ maybeSingle: artMaybeSingle })
    const artSelect = vi.fn().mockReturnValue({ eq: artEq })

    const turnsEq = vi.fn().mockResolvedValue({ count, error: null })
    const turnsSelect = vi.fn().mockReturnValue({ eq: turnsEq })

    const from = vi.fn((table: string) => {
      if (table === 'sessions') return chain({ select: sessionSelect })
      if (table === 'artifacts') return chain({ select: artSelect })
      if (table === 'turns') return chain({ select: turnsSelect })
      throw new Error(`unexpected table: ${table}`)
    })
    return { from } as unknown as SupabaseServerClient
  }

  it('returns null when the session row is hidden by RLS', async () => {
    const client = makeClient({ sessionRow: null, artifactRow: null, count: 0 })
    expect(await loadSession(client, 'u-1', 'sid-x')).toBeNull()
  })

  it('returns the row + artifact + turnCount on success', async () => {
    const client = makeClient({
      sessionRow: {
        id: 'sid-1',
        status: 'done',
        total_tokens: 1234,
        created_at: '2026-05-16T12:00:00Z',
        updated_at: '2026-05-16T12:30:00Z',
        pitch: 'pitch body',
        template_slug: 'pitch-to-spec',
        persona_slugs: ['lead'],
      },
      artifactRow: {
        spec_md: '# spec',
        exec_summary: 'sum',
        callouts: '- c',
        tokens_used: 1000,
        finished_at: '2026-05-16T12:25:00Z',
      },
      count: 7,
    })
    const result = await loadSession(client, 'u-1', 'sid-1')
    expect(result).not.toBeNull()
    expect(result?.artifact?.specMd).toBe('# spec')
    expect(result?.turnCount).toBe(7)
  })

  it('returns the row with null artifact when there is no artifact row', async () => {
    const client = makeClient({
      sessionRow: {
        id: 'sid-1',
        status: 'aborted',
        total_tokens: 0,
        created_at: '2026-05-16T12:00:00Z',
        updated_at: '2026-05-16T12:00:00Z',
        pitch: 'pitch body',
        template_slug: 'pitch-to-spec',
        persona_slugs: [],
      },
      artifactRow: null,
      count: 0,
    })
    const result = await loadSession(client, 'u-1', 'sid-1')
    expect(result?.artifact).toBeNull()
  })
})

describe('loadTranscript', () => {
  it('orders turns by idx asc and returns null on RLS-hidden session', async () => {
    const sessionMaybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: null })
    const sessionEq2 = vi
      .fn()
      .mockReturnValue({ maybeSingle: sessionMaybeSingle })
    const sessionEq1 = vi.fn().mockReturnValue({ eq: sessionEq2 })
    const sessionSelect = vi.fn().mockReturnValue({ eq: sessionEq1 })
    const from = vi.fn(() => ({ select: sessionSelect }))
    const client = { from } as unknown as SupabaseServerClient
    expect(await loadTranscript(client, 'u-1', 'sid-x')).toBeNull()
  })

  it('maps persisted turns into the SessionTurn shape', async () => {
    const sessionMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'sid-1',
        status: 'done',
        created_at: '2026-05-16T12:00:00Z',
        pitch: 'pitch',
        persona_slugs: ['lead'],
      },
      error: null,
    })
    const sessionEq2 = vi
      .fn()
      .mockReturnValue({ maybeSingle: sessionMaybeSingle })
    const sessionEq1 = vi.fn().mockReturnValue({ eq: sessionEq2 })
    const sessionSelect = vi.fn().mockReturnValue({ eq: sessionEq1 })

    const turnsOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: 't-1',
          phase: 'clarify',
          persona_slug: 'lead',
          author: 'persona',
          body: 'question?',
          replying_to: null,
          tokens: 5,
        },
      ],
      error: null,
    })
    const turnsEq = vi.fn().mockReturnValue({ order: turnsOrder })
    const turnsSelect = vi.fn().mockReturnValue({ eq: turnsEq })

    const from = vi.fn((table: string) => {
      if (table === 'sessions') return { select: sessionSelect }
      if (table === 'turns') return { select: turnsSelect }
      throw new Error(`unexpected: ${table}`)
    })
    const client = { from } as unknown as SupabaseServerClient

    const t = await loadTranscript(client, 'u-1', 'sid-1')
    expect(t?.turns).toHaveLength(1)
    expect(t?.turns[0]?.closed).toBe(true)
    expect(turnsOrder).toHaveBeenCalledWith('idx', { ascending: true })
  })
})
