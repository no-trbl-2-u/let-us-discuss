'use client'

import type { Persona } from '@framework/schemas/persona'
import { monogramFor } from '@/lib/personas/monogram'
import { TurnBubble } from '@/design/primitives/turn-bubble'
import { Button } from '@/design/primitives/button'
import { cannedSession } from '@/lib/demo/canned-session'
import { DEMO_TURN_COUNT } from '@/lib/limits'

type Props = {
  persona: Persona
  revealIndex: number | null
  done: boolean
  onSkip: () => void
}

const moderatorIndex = DEMO_TURN_COUNT - 1

export function DemoTranscript({ persona, revealIndex, done, onSkip }: Props) {
  if (revealIndex === null && !done) return null

  const visibleCount = done ? DEMO_TURN_COUNT : (revealIndex ?? -1) + 1
  // Once `done`, every visible turn renders in its settled state.
  // While running, also render settled — the auto-advance reveals
  // turns one at a time, so each new bubble pops in fully formed;
  // the "thinking" affordance applies between reveals via the
  // surface rail, not per-bubble. Phase 7 wires real streaming via
  // the streaming prop.

  return (
    <section aria-label="Demo transcript" className="flex flex-col gap-[var(--space-3)]">
      <header className="flex items-end justify-between gap-[var(--space-4)]">
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          transcript &nbsp;·&nbsp; preview of shape (your real session responds to your pitch)
        </p>
        {!done && (
          <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
            Skip animation
          </Button>
        )}
      </header>
      <div className="flex flex-col">
        {cannedSession.turns.slice(0, visibleCount).map((turn, i) => {
          const isModerator = i === moderatorIndex
          const name = isModerator ? 'Boardroom' : persona.name
          const voice = isModerator ? 'wrap-up' : persona.voice
          const monogram = isModerator ? 'B' : monogramFor(persona.name)
          return (
            <TurnBubble
              key={i}
              name={name}
              voice={voice}
              monogram={monogram}
              register={isModerator ? 'moderator' : 'lead'}
              body={turn.body}
              replyingTo={turn.replyingTo}
            />
          )
        })}
      </div>
    </section>
  )
}
