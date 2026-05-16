import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Persona } from '@/lib/schemas/persona'

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
})
