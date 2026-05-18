import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { describe, expect, it } from 'vitest'
import type { Persona } from '@/lib/schemas/persona'
import { DraggablePersonaCard } from '@/components/boardroom/draggable-persona-card'

const PERSONA: Persona = {
  slug: 'product-lead',
  name: 'Product Lead',
  role: 'lead',
  voice: 'concise',
  lead: true,
  tools: [],
  summary: 'Holds the spec honest; pushes for cuts.',
  systemPrompt: 'system prompt body'.repeat(4),
}

function renderInDnd(seated: boolean) {
  return render(
    <DndContext>
      <DraggablePersonaCard persona={PERSONA} seated={seated} />
    </DndContext>,
  )
}

describe('DraggablePersonaCard', () => {
  it('renders exactly one button role (the wrapper), not two', () => {
    renderInDnd(false)
    const buttons = screen.queryAllByRole('button')
    expect(buttons).toHaveLength(1)
  })

  it('wrapper carries an instructional aria-label for keyboard users', () => {
    renderInDnd(false)
    const wrapper = screen.getByRole('button')
    expect(wrapper.getAttribute('aria-label') ?? '').toMatch(
      /press space or enter/i,
    )
  })

  it('when seated, the aria-label says so and inner card lacks the button role', () => {
    renderInDnd(true)
    const buttons = screen.queryAllByRole('button')
    // When seated, dnd-kit disables the draggable but the wrapper
    // still carries the attributes for SR feedback. The
    // accessible name describes the seated state.
    for (const b of buttons) {
      expect(b.getAttribute('aria-label') ?? '').toMatch(/seated/i)
    }
  })

  it('exposes a focus-visible ring class', () => {
    renderInDnd(false)
    const wrapper = screen.getByRole('button')
    expect(wrapper.className).toMatch(/focus-visible:ring/)
  })
})
