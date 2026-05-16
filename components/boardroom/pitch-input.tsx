'use client'

import { useId } from 'react'
import { cn } from '@/lib/cn'
import { MAX_PITCH_WORDS } from '@/lib/limits'
import { countWords } from './use-board-state'

type Props = {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}

export function PitchInput({ value, onChange, disabled }: Props) {
  const id = useId()
  const words = countWords(value)
  const percent = (words / MAX_PITCH_WORDS) * 100
  const softWarn = percent >= 90 && percent < 100
  const atCap = words >= MAX_PITCH_WORDS

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <label
        htmlFor={id}
        className="font-[var(--font-sans)] text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]"
      >
        Pitch
      </label>
      <textarea
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={atCap || undefined}
        aria-describedby={`${id}-counter`}
        rows={5}
        onChange={(event) => {
          const next = event.target.value
          if (countWords(next) > MAX_PITCH_WORDS) return
          onChange(next)
        }}
        placeholder="In a few sentences: what are you trying to ship, and for whom?"
        className={cn(
          'w-full min-h-[120px] px-[var(--space-4)] py-[var(--space-3)]',
          'bg-[color:var(--paper-sunken)] text-[color:var(--ink)]',
          'font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)]',
          'placeholder:text-[color:var(--ink-faint)]',
          'rounded-[var(--radius-sm)]',
          'border-b-2 border-[color:var(--ink-strong)]',
          'shadow-[inset_0_0_0_1px_var(--paper-edge)]',
          'outline-none resize-y',
          'transition-[border-color,background-color] duration-[var(--t-lift)]',
          'focus:bg-[color:var(--paper-raised)] focus:border-[color:var(--accent)]',
          atCap && 'border-[color:var(--signal-warning)]',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      />
      <p
        id={`${id}-counter`}
        className={cn(
          'font-[var(--font-sans)] text-[var(--text-2xs)] text-[color:var(--ink-muted)] flex justify-between',
          softWarn && 'text-[color:var(--ink)]',
          atCap && 'text-[color:var(--signal-warning)]',
        )}
      >
        <span>{atCap ? 'At cap — trim to continue.' : 'Aim for 1–3 short paragraphs.'}</span>
        <span data-counter>
          {words} / {MAX_PITCH_WORDS} words
        </span>
      </p>
    </div>
  )
}
