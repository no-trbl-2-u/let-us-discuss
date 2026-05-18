interface SessionUsageFooterProps {
  model: string
  totalTokens: number
  promptTokens: number
  completionTokens: number
  costCents: number
}

const NUMBER_FORMAT = new Intl.NumberFormat('en-US')

/**
 * Sentinel rule from phase 16's brief: render `—` for split
 * usage fields on legacy rows (sessions that ran before
 * phase 16 shipped). We detect them as "total_tokens > 0 but
 * the split + cost are both 0" — a real zero-token session
 * would have total_tokens == 0 too.
 */
function isLegacyRow(p: SessionUsageFooterProps): boolean {
  return (
    p.totalTokens > 0 &&
    p.promptTokens === 0 &&
    p.completionTokens === 0 &&
    p.costCents === 0
  )
}

function formatCost(cents: number): string {
  if (cents === 0) return '$0.00'
  const dollars = cents / 100
  return `$${dollars.toFixed(2)}`
}

export function SessionUsageFooter(props: SessionUsageFooterProps) {
  const legacy = isLegacyRow(props)
  const promptLabel = legacy
    ? '—'
    : `${NUMBER_FORMAT.format(props.promptTokens)} in`
  const completionLabel = legacy
    ? '—'
    : `${NUMBER_FORMAT.format(props.completionTokens)} out`
  const totalLabel =
    props.totalTokens === 0
      ? '—'
      : `${NUMBER_FORMAT.format(props.totalTokens)} tokens`
  const costLabel = legacy ? '—' : `~${formatCost(props.costCents)}`

  return (
    <footer
      aria-label="Session usage"
      className="mt-[var(--space-7)] pt-[var(--space-4)] border-t border-[color:var(--paper-edge)] font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)] flex flex-col gap-[var(--space-2)] md:flex-row md:items-center md:gap-[var(--space-4)]"
    >
      <span data-cell="model">{props.model}</span>
      <span aria-hidden className="hidden md:inline">
        ·
      </span>
      <span data-cell="split">
        {promptLabel} / {completionLabel}
      </span>
      <span aria-hidden className="hidden md:inline">
        ·
      </span>
      <span data-cell="total">{totalLabel}</span>
      <span aria-hidden className="hidden md:inline">
        ·
      </span>
      <span data-cell="cost">{costLabel}</span>
    </footer>
  )
}
