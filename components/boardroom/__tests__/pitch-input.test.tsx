import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PitchInput } from '@/components/boardroom/pitch-input'

describe('PitchInput', () => {
  it('renders a word counter that updates on input', () => {
    const onChange = vi.fn()
    render(<PitchInput value="" onChange={onChange} />)
    const counter = screen.getByText(/0 \/ 600 words/i)
    expect(counter).toBeInTheDocument()
  })

  it('reflects the current word count for a populated value', () => {
    render(<PitchInput value="hello there world" onChange={() => {}} />)
    expect(screen.getByText(/3 \/ 600 words/i)).toBeInTheDocument()
  })

  it('marks the field aria-invalid when value is at cap', () => {
    const longPitch = Array.from({ length: 600 }, (_, i) => `w${i}`).join(' ')
    render(<PitchInput value={longPitch} onChange={() => {}} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('aria-invalid', 'true')
  })

  it('rejects inputs that would push beyond the cap', () => {
    const onChange = vi.fn()
    const atCap = Array.from({ length: 600 }, (_, i) => `w${i}`).join(' ')
    render(<PitchInput value={atCap} onChange={onChange} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: `${atCap} overflow` } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('honors a custom `max` prop in the counter and cap', () => {
    const onChange = vi.fn()
    render(<PitchInput value="hello there" onChange={onChange} max={100} />)
    expect(screen.getByText(/2 \/ 100 words/i)).toBeInTheDocument()

    const atCap = Array.from({ length: 100 }, (_, i) => `w${i}`).join(' ')
    const { rerender } = render(<PitchInput value={atCap} onChange={onChange} max={100} />)
    rerender(<PitchInput value={atCap} onChange={onChange} max={100} />)
    const textareas = screen.getAllByRole('textbox')
    const overCap = textareas[textareas.length - 1] as HTMLTextAreaElement
    fireEvent.change(overCap, { target: { value: `${atCap} overflow` } })
    expect(onChange).not.toHaveBeenCalled()
  })
})
