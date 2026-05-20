'use client'

import { useId } from 'react'
import {
  AVAILABLE_MODELS,
  MODEL_LABELS,
  modelBlurb,
  modelLabel,
} from '@/lib/anthropic/models'

type Props = {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}

export function ModelPicker({ value, onChange, disabled = false }: Props) {
  const selectId = useId()
  const blurbId = useId()
  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <label
        htmlFor={selectId}
        className="font-[var(--font-mono)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]"
      >
        Model
      </label>
      <select
        id={selectId}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={blurbId}
        className="font-[var(--font-mono)] text-[var(--text-sm)] text-[color:var(--ink-strong)] bg-[color:var(--paper-raised)] border border-[color:var(--paper-edge)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] disabled:opacity-60"
      >
        {AVAILABLE_MODELS.map((model) => (
          <option key={model} value={model}>
            {MODEL_LABELS[model] ?? model}
          </option>
        ))}
      </select>
      <p
        id={blurbId}
        className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]"
      >
        {modelBlurb(value) || modelLabel(value)}
      </p>
    </div>
  )
}
