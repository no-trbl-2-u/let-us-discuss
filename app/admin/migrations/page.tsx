import type { Metadata } from 'next'
import {
  MigrationsTable,
  type MigrationRow,
} from '@/components/admin/migrations-table'
import { Link } from '@/design/primitives/link'
import {
  listMigrationFiles,
  loadAppliedMigrations,
  type AppliedMigration,
} from '@/lib/admin/migrations'
import { requireAdmin } from '@/lib/auth/admin'
import { logError } from '@/lib/observability/log'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Migrations · boardroom admin',
  robots: { index: false, follow: false },
}

type LoadResult =
  | { state: 'bootstrap-pending' }
  | { state: 'loaded'; applied: AppliedMigration[] }

async function load(): Promise<LoadResult> {
  const supabase = await createServerClient()
  try {
    const applied = await loadAppliedMigrations(supabase)
    return { state: 'loaded', applied }
  } catch (err) {
    // Most likely: bootstrap migration not yet applied, so the
    // `applied_migrations` table doesn't exist. Render the
    // bootstrap-not-run message rather than 500ing the page.
    logError('data', err, { loader: 'loadAppliedMigrations' })
    return { state: 'bootstrap-pending' }
  }
}

export default async function MigrationsPage() {
  await requireAdmin()
  const result = await load()
  const files = listMigrationFiles()

  const rows: MigrationRow[] =
    result.state === 'loaded'
      ? files.map((filename) => {
          const match = result.applied.find((a) => a.filename === filename)
          return {
            filename,
            appliedAt: match ? match.appliedAt : null,
          }
        })
      : []

  const appliedCount =
    result.state === 'loaded'
      ? rows.filter((r) => r.appliedAt !== null).length
      : 0
  const pendingCount =
    result.state === 'loaded' ? rows.length - appliedCount : 0

  return (
    <section className="mx-auto max-w-[1080px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-6)] md:py-[var(--space-7)]">
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-4)]">
        boardroom &nbsp;·&nbsp;{' '}
        <Link href="/admin" variant="quiet">
          admin
        </Link>{' '}
        &nbsp;/&nbsp; migrations
      </p>
      <h1 className="mb-[var(--space-5)] font-[var(--font-serif)] text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-semibold text-[color:var(--ink-strong)]">
        Migrations.
      </h1>

      {result.state === 'bootstrap-pending' ? (
        <p
          className="font-[var(--font-mono)] text-[var(--text-sm)] text-[color:var(--ink-muted)]"
          data-testid="bootstrap-pending"
        >
          applied_migrations table not yet bootstrapped — run{' '}
          <code className="text-[color:var(--ink-strong)]">
            pnpm db:apply-pending
          </code>{' '}
          from a shell with{' '}
          <code className="text-[color:var(--ink-strong)]">
            SUPABASE_DB_URL
          </code>{' '}
          set.
        </p>
      ) : (
        <>
          <p
            className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)] mb-[var(--space-4)]"
            data-testid="migrations-summary"
          >
            {appliedCount} applied · {pendingCount} pending
          </p>
          <MigrationsTable rows={rows} />
        </>
      )}
    </section>
  )
}
