'use client'

import { useMemo } from 'react'
import { estimateSessionUsage } from '@/lib/usage/typical-session'

type Props = {
  model: string
}

const NUMBER_FORMAT = new Intl.NumberFormat('en-US')

function formatTokens(n: number): string {
  if (n >= 1_000) return `${Math.round(n / 1000)}k`
  return NUMBER_FORMAT.format(n)
}

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export const ESTIMATE_DISCLAIMER =
  'Rough estimate. Actual usage varies; cap at 60k tokens.'

export function UsageEstimate({ model }: Props) {
  const estimate = useMemo(() => estimateSessionUsage(model), [model])
  const tokenLine = `~${formatTokens(estimate.tokensMin)}–${formatTokens(estimate.tokensMax)} tokens`
  const costLine =
    estimate.costCentsMin === null || estimate.costCentsMax === null
      ? '—'
      : `~${formatCost(estimate.costCentsMin)}–${formatCost(estimate.costCentsMax)}`
  return (
    <section
      aria-label="pre-session usage estimate"
      className="flex flex-col gap-[var(--space-1)] border border-[color:var(--paper-edge)] rounded-[var(--radius-md)] p-[var(--space-3)] bg-[color:var(--paper-raised)]"
    >
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
        Estimate
      </p>
      <p className="font-[var(--font-mono)] text-[var(--text-sm)] text-[color:var(--ink-strong)]">
        {tokenLine} · {costLine}
      </p>
      <p className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
        {ESTIMATE_DISCLAIMER}
      </p>
    </section>
  )
}
