import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_USAGE_EMPTY_COPY,
  ACCOUNT_USAGE_FOOTNOTE,
  AccountUsageSummary,
} from '@/components/settings/account-usage-summary'
import type { UsageWindow, WindowSummary } from '@/lib/usage/summary'

function emptySummary(): Record<UsageWindow, WindowSummary> {
  return {
    today: { window: 'today', sessions: 0, tokens: 0, costCents: 0 },
    '7d': { window: '7d', sessions: 0, tokens: 0, costCents: 0 },
    '30d': { window: '30d', sessions: 0, tokens: 0, costCents: 0 },
  }
}

describe('AccountUsageSummary', () => {
  it('renders the empty-state copy when every window is zero', () => {
    render(<AccountUsageSummary summary={emptySummary()} />)
    expect(screen.getByText(ACCOUNT_USAGE_EMPTY_COPY)).toBeInTheDocument()
    expect(screen.queryByText(/today/i)).toBeNull()
    expect(screen.getByText(ACCOUNT_USAGE_FOOTNOTE)).toBeInTheDocument()
  })

  it('renders three windowed rows when there is data', () => {
    const summary: Record<UsageWindow, WindowSummary> = {
      today: { window: 'today', sessions: 1, tokens: 2_500, costCents: 12 },
      '7d': { window: '7d', sessions: 4, tokens: 32_000, costCents: 94 },
      '30d': { window: '30d', sessions: 12, tokens: 98_000, costCents: 281 },
    }
    render(<AccountUsageSummary summary={summary} />)
    expect(screen.getByText(/today/)).toBeInTheDocument()
    expect(screen.getByText(/^7d$/)).toBeInTheDocument()
    expect(screen.getByText(/^30d$/)).toBeInTheDocument()
    expect(screen.getByText(/1 sessions/)).toBeInTheDocument()
    expect(screen.getByText(/4 sessions/)).toBeInTheDocument()
    expect(screen.getByText(/12 sessions/)).toBeInTheDocument()
    expect(screen.getByText(/\$0\.12/)).toBeInTheDocument()
    expect(screen.getByText(/\$0\.94/)).toBeInTheDocument()
    expect(screen.getByText(/\$2\.81/)).toBeInTheDocument()
  })
})
