'use client'

import { Button } from '@/design/primitives/button'
import { Card, CardBody, CardHeader } from '@/design/primitives/card'

type Props = {
  onReset: () => void
}

export function NotImplementedCard({ onReset }: Props) {
  return (
    <Card className="mt-[var(--space-5)]">
      <CardHeader>
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          running &nbsp;·&nbsp; phase 7b lights this up
        </p>
      </CardHeader>
      <CardBody>
        <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink)]">
          Real sessions ship in phase 7b. Until then this button walks the wire
          end-to-end against the new /api/sessions route.
        </p>
        <p className="mt-[var(--space-3)] font-[var(--font-serif)] text-[var(--text-sm)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] italic">
          The session was recorded in the database with status
          &quot;aborted&quot; — your pitch and seating did make a round trip.
        </p>
        <div className="mt-[var(--space-5)]">
          <Button type="button" variant="secondary" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
