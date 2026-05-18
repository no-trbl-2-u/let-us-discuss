import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const paramsGet = vi.fn()

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: paramsGet }),
}))

import { LandingDeletedBanner } from '@/components/site/landing-deleted-banner'

describe('LandingDeletedBanner', () => {
  it('renders nothing when ?account is absent', () => {
    paramsGet.mockReturnValue(null)
    const { container } = render(<LandingDeletedBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when ?account is some other value', () => {
    paramsGet.mockReturnValue('created')
    const { container } = render(<LandingDeletedBanner />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the locked banner copy when ?account=deleted', () => {
    paramsGet.mockReturnValue('deleted')
    render(<LandingDeletedBanner />)
    expect(
      screen.getByText(/your account was deleted/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
