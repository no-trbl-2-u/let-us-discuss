import { readdirSync } from 'node:fs'
import path from 'node:path'
import type { SupabaseServerClient } from '@/lib/supabase/server'

export const MIGRATIONS_DIR = 'db/migrations'

export type AppliedMigration = {
  filename: string
  appliedAt: string
}

/**
 * Reads `public.applied_migrations`. Returns one row per tracked
 * migration. The table has a SELECT policy granting access to any
 * authenticated user; the route-level `requireAdmin` gate is what
 * keeps this surface admin-only.
 *
 * Throws when the underlying table doesn't exist yet — the admin
 * page catches that and renders the bootstrap-not-run message.
 */
export async function loadAppliedMigrations(
  supabase: SupabaseServerClient,
): Promise<AppliedMigration[]> {
  const { data, error } = await supabase
    .from('applied_migrations')
    .select('filename, applied_at')
    .order('filename', { ascending: true })
  if (error) {
    throw new Error(`loadAppliedMigrations failed: ${error.message}`)
  }
  return (data ?? []).map((row) => ({
    filename: row.filename,
    appliedAt: row.applied_at,
  }))
}

/**
 * Synchronous filesystem walk over `db/migrations/`. Server-only;
 * the page reads this at request time and pairs the result with
 * `loadAppliedMigrations()` to produce the status table.
 */
export function listMigrationFiles(
  dir: string = MIGRATIONS_DIR,
): string[] {
  const abs = path.isAbsolute(dir) ? dir : path.resolve(dir)
  try {
    return readdirSync(abs)
      .filter((f) => f.endsWith('.sql'))
      .sort()
  } catch {
    return []
  }
}
