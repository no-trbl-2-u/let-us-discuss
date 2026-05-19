'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'

type RetroReviewItem = {
  id: string
  text: string
  seen_in_retros: number
}

type Props = {
  items: readonly RetroReviewItem[]
  onSubmit: (pickedIds: string[]) => void
}

function buttonLabel(picked: number): string {
  if (picked === 0) return 'Skip — pick none'
  if (picked === 1) return 'Pick 1'
  return `Pick ${picked}`
}

export function RetroReviewCheckpoint({ items, onSubmit }: Props) {
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit() {
    if (submitted) return
    setSubmitted(true)
    onSubmit(Array.from(picked))
  }

  return (
    <section
      aria-label="recent retros checkpoint"
      className="rounded-[var(--radius-md)] border border-[color:var(--paper-edge)] bg-[color:var(--paper-raised)] p-[var(--space-5)]"
    >
      <header className="mb-[var(--space-4)] flex flex-col gap-[var(--space-2)]">
        <span className="font-[var(--font-mono)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          recent retros
        </span>
        <h2 className="font-[var(--font-serif)] font-semibold text-[var(--text-lg)] leading-[var(--leading-heading)] text-[color:var(--ink-strong)]">
          Pick zero or more to address this session
        </h2>
      </header>

      <ul className="flex flex-col gap-[var(--space-3)]">
        {items.map((item) => {
          const isPicked = picked.has(item.id)
          return (
            <li key={item.id}>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-[var(--space-3)]',
                  'rounded-[var(--radius-sm)] border border-transparent',
                  'px-[var(--space-2)] py-[var(--space-2)]',
                  'hover:bg-[color:var(--paper)]',
                  isPicked &&
                    'border-[color:var(--paper-edge)] bg-[color:var(--paper)]',
                )}
              >
                <input
                  type="checkbox"
                  checked={isPicked}
                  onChange={() => toggle(item.id)}
                  disabled={submitted}
                  className="mt-[3px] h-[14px] w-[14px] accent-[color:var(--accent)]"
                />
                <span className="flex flex-1 flex-col gap-[2px]">
                  <span className="font-[var(--font-serif)] text-[var(--text-sm)] leading-[var(--leading-prose)] text-[color:var(--ink)]">
                    {item.text}
                  </span>
                  <span className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-faint)]">
                    {item.seen_in_retros} of last {items.length} sessions
                  </span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      <footer className="mt-[var(--space-5)] flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitted}
          className={cn(
            'inline-flex items-center gap-[var(--space-2)]',
            'h-[36px] px-[var(--space-4)]',
            'font-[var(--font-sans)] text-[var(--text-sm)] font-medium tracking-[var(--tracking-ui)]',
            'rounded-[var(--radius-sm)]',
            'border border-[color:var(--paper-edge)]',
            'text-[color:var(--ink)] bg-[color:var(--paper)]',
            'hover:bg-[color:var(--paper-sunken)] hover:border-[color:var(--ink-faint)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-[var(--t-lift)]',
          )}
        >
          {buttonLabel(picked.size)}
        </button>
      </footer>
    </section>
  )
}
