'use client'

import { useDroppable } from '@dnd-kit/core'
import type { Persona } from '@/lib/schemas/persona'
import { cn } from '@/lib/cn'
import { monogramFor } from '@/lib/personas/monogram'
import { PersonaCard } from '@/design/primitives/persona-card'
import type { BoardState, BoardStateTag } from './types'

type Props = {
  boardState: BoardState
  personasBySlug: Map<string, Persona>
}

const TABLE_W = 880
const TABLE_H = 520
const RING_INSET_X = 110
const RING_INSET_Y = 90

function seatPositionPercent(t: number) {
  // Mirror the design primitive's ellipse math, expressed in percent so the
  // table can fluidly scale on mobile while seats stay anchored.
  const angle = -Math.PI / 2 + t * Math.PI * 2
  const a = TABLE_W / 2 - RING_INSET_X
  const b = TABLE_H / 2 - RING_INSET_Y
  const leftPx = TABLE_W / 2 + Math.cos(angle) * a
  const topPx = TABLE_H / 2 + Math.sin(angle) * b
  return {
    left: `${(leftPx / TABLE_W) * 100}%`,
    top: `${(topPx / TABLE_H) * 100}%`,
  }
}

function visualTagFor(tag: BoardStateTag): 'empty' | 'seated' | 'active' {
  if (tag === 'empty') return 'empty'
  if (tag === 'running') return 'active'
  return 'seated'
}

function DroppableSeat({
  seatId,
  persona,
  t,
}: {
  seatId: number
  persona: Persona | null
  t: number
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `seat:${seatId}`,
    data: { seatId },
  })
  const pos = seatPositionPercent(t)
  return (
    <div
      ref={setNodeRef}
      data-seat-id={seatId}
      data-occupied={Boolean(persona)}
      data-over={isOver || undefined}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: pos.left, top: pos.top }}
    >
      {persona ? (
        <PersonaCard
          draggable={false}
          state="staffed"
          name={persona.name}
          role={persona.role}
          voice={persona.voice}
          blurb={persona.summary}
          monogram={monogramFor(persona.name)}
          className="w-[160px] sm:w-[200px] md:w-[220px]"
        />
      ) : (
        <div
          aria-label={`Seat ${seatId} — empty`}
          className={cn(
            'w-[140px] sm:w-[180px] md:w-[220px]',
            'h-[80px] sm:h-[96px] md:h-[112px]',
            'rounded-[var(--radius-md)]',
            'border border-dashed border-[color:var(--paper-edge)]',
            'bg-transparent',
            'flex items-center justify-center',
            'font-[var(--font-mono)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-faint)]',
            'transition-colors duration-[var(--t-lift)]',
            isOver && 'border-[color:var(--accent)] text-[color:var(--accent)]',
          )}
        >
          seat {seatId}
        </div>
      )}
    </div>
  )
}

export function BoardroomSurface({ boardState, personasBySlug }: Props) {
  const visualState = visualTagFor(boardState.tag)

  return (
    <div
      data-state={visualState}
      className={cn(
        'relative mx-auto w-full max-w-[880px]',
        'aspect-[880/520]',
        'rounded-[var(--radius-lg)]',
        'bg-[color:var(--paper-sunken)]',
        'border border-[color:var(--paper-edge)]',
        'shadow-[inset_0_2px_4px_oklch(20%_0.01_60/0.05),inset_0_-1px_0_oklch(100%_0_0/0.4)]',
      )}
    >
      {visualState === 'active' && (
        <div
          aria-hidden
          className={cn(
            'absolute top-0 left-[var(--space-7)] right-[var(--space-7)] h-[3px]',
            'bg-[color:var(--accent-2)]',
            'rounded-b-[var(--radius-sm)]',
          )}
        />
      )}

      {visualState === 'empty' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--space-2)] pointer-events-none px-[var(--space-4)] text-center">
          <p className="font-[var(--font-serif)] italic text-[var(--text-md)] text-[color:var(--ink-muted)]">
            Drag a persona onto the table to staff a seat.
          </p>
          <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-faint)]">
            Two to six seats &nbsp;·&nbsp; one short session
          </p>
        </div>
      )}

      {boardState.seats.map((s) => {
        const persona = s.personaSlug
          ? personasBySlug.get(s.personaSlug) ?? null
          : null
        return (
          <DroppableSeat key={s.id} seatId={s.id} t={s.t} persona={persona} />
        )
      })}
    </div>
  )
}
