import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LegalSection } from '@/components/legal/legal-section'

describe('LegalSection', () => {
  it('renders the heading text with the literal id as anchor', () => {
    render(
      <LegalSection id="what-we-store" title="What we store">
        <p>Body</p>
      </LegalSection>,
    )
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'What we store',
    })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveAttribute('id', 'what-we-store-heading')
  })

  it('exposes the section id directly for #fragment links', () => {
    const { container } = render(
      <LegalSection id="retention" title="Retention and deletion">
        <p>Body</p>
      </LegalSection>,
    )
    const section = container.querySelector('section')
    expect(section).toHaveAttribute('id', 'retention')
  })

  it('renders the children inside the prose container', () => {
    render(
      <LegalSection id="cookies" title="Cookies">
        <p>One first-party cookie.</p>
        <p>No third-party cookies.</p>
      </LegalSection>,
    )
    expect(screen.getByText(/one first-party cookie/i)).toBeInTheDocument()
    expect(screen.getByText(/no third-party cookies/i)).toBeInTheDocument()
  })

  it('the title is wrapped in an anchor pointing at #id for self-link', () => {
    render(
      <LegalSection id="moderation" title="Moderation">
        <p>Body</p>
      </LegalSection>,
    )
    const link = screen.getByRole('link', { name: 'Moderation' })
    expect(link).toHaveAttribute('href', '#moderation')
  })
})
