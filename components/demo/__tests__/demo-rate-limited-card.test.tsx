import { DemoRateLimitedCard } from '@/components/demo/demo-rate-limited-card'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('DemoRateLimitedCard', () => {
  it('renders the used/limit copy + sign-in link', () => {
    render(<DemoRateLimitedCard used={3} limit={3} />)
    expect(
      screen.getByText(/3\/3 times from this network today/),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/signin?next=/app',
    )
  })
})
