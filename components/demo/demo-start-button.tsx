'use client'

import { Button } from '@/design/primitives/button'

type Props = {
  disabled: boolean
  onStart: () => void
}

export function DemoStartButton({ disabled, onStart }: Props) {
  return (
    <div className="flex items-center gap-[var(--space-4)]">
      <Button type="button" variant="primary" disabled={disabled} onClick={onStart}>
        Start demo
      </Button>
      <span className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
        demo &nbsp;·&nbsp; 3 turns, one persona, no AI calls
      </span>
    </div>
  )
}
