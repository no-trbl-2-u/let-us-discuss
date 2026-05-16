'use client'

import type { Persona } from '@/lib/schemas/persona'
import { cn } from '@/lib/cn'
import { monogramFor } from '@/lib/personas/monogram'
import { PersonaCard } from '@/design/primitives/persona-card'
import type { DemoStateTag } from './types'

type Props = {
  persona: Persona
  tag: DemoStateTag
}

const TABLE_W = 880
const TABLE_H = 520
const RING_INSET_X = 110
const RING_INSET_Y = 90
const SEAT_COUNT = 6

function seatPositionPercent(t: number) {
  const angle = -Math.PI / 2 + t * Math.PI * 2
  const a = TABLE_W / 2 - RING_INSET_X
  const b = TABLE_H / 2 - RING_INSET_Y
  return {
    left: `${((TABLE_W / 2 + Math.cos(angle) * a) / TABLE_W) * 100}%`,
    top: `${((TABLE_H / 2 + Math.sin(angle) * b) / TABLE_H) * 100}%`,
  }
}

function visualFor(tag: DemoStateTag): 'empty' | 'seated' | 'active' {
  if (tag === 'running') return 'active'
  if (tag === 'done') return 'active'
  return 'seated'
}

export function DemoSurface({ persona, tag }: Props) {
  const visualState = visualFor(tag)
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
          className="absolute top-0 left-[var(--space-7)] right-[var(--space-7)] h-[3px] bg-[color:var(--accent-2)] rounded-b-[var(--radius-sm)]"
        />
      )}

      {Array.from({ length: SEAT_COUNT }, (_, id) => {
        const t = id / SEAT_COUNT
        const pos = seatPositionPercent(t)
        const isLead = id === 0
        return (
          <div
            key={id}
            data-seat-id={id}
            data-occupied={isLead || undefined}
            data-locked={!isLead || undefined}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: pos.left, top: pos.top }}
          >
            {isLead ? (
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
                aria-label={`Seat ${id} — demo locked`}
                className={cn(
                  'w-[140px] sm:w-[180px] md:w-[220px]',
                  'h-[80px] sm:h-[96px] md:h-[112px]',
                  'rounded-[var(--radius-md)]',
                  'border border-dashed border-[color:var(--paper-edge)]',
                  'bg-transparent opacity-50 cursor-not-allowed',
                  'flex flex-col items-center justify-center text-center',
                  'font-[var(--font-mono)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-faint)]',
                )}
              >
                <span>seat {id}</span>
                <span className="mt-[var(--space-1)] text-[var(--text-3xs)]">demo · locked</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
