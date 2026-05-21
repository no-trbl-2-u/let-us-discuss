import type { Metadata } from 'next'
import { DailyBars } from '@/components/admin/daily-bars'
import { TopCostTable } from '@/components/admin/top-cost-table'
import { UsageTile } from '@/components/admin/usage-tile'
import { requireAdmin } from '@/lib/auth/admin'
import {
  ADMIN_RECENT_DAYS,
  ADMIN_TOP_COST_LIMIT,
  type DayBucket,
  type RateSummary,
  type TokenBucket,
  type TopCostRow,
  loadFlagAndErrorRates,
  loadSessionsPerDay,
  loadTokensPerDay,
  loadTopCostSessions,
} from '@/lib/admin/queries'
import { logError } from '@/lib/observability/log'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'admin · boardroom',
  robots: { index: false, follow: false },
}

type LoaderResult<T> = { ok: true; value: T } | { ok: false }

async function guard<T>(label: string, loader: () => Promise<T>): Promise<LoaderResult<T>> {
  try {
    return { ok: true, value: await loader() }
  } catch (err) {
    logError('data', err, { loader: label })
    return { ok: false }
  }
}

function totalTokens(rows: TokenBucket[]): number {
  return rows.reduce((acc, r) => acc + r.tokens, 0)
}

function totalSessions(rows: DayBucket[]): number {
  return rows.reduce((acc, r) => acc + r.sessions, 0)
}

function compactTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1000)}k`
  return n.toString()
}

export default async function AdminPage() {
  const user = await requireAdmin()
  const supabase = await createServerClient()
  const [sessionsResult, tokensResult, topCostResult, ratesResult] = await Promise.all([
    guard('sessions-per-day', () => loadSessionsPerDay(supabase, ADMIN_RECENT_DAYS)),
    guard('tokens-per-day', () => loadTokensPerDay(supabase, ADMIN_RECENT_DAYS)),
    guard('top-cost-sessions', () => loadTopCostSessions(supabase, ADMIN_TOP_COST_LIMIT)),
    guard<RateSummary>('flag-and-error-rates', () => loadFlagAndErrorRates(supabase)),
  ])

  const sessionsBuckets = sessionsResult.ok ? sessionsResult.value : null
  const tokensBuckets = tokensResult.ok ? tokensResult.value : null
  const topCostRows: TopCostRow[] | null = topCostResult.ok ? topCostResult.value : null
  const rates = ratesResult.ok ? ratesResult.value : null

  return (
    <section className="mx-auto max-w-[1080px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-6)] md:py-[var(--space-7)]">
      <header className="mb-[var(--space-6)] flex items-baseline justify-between gap-[var(--space-4)] flex-wrap">
        <div>
          <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-2)]">
            boardroom &nbsp;·&nbsp; admin
          </p>
          <h1 className="font-[var(--font-serif)] text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-semibold text-[color:var(--ink-strong)]">
            admin
          </h1>
        </div>
        <p className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
          signed in as {user.email ?? user.id} (admin)
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-4)]">
        <UsageTile
          header={`Sessions / day · last ${ADMIN_RECENT_DAYS}d`}
          body={
            sessionsBuckets ? (
              <>
                <div>{totalSessions(sessionsBuckets)} total</div>
                <div className="mt-[var(--space-3)]">
                  <DailyBars
                    rows={sessionsBuckets.map((b) => ({ day: b.day, value: b.sessions }))}
                  />
                </div>
              </>
            ) : (
              '—'
            )
          }
          secondary={sessionsBuckets ? null : 'no data yet'}
        />

        <UsageTile
          header={`Tokens / day · last ${ADMIN_RECENT_DAYS}d`}
          body={
            tokensBuckets ? (
              <>
                <div>{compactTokens(totalTokens(tokensBuckets))} total</div>
                <div className="mt-[var(--space-3)]">
                  <DailyBars
                    rows={tokensBuckets.map((b) => ({ day: b.day, value: b.tokens }))}
                    formatValue={compactTokens}
                  />
                </div>
              </>
            ) : (
              '—'
            )
          }
          secondary={tokensBuckets ? null : 'no data yet'}
        />

        <UsageTile
          header="Flag rate (week)"
          body={rates ? `${rates.flagRate.toFixed(1)}%` : '—'}
          secondary={
            rates
              ? `${rates.flagsThisWeek} / ${rates.sessionsThisWeek}`
              : 'no data yet'
          }
        />

        <UsageTile
          header="Error rate (week)"
          body={rates ? `${rates.errorRate.toFixed(1)}%` : '—'}
          secondary={
            rates
              ? `${rates.abortedThisWeek} / ${rates.sessionsThisWeek}`
              : 'no data yet'
          }
        />
      </div>

      <div className="mt-[var(--space-5)]">
        <UsageTile
          header={`Top ${ADMIN_TOP_COST_LIMIT} cost sessions`}
          body={topCostRows ? <TopCostTable rows={topCostRows} /> : '—'}
          secondary={topCostRows ? null : 'no data yet'}
        />
      </div>

      <p className="mt-[var(--space-6)] font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
        <a
          href="/admin/migrations"
          className="underline-offset-4 hover:underline"
        >
          → Migrations status
        </a>
      </p>
    </section>
  )
}
