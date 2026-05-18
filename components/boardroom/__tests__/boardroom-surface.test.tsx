import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { describe, expect, it } from 'vitest'
import type { Persona } from '@/lib/schemas/persona'
import { BoardroomSurface } from '@/components/boardroom/boardroom-surface'
import { KEYBOARD_INSTRUCTIONS_ID } from '@/components/boardroom/keyboard-instructions'
import type { BoardState, SeatId } from '@/components/boardroom/types'

const PERSONA: Persona = {
  slug: 'product-lead',
  name: 'Product Lead',
  role: 'lead',
  voice: 'concise',
  lead: true,
  tools: [],
  summary: 'Drives clarity.',
  systemPrompt: 'x'.repeat(80),
}

function makeBoardState(seatedAt: number | null): BoardState {
  const seats = Array.from({ length: 6 }, (_, i) => ({
    id: i as SeatId,
    t: i / 6,
    personaSlug: i === seatedAt ? 'product-lead' : null,
  }))
  return {
    tag: seatedAt === null ? 'empty' : 'staffed',
    pitch: '',
    seats,
  }
}

describe('BoardroomSurface', () => {
  it('declares the region with aria-label and aria-describedby pointing at the kbd help', () => {
    render(
      <DndContext>
        <BoardroomSurface
          boardState={makeBoardState(null)}
          personasBySlug={new Map()}
        />
      </DndContext>,
    )
    const region = screen.getByRole('region', { name: /boardroom table/i })
    expect(region.getAttribute('aria-describedby')).toBe(
      KEYBOARD_INSTRUCTIONS_ID,
    )
  })

  it('every empty seat carries an aria-label of the form "Seat N — empty"', () => {
    render(
      <DndContext>
        <BoardroomSurface
          boardState={makeBoardState(null)}
          personasBySlug={new Map()}
        />
      </DndContext>,
    )
    for (let i = 0; i < 6; i++) {
      expect(
        screen.getByLabelText(new RegExp(`seat ${i} — empty`, 'i')),
      ).toBeInTheDocument()
    }
  })

  it('a staffed seat carries the persona name in the aria-label', () => {
    render(
      <DndContext>
        <BoardroomSurface
          boardState={makeBoardState(2)}
          personasBySlug={new Map([['product-lead', PERSONA]])}
        />
      </DndContext>,
    )
    expect(
      screen.getByLabelText(/seat 2 — product lead staffed/i),
    ).toBeInTheDocument()
  })
})
