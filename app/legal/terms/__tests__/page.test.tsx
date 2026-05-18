import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TermsPage, { LAST_UPDATED } from '@/app/legal/terms/page'

describe('/legal/terms page', () => {
  it('renders the H1', () => {
    render(TermsPage())
    expect(
      screen.getByRole('heading', { level: 1, name: /terms of use/i }),
    ).toBeInTheDocument()
  })

  it('renders every locked section id', () => {
    const { container } = render(TermsPage())
    const expectedIds = [
      'who-can-use',
      'acceptable-use',
      'quotas',
      'moderation',
      'no-warranty',
      'closure',
      'contact',
    ]
    for (const id of expectedIds) {
      expect(container.querySelector(`section#${id}`)).not.toBeNull()
    }
  })

  it('renders the last-updated date in the footnote', () => {
    render(TermsPage())
    expect(
      screen.getByText(new RegExp(`last updated:\\s*${LAST_UPDATED}`, 'i')),
    ).toBeInTheDocument()
  })

  it('cross-links Privacy at the anchored retention and moderation sections', () => {
    render(TermsPage())
    const privacyLinks = screen.getAllByRole('link', { name: /privacy/i })
    const hrefs = privacyLinks.map((el) => el.getAttribute('href'))
    expect(hrefs).toContain('/legal/privacy#moderation')
    expect(hrefs).toContain('/legal/privacy#retention')
  })
})
