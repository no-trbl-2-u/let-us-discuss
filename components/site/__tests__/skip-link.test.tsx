import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SkipLink } from '@/components/site/skip-link'

describe('SkipLink', () => {
  it('renders an anchor pointed at #main', () => {
    render(<SkipLink />)
    const link = screen.getByRole('link', { name: /skip to main/i })
    expect(link).toHaveAttribute('href', '#main')
  })

  it('is visually hidden by default (uses the absolute-1px pattern)', () => {
    render(<SkipLink />)
    const link = screen.getByRole('link', { name: /skip to main/i })
    expect(link.className).toMatch(/absolute/)
    expect(link.className).toMatch(/w-px/)
    expect(link.className).toMatch(/overflow-hidden/)
  })
})
