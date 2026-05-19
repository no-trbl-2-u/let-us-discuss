import {
  appendTurn,
  createSession,
  finalizeArtifact,
  isSessionStatus,
  markStatus,
} from '@/lib/sessions/repo'
import type { SupabaseServerClient } from '@/lib/supabase/server'
import { describe, expect, it, vi } from 'vitest'

type Spy = ReturnType<typeof vi.fn>

function mockClient(handlers: {
  insertResult?: { data: unknown; error: { message: string } | null }
  updateResult?: { error: { message: string } | null }
}): {
  client: SupabaseServerClient
  insertSpy: Spy
  updateSpy: Spy
  eqSpy: Spy
} {
  const insertSpy = vi.fn()
  const updateSpy = vi.fn()
  const eqSpy = vi.fn()
  const singleSpy = vi
    .fn()
    .mockResolvedValue(
      handlers.insertResult ?? { data: { id: 'sid-1' }, error: null },
    )
  const selectSpy = vi.fn().mockReturnValue({ single: singleSpy })
  const directInsert = Promise.resolve(
    handlers.insertResult ?? { data: null, error: null },
  ).then((v) => ({ error: v.error }))
  // Supabase's PostgrestQueryBuilder is itself thenable; mock it as a Promise
  // augmented with the .select() method so both code paths (await directly,
  // and .select().single()) work in tests.
  const thenable = Object.assign(directInsert, { select: selectSpy })
  insertSpy.mockReturnValue(thenable)
  eqSpy.mockResolvedValue(handlers.updateResult ?? { error: null })
  updateSpy.mockReturnValue({ eq: eqSpy })
  const from = vi.fn().mockReturnValue({ insert: insertSpy, update: updateSpy })
  return {
    client: { from } as unknown as SupabaseServerClient,
    insertSpy,
    updateSpy,
    eqSpy,
  }
}

describe('isSessionStatus', () => {
  it('accepts known values, rejects unknown', () => {
    expect(isSessionStatus('clarify')).toBe(true)
    expect(isSessionStatus('aborted')).toBe(true)
    expect(isSessionStatus('hammertime')).toBe(false)
    expect(isSessionStatus(null)).toBe(false)
  })
})

describe('createSession', () => {
  it('inserts and returns the id', async () => {
    const { client, insertSpy } = mockClient({
      insertResult: { data: { id: 'sid-42' }, error: null },
    })
    const result = await createSession(client, {
      userId: 'u-1',
      pitch: 'short',
      templateSlug: 'pitch-to-spec',
      personaSlugs: ['product-lead', 'skeptical-engineer'],
      model: 'claude-opus-4-7',
      status: 'aborted',
    })
    expect(result).toEqual({ id: 'sid-42' })
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u-1',
        status: 'aborted',
        persona_slugs: ['product-lead', 'skeptical-engineer'],
        ip_hash: null,
      }),
    )
  })

  it('throws when supabase returns an error', async () => {
    const { client } = mockClient({
      insertResult: { data: null, error: { message: 'RLS denied' } },
    })
    await expect(
      createSession(client, {
        userId: 'u-1',
        pitch: 'p',
        templateSlug: 't',
        personaSlugs: ['a', 'b'],
        model: 'm',
        status: 'aborted',
      }),
    ).rejects.toThrow(/RLS denied/)
  })
})

describe('markStatus', () => {
  it('writes the new status', async () => {
    const { client, updateSpy, eqSpy } = mockClient({
      updateResult: { error: null },
    })
    await markStatus(client, 'sid-1', 'done')
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'done' }),
    )
    expect(eqSpy).toHaveBeenCalledWith('id', 'sid-1')
  })

  it('rejects unknown statuses before hitting the db', async () => {
    const { client } = mockClient({})
    await expect(
      markStatus(client, 'sid-1', 'rocket' as never),
    ).rejects.toThrow(/unknown status/)
  })

  it('throws when supabase errors', async () => {
    const { client } = mockClient({
      updateResult: { error: { message: 'nope' } },
    })
    await expect(markStatus(client, 'sid-1', 'done')).rejects.toThrow(/nope/)
  })
})

describe('appendTurn', () => {
  it('inserts a row', async () => {
    const { client, insertSpy } = mockClient({
      insertResult: { data: null, error: null },
    })
    await appendTurn(client, {
      sessionId: 'sid-1',
      idx: 3,
      phase: 'confer',
      personaSlug: 'product-lead',
      author: 'persona',
      body: 'short turn body',
      tokens: 42,
    })
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'sid-1',
        idx: 3,
        phase: 'confer',
        author: 'persona',
      }),
    )
  })

  it('propagates supabase errors', async () => {
    const { client } = mockClient({
      insertResult: { data: null, error: { message: 'fk violation' } },
    })
    await expect(
      appendTurn(client, {
        sessionId: 'sid-1',
        idx: 1,
        phase: 'clarify',
        personaSlug: null,
        author: 'moderator',
        body: 'x',
        tokens: 0,
      }),
    ).rejects.toThrow(/fk violation/)
  })
})

describe('finalizeArtifact', () => {
  it('inserts artifact row with all four fields plus the secretary log', async () => {
    const { client, insertSpy } = mockClient({
      insertResult: { data: null, error: null },
    })
    await finalizeArtifact(client, {
      sessionId: 'sid-1',
      specMd: '# spec',
      execSummary: 'summary',
      callouts: '- one',
      secretaryLog: '=== Secretary log ===',
      tokensUsed: 1234,
    })
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'sid-1',
        spec_md: '# spec',
        exec_summary: 'summary',
        callouts: '- one',
        secretary_log: '=== Secretary log ===',
        tokens_used: 1234,
      }),
    )
  })
})
