'use client'

import { Button } from '@/design/primitives/button'

type Props = {
  disabled: boolean
  onStart: () => void
  templateFirstPhaseName: string
}

export function StartSessionButton({ disabled, onStart, templateFirstPhaseName }: Props) {
  return (
    <div className="flex items-center gap-[var(--space-4)]">
      <Button
        type="button"
        variant="primary"
        disabled={disabled}
        onClick={onStart}
      >
        Start session
      </Button>
      <span className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
        next: {templateFirstPhaseName}
      </span>
    </div>
  )
}
