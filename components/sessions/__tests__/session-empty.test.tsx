import { SessionEmpty } from '@/components/sessions/session-empty'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('SessionEmpty', () => {
  it('renders the standing template copy with a link to /app', () => {
    render(<SessionEmpty />)
    expect(screen.getByText(/No sessions yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start one/i })).toHaveAttribute(
      'href',
      '/app',
    )
  })
})
