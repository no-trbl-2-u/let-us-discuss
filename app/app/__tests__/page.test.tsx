import type { Persona } from '@framework/schemas/persona'
import type { Template } from '@framework/schemas/template'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const personas: Persona[] = [
  {
    slug: 'product-lead',
    name: 'Product lead',
    role: 'lead',
    voice: 'concrete',
    lead: true,
    tools: [],
    summary: 'Drives clarity on what the user actually needs.',
    systemPrompt: 'a'.repeat(80),
  },
  {
    slug: 'skeptical-engineer',
    name: 'Skeptical engineer',
    role: 'specialist',
    voice: 'rigorous',
    lead: false,
    tools: [],
    summary: 'Pushes for proof and edge cases.',
    systemPrompt: 'a'.repeat(80),
  },
]

const template: Template = {
  slug: 'pitch-to-spec',
  name: 'Pitch to spec',
  description: 'desc',
  phases: [
    {
      id: 'clarify',
      name: 'Clarify',
      description: 'Lead personas circle once.',
      lead_round_max_questions: 4,
    },
  ],
  escalation: {
    exec_summary_checkpoint: true,
    convergence_min_agreement: 0.7,
    user_redirect_max: 2,
  },
}

vi.mock('@/lib/supabase/auth', () => ({
  requireUser: vi.fn().mockResolvedValue({ id: 'u-1', email: 'a@b.co' }),
}))

vi.mock('@/lib/auth/actions', () => ({
  signOutAction: vi.fn(),
}))

vi.mock('@/lib/personas/load', () => ({
  loadPersonas: () => personas,
}))

vi.mock('@/lib/templates/load', () => ({
  loadDefaultTemplate: () => template,
  DEFAULT_TEMPLATE_SLUG: 'pitch-to-spec',
}))

import AppHomePage from '@/app/app/page'

describe('/app boardroom page', () => {
  it('renders the page heading and sign-out form', async () => {
    const element = await AppHomePage()
    render(element as React.ReactElement)
    expect(
      screen.getByRole('heading', { level: 1, name: /staff a table/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /sign out/i }),
    ).toBeInTheDocument()
  })

  it('renders the boardroom surface (drop targets + persona shelf)', async () => {
    const element = await AppHomePage()
    render(element as React.ReactElement)
    expect(screen.getByLabelText(/persona shelf/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/seat 0 — empty/i)).toBeInTheDocument()
    expect(screen.getByText('Product lead')).toBeInTheDocument()
  })

  it('disables the Start session button while empty', async () => {
    const element = await AppHomePage()
    render(element as React.ReactElement)
    const button = screen.getByRole('button', { name: /start session/i })
    expect(button).toBeDisabled()
  })
})
