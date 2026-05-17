'use client'

import { Button } from '@/design/primitives/button'
import { Card, CardBody, CardHeader } from '@/design/primitives/card'
import { Input } from '@/design/primitives/input'
import { useState } from 'react'

type Question = { id: string; personaSlug: string; body: string }

type Props = {
  questions: Question[]
  onSubmit: (answer: string) => void
  disabled?: boolean
}

export function ClarifyPrompt({
  questions,
  onSubmit,
  disabled = false,
}: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setValue('')
  }

  return (
    <Card className="mt-[var(--space-5)]">
      <CardHeader>
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          clarify &nbsp;·&nbsp; your turn
        </p>
      </CardHeader>
      <CardBody>
        <ul className="mb-[var(--space-4)] space-y-[var(--space-2)] font-[var(--font-serif)] text-[var(--text-sm)] text-[color:var(--ink)]">
          {questions.map((q) => (
            <li key={q.id}>
              <span className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mr-[var(--space-2)]">
                {q.personaSlug}
              </span>
              {q.body}
            </li>
          ))}
        </ul>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-[var(--space-3)]"
        >
          <Input
            label="Answer"
            helper="One sentence is enough."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={disabled}
            autoFocus
            maxLength={500}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={disabled || value.trim().length === 0}
          >
            Send
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
