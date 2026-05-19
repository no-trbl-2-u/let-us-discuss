import { describe, expect, it, vi } from 'vitest'
import {
  appendRetro,
  loadRecentRetros,
  parseForNextTimeBullets,
} from '@/lib/retros/repo'
import type { SupabaseServerClient } from '@/lib/supabase/server'

type Builder = {
  from: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
}

function makeBuilder(opts: {
  selectResult?: { data: unknown; error: unknown }
  insertResult?: { data: unknown; error: unknown }
}): { client: SupabaseServerClient; b: Builder } {
  const b: Builder = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  }
  b.from.mockReturnValue(b)
  b.select.mockReturnValue(b)
  b.eq.mockReturnValue(b)
  b.order.mockReturnValue(b)
  b.limit.mockResolvedValue(opts.selectResult ?? { data: [], error: null })
  b.insert.mockResolvedValue(
    opts.insertResult ?? { data: null, error: null },
  )
  return { client: b as unknown as SupabaseServerClient, b }
}

describe('loadRecentRetros', () => {
  it('queries retros for the user, ordered desc, limited', async () => {
    const row = {
      id: 'r-1',
      session_id: 's-1',
      pitch_excerpt: 'pitch…',
      entry_md: '## entry',
      for_next_time: ['surface MAX_PERSONAS_SEATED'],
      created_at: '2026-05-19T00:00:00Z',
    }
    const { client, b } = makeBuilder({
      selectResult: { data: [row], error: null },
    })
    const out = await loadRecentRetros(client, 'user-1', 5)
    expect(b.from).toHaveBeenCalledWith('retros')
    expect(b.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(b.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(b.limit).toHaveBeenCalledWith(5)
    expect(out).toEqual([
      {
        id: 'r-1',
        sessionId: 's-1',
        pitchExcerpt: 'pitch…',
        entryMd: '## entry',
        forNextTime: ['surface MAX_PERSONAS_SEATED'],
        createdAt: '2026-05-19T00:00:00Z',
      },
    ])
  })

  it('returns an empty array when the table has no rows for the user', async () => {
    const { client } = makeBuilder({
      selectResult: { data: [], error: null },
    })
    expect(await loadRecentRetros(client, 'user-1', 5)).toEqual([])
  })

  it('throws when supabase returns an error', async () => {
    const { client } = makeBuilder({
      selectResult: { data: null, error: { message: 'boom' } },
    })
    await expect(loadRecentRetros(client, 'user-1', 5)).rejects.toThrow(
      /loadRecentRetros failed: boom/,
    )
  })
})

describe('appendRetro', () => {
  it('inserts the row with the right column shape', async () => {
    const { client, b } = makeBuilder({
      insertResult: { data: null, error: null },
    })
    await appendRetro(client, {
      sessionId: 's-1',
      userId: 'user-1',
      pitchExcerpt: 'a fuzzy pitch',
      entryMd: '## entry md',
      forNextTime: ['surface MAX_PERSONAS_SEATED', 'document first-touch'],
    })
    expect(b.from).toHaveBeenCalledWith('retros')
    expect(b.insert).toHaveBeenCalledWith({
      session_id: 's-1',
      user_id: 'user-1',
      pitch_excerpt: 'a fuzzy pitch',
      entry_md: '## entry md',
      for_next_time: [
        'surface MAX_PERSONAS_SEATED',
        'document first-touch',
      ],
    })
  })

  it('throws when supabase returns an error', async () => {
    const { client } = makeBuilder({
      insertResult: { data: null, error: { message: 'fk violation' } },
    })
    await expect(
      appendRetro(client, {
        sessionId: 's-1',
        userId: 'user-1',
        pitchExcerpt: 'pitch',
        entryMd: '## entry',
        forNextTime: [],
      }),
    ).rejects.toThrow(/appendRetro failed: fk violation/)
  })
})

describe('parseForNextTimeBullets', () => {
  const happyPath = `
=== Session retro — sid · 2026-05-19 ===

Pitch: "a short pitch"

### What went well
- one
- two
- three

### What didn't
- a
- b
- c

### For next time
- Surface MAX_PERSONAS_SEATED to the user during staffing
- Document the "first-touch" definition somewhere visible
- Add a clarify question about success metric
`

  it('extracts bullets from the For-next-time section', () => {
    const out = parseForNextTimeBullets(happyPath)
    expect(out).toEqual([
      'Surface MAX_PERSONAS_SEATED to the user during staffing',
      'Document the "first-touch" definition somewhere visible',
      'Add a clarify question about success metric',
    ])
  })

  it('returns [] when the section is absent', () => {
    const md = `### What went well\n- one\n\n### What didn't\n- a`
    expect(parseForNextTimeBullets(md)).toEqual([])
  })

  it('returns [] when the section body is the (none) sentinel', () => {
    const md = `### For next time\n(none)`
    expect(parseForNextTimeBullets(md)).toEqual([])
  })

  it('tolerates leading whitespace, em-dash bullets, and stops at the next heading', () => {
    const md = `### For next time
  - one
   - two
- three

### Something else
- ignored`
    expect(parseForNextTimeBullets(md)).toEqual(['one', 'two', 'three'])
  })

  it('caps at 6 bullets defensively', () => {
    const body = Array.from({ length: 10 }, (_, i) => `- item ${i + 1}`).join(
      '\n',
    )
    const md = `### For next time\n${body}`
    expect(parseForNextTimeBullets(md)).toHaveLength(6)
  })

  it('returns [] for empty input', () => {
    expect(parseForNextTimeBullets('')).toEqual([])
  })
})
