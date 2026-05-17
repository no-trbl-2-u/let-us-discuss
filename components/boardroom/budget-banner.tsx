'use client'

import type { SessionBudget } from './use-session-state'

type Props = {
  budget: SessionBudget
}

export function BudgetBanner({ budget }: Props) {
  if (!budget.warned && !budget.wrapped) return null
  const label = budget.wrapped
    ? `Budget wrapped at ${budget.used.toLocaleString()} tokens — finishing on what we have.`
    : `Heads up: ${budget.used.toLocaleString()} tokens used.`
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] bg-[color:var(--paper-sunken)] border-l-2 border-[color:var(--accent)] font-[var(--font-sans)] text-[var(--text-2xs)] tracking-[var(--tracking-tight)] text-[color:var(--ink-muted)]"
    >
      {label}
    </div>
  )
}
