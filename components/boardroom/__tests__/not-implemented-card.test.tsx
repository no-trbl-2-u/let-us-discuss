import { NotImplementedCard } from '@/components/boardroom/not-implemented-card'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

describe('NotImplementedCard', () => {
  it('renders the phase-7b honesty copy', () => {
    render(<NotImplementedCard onReset={() => {}} />)
    expect(screen.getByText(/phase 7b lights this up/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Real sessions ship in phase 7b/i),
    ).toBeInTheDocument()
  })

  it('calls onReset when Reset is clicked', () => {
    const onReset = vi.fn()
    render(<NotImplementedCard onReset={onReset} />)
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
