import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PrivacyPage, { LAST_UPDATED } from '@/app/legal/privacy/page'

describe('/legal/privacy page', () => {
  it('renders the H1', () => {
    render(PrivacyPage())
    expect(
      screen.getByRole('heading', { level: 1, name: /^privacy\.$/i }),
    ).toBeInTheDocument()
  })

  it('renders every locked section id', () => {
    const { container } = render(PrivacyPage())
    const expectedIds = [
      'what-we-store',
      'what-we-dont-store',
      'ip-addresses',
      'retention',
      'moderation',
      'cookies',
      'changes',
    ]
    for (const id of expectedIds) {
      expect(container.querySelector(`section#${id}`)).not.toBeNull()
    }
  })

  it('renders the last-updated date in the footnote', () => {
    render(PrivacyPage())
    expect(
      screen.getByText(new RegExp(`last updated:\\s*${LAST_UPDATED}`, 'i')),
    ).toBeInTheDocument()
  })

  it('cross-links Terms from the moderation section', () => {
    render(PrivacyPage())
    const termsLink = screen.getByRole('link', { name: /^terms$/i })
    expect(termsLink).toHaveAttribute('href', '/legal/terms')
  })
})
