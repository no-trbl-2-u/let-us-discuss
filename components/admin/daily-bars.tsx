type DailyRow = { day: string; value: number }

type DailyBarsProps = {
  rows: DailyRow[]
  formatValue?: (v: number) => string
}

function defaultFormat(v: number): string {
  return v.toLocaleString('en-US')
}

function dayLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  }).toLowerCase()
}

export function DailyBars({ rows, formatValue = defaultFormat }: DailyBarsProps) {
  if (rows.length === 0) {
    return (
      <p className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
        no data yet
      </p>
    )
  }
  return (
    <ul className="font-[var(--font-mono)] text-[var(--text-sm)] space-y-[var(--space-1)]">
      {rows.map((row) => (
        <li
          key={row.day}
          className="text-[color:var(--ink-strong)] flex items-baseline gap-[var(--space-3)]"
        >
          <span className="text-[color:var(--ink-muted)] text-[var(--text-2xs)] min-w-[3ch]">
            {dayLabel(row.day)}
          </span>
          <span>{formatValue(row.value)}</span>
        </li>
      ))}
    </ul>
  )
}
