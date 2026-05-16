import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/auth', () => ({
  requireUser: vi.fn().mockResolvedValue({ id: 'u-1', email: 'a@b.co' }),
}))

vi.mock('@/lib/auth/actions', () => ({
  signOutAction: vi.fn(),
}))

import AppHomePage from '@/app/app/page'

describe('/app placeholder page', () => {
  it('renders the signed-in email + sign-out button', async () => {
    const element = await AppHomePage()
    render(element as React.ReactElement)
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument()
    expect(screen.getByText('a@b.co')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /sign out/i }),
    ).toBeInTheDocument()
  })
})
