import { describe, expect, it, vi } from 'vitest'
import {
  MIGRATIONS_DIR,
  listMigrationFiles,
  loadAppliedMigrations,
} from '@/lib/admin/migrations'
import type { SupabaseServerClient } from '@/lib/supabase/server'

type Builder = {
  from: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
}

function makeBuilder(result: {
  data: unknown
  error: unknown
}): { client: SupabaseServerClient; b: Builder } {
  const b: Builder = {
    from: vi.fn(),
    select: vi.fn(),
    order: vi.fn(),
  }
  b.from.mockReturnValue(b)
  b.select.mockReturnValue(b)
  b.order.mockResolvedValue(result)
  return { client: b as unknown as SupabaseServerClient, b }
}

describe('loadAppliedMigrations', () => {
  it('returns mapped rows in filename order', async () => {
    const { client, b } = makeBuilder({
      data: [
        {
          filename: '20260516_phase_7_sessions.sql',
          applied_at: '2026-05-16T00:00:00Z',
        },
        {
          filename: '20260520_phase_26_byok.sql',
          applied_at: '2026-05-21T00:00:00Z',
        },
      ],
      error: null,
    })
    const out = await loadAppliedMigrations(client)
    expect(b.from).toHaveBeenCalledWith('applied_migrations')
    expect(b.select).toHaveBeenCalledWith('filename, applied_at')
    expect(b.order).toHaveBeenCalledWith('filename', { ascending: true })
    expect(out).toEqual([
      {
        filename: '20260516_phase_7_sessions.sql',
        appliedAt: '2026-05-16T00:00:00Z',
      },
      {
        filename: '20260520_phase_26_byok.sql',
        appliedAt: '2026-05-21T00:00:00Z',
      },
    ])
  })

  it('returns an empty array when the table has no rows', async () => {
    const { client } = makeBuilder({ data: [], error: null })
    expect(await loadAppliedMigrations(client)).toEqual([])
  })

  it('throws when supabase returns an error (e.g. table missing)', async () => {
    const { client } = makeBuilder({
      data: null,
      error: { message: 'relation "applied_migrations" does not exist' },
    })
    await expect(loadAppliedMigrations(client)).rejects.toThrow(
      /relation "applied_migrations" does not exist/,
    )
  })
})

describe('listMigrationFiles', () => {
  it('reads the real db/migrations/ directory and returns sorted .sql files', () => {
    const files = listMigrationFiles()
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) {
      expect(f).toMatch(/\.sql$/)
    }
    // Lex order: first should sort before last.
    const sorted = [...files].sort()
    expect(files).toEqual(sorted)
  })

  it('includes the phase-30 bootstrap migration', () => {
    const files = listMigrationFiles()
    expect(
      files.some((f) => f.includes('phase_30_applied_migrations.sql')),
    ).toBe(true)
  })

  it('returns an empty array when the directory does not exist', () => {
    expect(listMigrationFiles('does/not/exist')).toEqual([])
  })

  it('exposes MIGRATIONS_DIR as the default', () => {
    expect(MIGRATIONS_DIR).toBe('db/migrations')
  })
})
