import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SessionUsageFooter } from '@/components/sessions/session-usage-footer'

describe('SessionUsageFooter', () => {
  it('renders model, split usage, total, and cost when all fields are present', () => {
    render(
      <SessionUsageFooter
        model="claude-sonnet-4-6"
        totalTokens={19_134}
        promptTokens={12_345}
        completionTokens={6_789}
        costCents={42}
      />,
    )
    expect(screen.getByText('claude-sonnet-4-6')).toBeInTheDocument()
    expect(screen.getByText(/12,345 in/)).toBeInTheDocument()
    expect(screen.getByText(/6,789 out/)).toBeInTheDocument()
    expect(screen.getByText(/19,134 tokens/)).toBeInTheDocument()
    expect(screen.getByText(/~\$0\.42/)).toBeInTheDocument()
  })

  it('exposes a "Session usage" landmark', () => {
    render(
      <SessionUsageFooter
        model="claude-sonnet-4-6"
        totalTokens={100}
        promptTokens={60}
        completionTokens={40}
        costCents={1}
      />,
    )
    expect(
      screen.getByRole('contentinfo', { name: /session usage/i }),
    ).toBeInTheDocument()
  })

  it('renders `—` for split + cost on legacy rows (totalTokens > 0 but split == 0)', () => {
    render(
      <SessionUsageFooter
        model="claude-opus-4-7"
        totalTokens={5000}
        promptTokens={0}
        completionTokens={0}
        costCents={0}
      />,
    )
    // Split cell composes into "— / —" (no "in"/"out" suffixes on the
    // dashes); cost cell is bare "—".
    expect(screen.getByText(/—\s+\/\s+—/)).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText(/5,000 tokens/)).toBeInTheDocument()
  })

  it('renders `—` for total when totalTokens is 0 (truly empty session)', () => {
    render(
      <SessionUsageFooter
        model="claude-haiku-4-5"
        totalTokens={0}
        promptTokens={0}
        completionTokens={0}
        costCents={0}
      />,
    )
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('formats USD cost with two decimal places', () => {
    render(
      <SessionUsageFooter
        model="claude-sonnet-4-6"
        totalTokens={100}
        promptTokens={60}
        completionTokens={40}
        costCents={1234}
      />,
    )
    expect(screen.getByText(/~\$12\.34/)).toBeInTheDocument()
  })
})
