import type { TopCostRow } from '@/lib/admin/queries'

type TopCostTableProps = {
  rows: TopCostRow[]
}

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function formatTokens(n: number): string {
  return n.toLocaleString('en-US')
}

function shortSessionId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id
}

function shortDate(iso: string): string {
  return iso.slice(0, 10)
}

export function TopCostTable({ rows }: TopCostTableProps) {
  if (rows.length === 0) {
    return (
      <p className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
        no sessions tracked yet
      </p>
    )
  }
  return (
    <ul className="font-[var(--font-mono)] text-[var(--text-sm)] space-y-[var(--space-3)]">
      {rows.map((row) => (
        <li
          key={row.sessionId}
          className="text-[color:var(--ink-strong)]"
        >
          <div>
            sid {shortSessionId(row.sessionId)} · user{' '}
            {row.userIdPrefix ? `${row.userIdPrefix}…` : '—'}
          </div>
          <div className="text-[color:var(--ink-muted)] text-[var(--text-2xs)]">
            {shortDate(row.createdAt)} · {formatCost(row.costCents)} ·{' '}
            {formatTokens(row.totalTokens)} tok
          </div>
        </li>
      ))}
    </ul>
  )
}
