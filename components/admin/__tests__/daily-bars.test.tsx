import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DailyBars } from '@/components/admin/daily-bars'

describe('DailyBars', () => {
  it('renders one row per day with weekday label and value', () => {
    render(
      <DailyBars
        rows={[
          { day: '2026-05-18', value: 6 },
          { day: '2026-05-19', value: 8 },
          { day: '2026-05-20', value: 0 },
        ]}
      />,
    )
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('renders the empty state with no rows', () => {
    render(<DailyBars rows={[]} />)
    expect(screen.getByText(/no data yet/i)).toBeInTheDocument()
  })

  it('applies a custom formatter', () => {
    render(
      <DailyBars
        rows={[{ day: '2026-05-20', value: 1234000 }]}
        formatValue={(v) => `${Math.round(v / 1000)}k`}
      />,
    )
    expect(screen.getByText('1234k')).toBeInTheDocument()
  })
})
