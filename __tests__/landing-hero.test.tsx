import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  HERO_HEADLINE,
  HERO_SUBHEAD,
  LandingHero,
} from '@/components/site/landing-hero'

describe('LandingHero', () => {
  it('renders the pitch headline as an H1', () => {
    render(<LandingHero />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(HERO_HEADLINE)
  })

  it('renders the subhead', () => {
    render(<LandingHero />)
    expect(screen.getByText(HERO_SUBHEAD)).toBeInTheDocument()
  })

  it('renders the demo-session CTA as a link to /try', () => {
    render(<LandingHero />)
    const cta = screen.getByRole('link', { name: /try a demo session/i })
    expect(cta).toHaveAttribute('href', '/try')
  })

  it('renders the "how a session runs" notes', () => {
    render(<LandingHero />)
    expect(screen.getByText(/staff the table/i)).toBeInTheDocument()
    expect(screen.getByText(/hand over the pitch/i)).toBeInTheDocument()
    expect(screen.getByText(/take the artifacts/i)).toBeInTheDocument()
  })
})
