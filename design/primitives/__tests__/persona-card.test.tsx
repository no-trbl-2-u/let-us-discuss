import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PersonaCard } from '@/design/primitives/persona-card'

describe('PersonaCard primitive', () => {
  it('emits a "<role>: <name> (seated)" aria-label on staffed cards', () => {
    render(
      <PersonaCard
        name="Product Lead"
        role="lead"
        voice="concise"
        blurb="Holds the spec honest."
        monogram="PL"
        state="staffed"
        draggable={false}
      />,
    )
    expect(
      screen.getByLabelText('lead: Product Lead (seated)'),
    ).toBeInTheDocument()
  })

  it('emits a "<role>: <name>" aria-label on non-draggable resting cards', () => {
    render(
      <PersonaCard
        name="End-user Proxy"
        role="specialist"
        voice="plain"
        blurb="Speaks for someone who landed cold."
        monogram="EP"
        state="resting"
        draggable={false}
      />,
    )
    expect(
      screen.getByLabelText('specialist: End-user Proxy'),
    ).toBeInTheDocument()
  })

  it('lets the caller override aria-label', () => {
    render(
      <PersonaCard
        name="Product Lead"
        role="lead"
        voice="concise"
        blurb="x"
        monogram="PL"
        state="resting"
        draggable={false}
        aria-label="custom label"
      />,
    )
    expect(screen.getByLabelText('custom label')).toBeInTheDocument()
  })

  it('a draggable card has role=button and no default aria-label', () => {
    render(
      <PersonaCard
        name="Product Lead"
        role="lead"
        voice="concise"
        blurb="x"
        monogram="PL"
        state="resting"
        draggable={true}
      />,
    )
    const article = screen.getByRole('button')
    expect(article.getAttribute('aria-label')).toBeNull()
  })
})
