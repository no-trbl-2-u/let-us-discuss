import { SessionErrorCard } from '@/components/boardroom/session-error'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('SessionErrorCard', () => {
  it('renders the config-error body when ANTHROPIC_API_KEY is missing', () => {
    render(
      <SessionErrorCard
        error={{ code: 'config', message: 'ANTHROPIC_API_KEY missing' }}
        onReset={() => {}}
      />,
    )
    expect(screen.getByText(/ANTHROPIC_API_KEY/i)).toBeInTheDocument()
  })

  it('renders the internal body and surfaces the message in mono', () => {
    render(
      <SessionErrorCard
        error={{ code: 'internal', message: 'something broke' }}
        onReset={() => {}}
      />,
    )
    expect(screen.getByText(/Something broke mid-session/i)).toBeInTheDocument()
    expect(screen.getByText(/something broke/)).toBeInTheDocument()
  })

  it('returns nothing for auth (the effect navigates instead)', () => {
    const { container } = render(
      <SessionErrorCard
        error={{ code: 'auth', message: 'sign in required' }}
        onReset={() => {}}
      />,
    )
    expect(container.firstChild).toBeNull()
  })
})
