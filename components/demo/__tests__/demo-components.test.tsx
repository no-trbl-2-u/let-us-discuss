import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Persona } from '@framework/schemas/persona'
import { DemoShelf } from '@/components/demo/demo-shelf'
import { DemoSurface } from '@/components/demo/demo-surface'
import { DemoStartButton } from '@/components/demo/demo-start-button'
import { DemoTranscript } from '@/components/demo/demo-transcript'
import { DemoArtifactPreview } from '@/components/demo/demo-artifact-preview'
import { DemoCTA } from '@/components/demo/demo-cta'
import { DemoAlreadyUsed } from '@/components/demo/demo-already-used'
import { cannedSession } from '@/lib/demo/canned-session'
import { DEMO_TURN_COUNT } from '@/lib/limits'

const persona: Persona = {
  slug: 'product-lead',
  name: 'Product lead',
  role: 'lead',
  voice: 'concrete',
  lead: true,
  tools: [],
  summary: 'Drives clarity.',
  systemPrompt: 'a'.repeat(80),
}

describe('DemoShelf', () => {
  it('renders the eyebrow + sign-in CTA without duplicating the seated persona card', () => {
    render(<DemoShelf />)
    expect(screen.getByLabelText(/demo shelf/i)).toBeInTheDocument()
    // The shelf used to render a duplicate PersonaCard of the persona
    // already on the board (pass-4 critique [MED] "rendered twice").
    // It now carries only the context strip + sign-in pointer.
    expect(screen.queryByText(/^product lead$/i)).toBeNull()
    expect(
      screen.getByText(/product lead is already at the table/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /sign in/i }),
    ).toHaveAttribute('href', '/signin?next=/app')
  })
})

describe('DemoSurface', () => {
  it('renders 6 seats with seat 0 occupied and 1–5 locked', () => {
    const { container } = render(<DemoSurface persona={persona} tag="empty" />)
    expect(container.querySelector('[data-seat-id="0"][data-occupied]')).not.toBeNull()
    for (let i = 1; i < 6; i += 1) {
      const locked = container.querySelector(
        `[data-seat-id="${i}"][data-locked]`,
      )
      expect(locked).not.toBeNull()
    }
  })

  it('reflects state in data-state attribute', () => {
    const { container, rerender } = render(<DemoSurface persona={persona} tag="empty" />)
    expect(container.firstElementChild?.getAttribute('data-state')).toBe('seated')
    rerender(<DemoSurface persona={persona} tag="running" />)
    expect(container.firstElementChild?.getAttribute('data-state')).toBe('active')
  })
})

describe('DemoStartButton', () => {
  it('is disabled when not ready and enabled otherwise', () => {
    const onStart = vi.fn()
    const { rerender } = render(<DemoStartButton disabled onStart={onStart} />)
    expect(screen.getByRole('button', { name: /start demo/i })).toBeDisabled()
    rerender(<DemoStartButton disabled={false} onStart={onStart} />)
    fireEvent.click(screen.getByRole('button', { name: /start demo/i }))
    expect(onStart).toHaveBeenCalledOnce()
  })
})

describe('DemoTranscript', () => {
  it('renders nothing before the demo starts', () => {
    const { container } = render(
      <DemoTranscript persona={persona} revealIndex={null} done={false} onSkip={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders revealIndex+1 turns when running', () => {
    render(
      <DemoTranscript persona={persona} revealIndex={0} done={false} onSkip={() => {}} />,
    )
    // First turn body
    expect(
      screen.getByText(/quick clarifier/i),
    ).toBeInTheDocument()
    // Second turn body is NOT visible yet
    expect(
      screen.queryByText(/that means the spec leads with orientation/i),
    ).not.toBeInTheDocument()
  })

  it('renders all DEMO_TURN_COUNT turns when done', () => {
    render(
      <DemoTranscript persona={persona} revealIndex={null} done onSkip={() => {}} />,
    )
    expect(screen.getByText(/quick clarifier/i)).toBeInTheDocument()
    expect(
      screen.getByText(/that means the spec leads with orientation/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/boardroom suggests we wrap/i)).toBeInTheDocument()
    expect(cannedSession.turns).toHaveLength(DEMO_TURN_COUNT)
  })

  it('shows the Skip animation button while running, hides when done', () => {
    const { rerender } = render(
      <DemoTranscript persona={persona} revealIndex={0} done={false} onSkip={() => {}} />,
    )
    expect(screen.getByRole('button', { name: /skip animation/i })).toBeInTheDocument()
    rerender(
      <DemoTranscript persona={persona} revealIndex={null} done onSkip={() => {}} />,
    )
    expect(
      screen.queryByRole('button', { name: /skip animation/i }),
    ).not.toBeInTheDocument()
  })
})

describe('DemoArtifactPreview', () => {
  it('renders three artifacts, all with sign-in CTAs (no Download button)', () => {
    render(<DemoArtifactPreview />)
    // 3 tile titles in <h3>; each kind also surfaces in the eyebrow.
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
    const ctas = screen.getAllByRole('link', { name: /sign in to download/i })
    expect(ctas).toHaveLength(3)
    for (const cta of ctas) {
      expect(cta).toHaveAttribute('href', '/signin?next=/app')
    }
    expect(screen.queryByRole('button', { name: /^download$/i })).not.toBeInTheDocument()
  })
})

describe('DemoCTA', () => {
  it('renders the sign-in primary button', () => {
    render(<DemoCTA />)
    expect(
      screen.getByRole('button', { name: /sign in to continue/i }),
    ).toBeInTheDocument()
  })
})

describe('DemoAlreadyUsed', () => {
  it('renders the cap copy + sign-in CTA', () => {
    render(<DemoAlreadyUsed />)
    expect(screen.getByText(/already run the demo/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /sign in to continue/i }),
    ).toBeInTheDocument()
  })
})
