import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  ESTIMATE_DISCLAIMER,
  UsageEstimate,
} from '@/components/boardroom/usage-estimate'
import { DEFAULT_MODEL } from '@/lib/anthropic/models'

describe('UsageEstimate', () => {
  it('renders the ESTIMATE eyebrow, a $ cost line, and the locked disclaimer', () => {
    render(<UsageEstimate model={DEFAULT_MODEL} />)
    expect(screen.getByText(/^estimate$/i)).toBeInTheDocument()
    expect(screen.getByText(/\$/)).toBeInTheDocument()
    expect(screen.getByText(ESTIMATE_DISCLAIMER)).toBeInTheDocument()
  })

  it('renders an — fallback for an unknown model', () => {
    render(<UsageEstimate model="made-up-model" />)
    expect(screen.getByText(/tokens · —/i)).toBeInTheDocument()
  })

  it('updates the displayed numbers when the model prop changes', () => {
    const { rerender } = render(<UsageEstimate model="claude-opus-4-7" />)
    const opusText = screen.getByText(/^~.*tokens · /i).textContent ?? ''
    rerender(<UsageEstimate model="claude-haiku-4-5-20251001" />)
    const haikuText = screen.getByText(/^~.*tokens · /i).textContent ?? ''
    expect(opusText).not.toBe(haikuText)
  })
})
