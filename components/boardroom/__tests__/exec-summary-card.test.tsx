import { ExecSummaryCard } from '@/components/boardroom/exec-summary-card'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

describe('ExecSummaryCard', () => {
  it('renders the summary text', () => {
    render(
      <ExecSummaryCard
        summary="The team converged on a single direction."
        onAccept={() => {}}
        onRedirect={() => {}}
      />,
    )
    expect(
      screen.getByText(/The team converged on a single direction/i),
    ).toBeInTheDocument()
  })

  it('calls onAccept when Accept is clicked', () => {
    const onAccept = vi.fn()
    render(
      <ExecSummaryCard summary="x" onAccept={onAccept} onRedirect={() => {}} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))
    expect(onAccept).toHaveBeenCalled()
  })

  it('opens the redirect textarea and submits with body', () => {
    const onRedirect = vi.fn()
    render(
      <ExecSummaryCard
        summary="x"
        onAccept={() => {}}
        onRedirect={onRedirect}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /redirect/i }))
    const textarea = screen.getByLabelText(/what should change/i)
    fireEvent.change(textarea, { target: { value: 'change the framing' } })
    fireEvent.click(screen.getByRole('button', { name: /send redirect/i }))
    expect(onRedirect).toHaveBeenCalledWith('change the framing')
  })
})
