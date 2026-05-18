import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SessionLoading } from '@/components/sessions/session-loading'
import { TranscriptLoading } from '@/components/sessions/transcript-loading'

describe('SessionLoading', () => {
  it('renders three artifact-tile-shaped skeleton blocks + a header skeleton', () => {
    const { container } = render(<SessionLoading />)
    const blocks = container.querySelectorAll('[data-skeleton]')
    // header + sub-header + 3 tiles = 5
    expect(blocks.length).toBe(5)
  })

  it('exposes a "Loading session" landmark name', () => {
    render(<SessionLoading />)
    expect(
      screen.getByRole('region', { name: /loading session/i }),
    ).toBeInTheDocument()
  })
})

describe('TranscriptLoading', () => {
  it('renders three skeleton bubble shells + the page header skeleton', () => {
    const { container } = render(<TranscriptLoading />)
    const blocks = container.querySelectorAll('[data-skeleton]')
    // header + 3 bubbles × (gutter + 3 body lines) = 1 + 3*4 = 13
    expect(blocks.length).toBeGreaterThanOrEqual(10)
  })

  it('exposes a "Loading transcript" landmark name', () => {
    render(<TranscriptLoading />)
    expect(
      screen.getByRole('region', { name: /loading transcript/i }),
    ).toBeInTheDocument()
  })
})
