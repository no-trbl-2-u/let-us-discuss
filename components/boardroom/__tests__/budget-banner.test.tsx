import { BudgetBanner } from '@/components/boardroom/budget-banner'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('BudgetBanner', () => {
  it('renders nothing when no warn/wrap is set', () => {
    const { container } = render(
      <BudgetBanner budget={{ used: 0, warned: false, wrapped: false }} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('surfaces a heads-up when warned', () => {
    render(
      <BudgetBanner budget={{ used: 50000, warned: true, wrapped: false }} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(/Heads up/i)
  })

  it('surfaces wrap copy when wrapped', () => {
    render(
      <BudgetBanner budget={{ used: 60000, warned: true, wrapped: true }} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(/Budget wrapped/i)
  })
})
