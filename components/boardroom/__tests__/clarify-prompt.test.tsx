import { ClarifyPrompt } from '@/components/boardroom/clarify-prompt'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

describe('ClarifyPrompt', () => {
  const questions = [
    { id: 'q1', personaSlug: 'lead-a', body: 'What is the audience?' },
  ]

  it('renders the questions list', () => {
    render(<ClarifyPrompt questions={questions} onSubmit={() => {}} />)
    expect(screen.getByText(/What is the audience/i)).toBeInTheDocument()
  })

  it('blocks empty submissions', () => {
    const onSubmit = vi.fn()
    render(<ClarifyPrompt questions={questions} onSubmit={onSubmit} />)
    const submit = screen.getByRole('button', { name: /send/i })
    expect(submit).toBeDisabled()
  })

  it('calls onSubmit with the trimmed answer', () => {
    const onSubmit = vi.fn()
    render(<ClarifyPrompt questions={questions} onSubmit={onSubmit} />)
    const input = screen.getByLabelText(/answer/i)
    fireEvent.change(input, { target: { value: '  product managers  ' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(onSubmit).toHaveBeenCalledWith('product managers')
  })
})
