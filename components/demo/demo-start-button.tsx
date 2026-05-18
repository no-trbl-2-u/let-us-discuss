'use client'

import { Button } from '@/design/primitives/button'

type Props = {
  disabled: boolean
  onStart: () => void
}

export function DemoStartButton({ disabled, onStart }: Props) {
  return (
    <div className="flex flex-col items-start gap-[var(--space-3)]">
      <Button type="button" variant="primary" disabled={disabled} onClick={onStart}>
        Start demo
      </Button>
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
        3 turns &nbsp;·&nbsp; one persona &nbsp;·&nbsp; no AI calls
      </p>
    </div>
  )
}
