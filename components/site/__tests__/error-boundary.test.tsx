import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from '@/components/site/error-boundary'

const error = Object.assign(new Error('something exploded'), {
  digest: 'abc123',
})

describe('ErrorBoundary', () => {
  it('renders the locked H1 + back-link to /', () => {
    render(<ErrorBoundary error={error} reset={() => {}} />)
    expect(
      screen.getByRole('heading', { level: 1, name: /something went wrong/i }),
    ).toBeInTheDocument()
    const back = screen.getByRole('link', { name: /back to \//i })
    expect(back).toHaveAttribute('href', '/')
  })

  it('does NOT surface the error message in the UI', () => {
    render(<ErrorBoundary error={error} reset={() => {}} />)
    expect(screen.queryByText(/something exploded/)).toBeNull()
  })

  it('Try again calls the provided reset', () => {
    const reset = vi.fn()
    render(<ErrorBoundary error={error} reset={reset} />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(reset).toHaveBeenCalledOnce()
  })
})
