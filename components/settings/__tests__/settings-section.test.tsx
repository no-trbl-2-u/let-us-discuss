import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SettingsSection } from '@/components/settings/settings-section'

describe('SettingsSection', () => {
  it('renders the title as an H2', () => {
    render(
      <SettingsSection title="Account">
        <p>Body</p>
      </SettingsSection>,
    )
    expect(
      screen.getByRole('heading', { level: 2, name: /account/i }),
    ).toBeInTheDocument()
  })

  it('renders children inside the prose container', () => {
    render(
      <SettingsSection title="Account">
        <p>Close your account.</p>
      </SettingsSection>,
    )
    expect(screen.getByText(/close your account/i)).toBeInTheDocument()
  })

  it('renders the optional CTA when provided', () => {
    render(
      <SettingsSection
        title="Account"
        cta={<a href="/app/settings/delete-account">Delete account →</a>}
      >
        <p>Body</p>
      </SettingsSection>,
    )
    expect(
      screen.getByRole('link', { name: /delete account/i }),
    ).toHaveAttribute('href', '/app/settings/delete-account')
  })

  it('omits the CTA row when cta is undefined', () => {
    const { container } = render(
      <SettingsSection title="Account">
        <p>Body</p>
      </SettingsSection>,
    )
    expect(container.querySelectorAll('a')).toHaveLength(0)
  })
})
