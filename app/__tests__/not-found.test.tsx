import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import NotFound, { metadata } from '@/app/not-found'

describe('app/not-found', () => {
  it('renders the locked H1 "Not found."', () => {
    render(NotFound())
    expect(
      screen.getByRole('heading', { level: 1, name: /^not found\.$/i }),
    ).toBeInTheDocument()
  })

  it('exposes a Go to the landing page link to /', () => {
    render(NotFound())
    const cta = screen.getByRole('link', { name: /go to the landing page/i })
    expect(cta).toHaveAttribute('href', '/')
  })

  it('declares a dedicated metadata title (not the landing default)', () => {
    expect(metadata.title).toBe('Not found — boardroom')
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})
