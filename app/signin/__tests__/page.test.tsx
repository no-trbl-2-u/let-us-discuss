import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/actions', () => ({
  signInWithOtpAction: vi.fn(),
}))

import SignInPage from '@/app/signin/page'

async function renderPage(params: Record<string, string> = {}) {
  const element = await SignInPage({
    searchParams: Promise.resolve(params),
  })
  render(element as React.ReactElement)
}

describe('/signin page', () => {
  it('renders the magic-link form by default', async () => {
    await renderPage()
    expect(
      screen.getByRole('heading', { level: 1, name: /sign in/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /send magic link/i }),
    ).toBeInTheDocument()
  })

  it('renders the confirmation when sent=1', async () => {
    await renderPage({ sent: '1' })
    expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /send magic link/i }),
    ).toBeNull()
  })

  it('renders the error message when provided', async () => {
    await renderPage({ error: 'rate limit' })
    expect(screen.getByRole('alert')).toHaveTextContent('rate limit')
  })
})
