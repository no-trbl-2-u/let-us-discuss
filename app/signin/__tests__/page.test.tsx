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
      screen.getByRole('heading', { level: 2, name: /sign in/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /send the link/i }),
    ).toBeInTheDocument()
  })

  it('renders the confirmation when sent=1', async () => {
    await renderPage({ sent: '1' })
    expect(screen.getByText(/check your inbox/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /send the link/i }),
    ).toBeNull()
    expect(
      screen.getByRole('button', { name: /send another link/i }),
    ).toBeInTheDocument()
  })

  it('renders the error message + aria-invalid input when error provided', async () => {
    await renderPage({ error: 'rate limit' })
    const input = screen.getByLabelText(/email/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('rate limit')).toBeInTheDocument()
  })
})
