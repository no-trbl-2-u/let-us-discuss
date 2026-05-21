export type MigrationRow = {
  filename: string
  appliedAt: string | null
}

type MigrationsTableProps = {
  rows: MigrationRow[]
}

function formatAppliedAt(iso: string | null): string {
  if (iso === null) return 'pending'
  // Render as 'applied YYYY-MM-DD HH:mm UTC'. Keep mono-aligned with
  // the rest of /admin.
  const trimmed = iso.slice(0, 16).replace('T', ' ')
  return `applied ${trimmed} UTC`
}

export function MigrationsTable({ rows }: MigrationsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="font-[var(--font-mono)] text-[var(--text-sm)] text-[color:var(--ink-muted)]">
        no migrations under db/migrations/.
      </p>
    )
  }
  return (
    <table
      className="font-[var(--font-mono)] text-[var(--text-sm)] w-full"
      data-testid="migrations-table"
    >
      <thead>
        <tr className="text-[color:var(--ink-muted)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)]">
          <th className="text-left pb-[var(--space-2)]">filename</th>
          <th className="text-left pb-[var(--space-2)]">state</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.filename}
            className="border-t border-[color:var(--paper-edge)]"
            data-state={row.appliedAt === null ? 'pending' : 'applied'}
          >
            <td className="py-[var(--space-2)] pr-[var(--space-4)] text-[color:var(--ink-strong)] break-all">
              {row.filename}
            </td>
            <td
              className={
                row.appliedAt === null
                  ? 'py-[var(--space-2)] text-[color:var(--accent)]'
                  : 'py-[var(--space-2)] text-[color:var(--ink-muted)]'
              }
            >
              {formatAppliedAt(row.appliedAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
