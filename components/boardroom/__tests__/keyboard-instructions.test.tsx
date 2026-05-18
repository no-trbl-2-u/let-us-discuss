import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  KEYBOARD_INSTRUCTIONS_ID,
  KEYBOARD_INSTRUCTIONS_TEXT,
  KeyboardInstructions,
} from '@/components/boardroom/keyboard-instructions'

describe('KeyboardInstructions', () => {
  it('renders the locked SR procedure text', () => {
    render(<KeyboardInstructions />)
    expect(screen.getByText(KEYBOARD_INSTRUCTIONS_TEXT)).toBeInTheDocument()
  })

  it('exposes a stable id for aria-describedby', () => {
    const { container } = render(<KeyboardInstructions />)
    const el = container.querySelector(`#${KEYBOARD_INSTRUCTIONS_ID}`)
    expect(el).not.toBeNull()
  })

  it('is visually hidden by default', () => {
    const { container } = render(<KeyboardInstructions />)
    const el = container.querySelector(`#${KEYBOARD_INSTRUCTIONS_ID}`)
    expect(el?.className).toMatch(/w-px/)
    expect(el?.className).toMatch(/overflow-hidden/)
  })
})
