import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TopCostTable } from '@/components/admin/top-cost-table'

describe('TopCostTable', () => {
  it('renders the empty state when rows is empty', () => {
    render(<TopCostTable rows={[]} />)
    expect(screen.getByText(/no sessions tracked yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).toBeNull()
  })

  it('renders one row per session with cost, tokens, and short ids', () => {
    render(
      <TopCostTable
        rows={[
          {
            sessionId: 'session-aaaabbbbcccc',
            userIdPrefix: '01234567',
            costCents: 99,
            totalTokens: 19134,
            createdAt: '2026-05-19T01:00:00Z',
          },
          {
            sessionId: 'session-ddddeeee',
            userIdPrefix: 'fedcba98',
            costCents: 42,
            totalTokens: 17212,
            createdAt: '2026-05-18T01:00:00Z',
          },
        ]}
      />,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getAllByText(/^sid session-/).length).toBe(2)
    expect(screen.getByText(/\$0\.99/)).toBeInTheDocument()
    expect(screen.getByText(/\$0\.42/)).toBeInTheDocument()
    expect(screen.getByText(/19,134 tok/)).toBeInTheDocument()
    expect(screen.getByText(/2026-05-19/)).toBeInTheDocument()
  })

  it('renders — for missing user prefix', () => {
    render(
      <TopCostTable
        rows={[
          {
            sessionId: 'session-zzzzzz',
            userIdPrefix: '',
            costCents: 10,
            totalTokens: 1,
            createdAt: '2026-05-20T01:00:00Z',
          },
        ]}
      />,
    )
    expect(screen.getByText(/user —/)).toBeInTheDocument()
  })
})
