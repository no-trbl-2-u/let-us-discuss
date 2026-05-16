import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StartSessionButton } from '@/components/boardroom/start-session-button'

describe('StartSessionButton', () => {
  it('is disabled when not ready', () => {
    render(
      <StartSessionButton disabled onStart={() => {}} templateFirstPhaseName="Clarify" />,
    )
    expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()
  })

  it('is enabled and fires onStart when ready', () => {
    const onStart = vi.fn()
    render(
      <StartSessionButton
        disabled={false}
        onStart={onStart}
        templateFirstPhaseName="Clarify"
      />,
    )
    const button = screen.getByRole('button', { name: /start session/i })
    expect(button).not.toBeDisabled()
    fireEvent.click(button)
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('renders the template first-phase hint', () => {
    render(
      <StartSessionButton
        disabled
        onStart={() => {}}
        templateFirstPhaseName="Clarify"
      />,
    )
    expect(screen.getByText(/next: Clarify/i)).toBeInTheDocument()
  })
})
