import type { UsageWindow, WindowSummary } from '@/lib/usage/summary'

type Props = {
  summary: Record<UsageWindow, WindowSummary>
}

const NUMBER_FORMAT = new Intl.NumberFormat('en-US')

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1000)}k`
  return NUMBER_FORMAT.format(n)
}

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

const WINDOW_LABELS: Record<UsageWindow, string> = {
  today: 'today',
  '7d': '7d',
  '30d': '30d',
}

const ORDER: UsageWindow[] = ['today', '7d', '30d']

export const ACCOUNT_USAGE_EMPTY_COPY = 'no sessions yet'
export const ACCOUNT_USAGE_FOOTNOTE =
  'Counts come from your own sessions; reset at midnight UTC.'

export function AccountUsageSummary({ summary }: Props) {
  const allEmpty = ORDER.every((w) => summary[w].sessions === 0)
  return (
    <section className="mt-[var(--space-6)] flex flex-col gap-[var(--space-3)]">
      <h2 className="font-[var(--font-serif)] font-semibold text-[var(--text-xl)] leading-[var(--leading-heading)] tracking-[var(--tracking-tight)] text-[color:var(--ink-strong)]">
        Usage
      </h2>
      {allEmpty ? (
        <p className="font-[var(--font-mono)] text-[var(--text-sm)] text-[color:var(--ink-muted)]">
          {ACCOUNT_USAGE_EMPTY_COPY}
        </p>
      ) : (
        <ul className="font-[var(--font-mono)] text-[var(--text-sm)] text-[color:var(--ink-strong)] space-y-[var(--space-2)]">
          {ORDER.map((win) => {
            const row = summary[win]
            return (
              <li key={win} className="flex flex-wrap gap-[var(--space-3)]">
                <span className="text-[color:var(--ink-muted)] min-w-[5ch]">
                  {WINDOW_LABELS[win]}
                </span>
                <span>{row.sessions} sessions</span>
                <span>· ~{formatTokens(row.tokens)} tokens</span>
                <span>· ~{formatCost(row.costCents)}</span>
              </li>
            )
          })}
        </ul>
      )}
      <p className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
        {ACCOUNT_USAGE_FOOTNOTE}
      </p>
    </section>
  )
}
