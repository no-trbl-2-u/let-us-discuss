import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Persona } from '@framework/schemas/persona'

const personas: Persona[] = [
  {
    slug: 'product-lead',
    name: 'Product lead',
    role: 'lead',
    voice: 'Concrete, decisive.',
    lead: true,
    tools: [],
    summary: 'Drives clarity.',
    systemPrompt: 'You are the product lead. Plainspoken and terse.',
  },
  {
    slug: 'end-user-proxy',
    name: 'End-user proxy',
    role: 'specialist',
    voice: 'Plain, curious.',
    lead: false,
    tools: [],
    summary: 'Speaks for someone who landed cold.',
    systemPrompt: 'You are the end-user proxy. Ask questions more than you assert.',
  },
]

vi.mock('@/lib/personas/load', () => ({
  loadPersonas: () => personas,
}))

import PersonasPage from '@/app/about/personas/page'

describe('/about/personas page', () => {
  it('renders the heading + every persona name', () => {
    render(PersonasPage())
    expect(
      screen.getByRole('heading', { level: 1, name: /personas/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Product lead')).toBeInTheDocument()
    expect(screen.getByText('End-user proxy')).toBeInTheDocument()
  })

  it('renders a role tag for each persona', () => {
    render(PersonasPage())
    expect(screen.getAllByText(/lead/i, { selector: 'span' }).length).toBeGreaterThan(
      0,
    )
    expect(screen.getAllByText(/specialist/i, { selector: 'span' }).length).toBe(1)
  })

  it('keeps system-prompt details closed by default', () => {
    const { container } = render(PersonasPage())
    const detailsEls = container.querySelectorAll('details')
    expect(detailsEls.length).toBe(personas.length)
    for (const d of detailsEls) {
      expect(d).not.toHaveAttribute('open')
    }
  })

  it('does not render a Log-keeper section when no secretary persona is loaded', () => {
    // Pass-13 fix at issue #50: the page partitions conferring vs.
    // secretary personas into two groups. When the loaded library has
    // no secretary, the Log-keeper heading + helper line should not
    // appear (avoid a stub section above an empty list).
    render(PersonasPage())
    expect(
      screen.queryByRole('heading', { level: 2, name: /log-keeper/i }),
    ).toBeNull()
  })
})

describe('/about/personas page — with secretary in the cast', () => {
  // Separate describe so we can mock the loader with a secretary
  // persona without affecting the top-level case above.
  const personasWithSecretary: Persona[] = [
    {
      slug: 'product-lead',
      name: 'Product lead',
      role: 'lead',
      voice: 'Concrete, decisive.',
      lead: true,
      tools: [],
      summary: 'Drives clarity.',
      systemPrompt:
        'You are the product lead. Plainspoken and terse.',
    },
    {
      slug: 'secretary',
      name: 'Secretary',
      role: 'secretary',
      voice: 'Quiet, append-only.',
      lead: false,
      tools: [],
      summary: 'Keeps the log; auto-injected by the cast guard.',
      systemPrompt: 'You are the secretary at the boardroom table.',
      monogram: 'SC',
    },
  ]

  it('renders the Log-keeper heading + helper line when a secretary persona is loaded', async () => {
    vi.resetModules()
    vi.doMock('@/lib/personas/load', () => ({
      loadPersonas: () => personasWithSecretary,
    }))
    const Page = (await import('@/app/about/personas/page')).default
    render(Page())
    expect(
      screen.getByRole('heading', { level: 2, name: /log-keeper/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/you never seat the Secretary.*runs the log/i),
    ).toBeInTheDocument()
    // Both personas are still on the page (conferring + meta-role groups).
    expect(screen.getByText('Product lead')).toBeInTheDocument()
    expect(screen.getByText('Secretary')).toBeInTheDocument()
    vi.doUnmock('@/lib/personas/load')
  })
})
