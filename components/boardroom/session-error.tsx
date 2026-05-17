'use client'

import { Button } from '@/design/primitives/button'
import { Card, CardBody, CardHeader } from '@/design/primitives/card'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { SessionError } from './use-session-state'

type Props = {
  error: SessionError
  onReset: () => void
}

export function SessionErrorCard({ error, onReset }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (error.code === 'auth') router.push('/signin?next=/app')
  }, [error.code, router])

  if (error.code === 'auth') return null

  const eyebrow = `session interrupted · ${error.code}`
  const body = bodyFor(error)
  return (
    <Card className="mt-[var(--space-5)]">
      <CardHeader>
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          {eyebrow}
        </p>
      </CardHeader>
      <CardBody>
        <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink)]">
          {body}
        </p>
        {error.message && error.code !== 'config' && (
          <p className="mt-[var(--space-3)] font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
            {error.message}
          </p>
        )}
        <div className="mt-[var(--space-5)]">
          <Button type="button" variant="secondary" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

function bodyFor(error: SessionError): string {
  switch (error.code) {
    case 'config':
      return 'The operator needs to set ANTHROPIC_API_KEY in the project env before sessions can run. Once that lands, retry from a fresh session.'
    case 'moderation':
      return 'The session was halted by the moderation gate. Try a different pitch or rephrase.'
    case 'internal':
      return 'Something broke mid-session. Reset and try again — if it keeps happening, the operator needs to look at the logs.'
    case 'budget':
      return 'The session wrapped early because the token budget was exhausted. The partial artifact is on the table.'
    case 'quota':
      return error.message.includes('limit reached')
        ? `${error.message}. Try again tomorrow, or hit Reset to free up the workspace.`
        : "You've hit today's session limit. Try again tomorrow, or hit Reset to free up the workspace."
    case 'not-implemented':
      return 'This path is not yet wired up.'
    default:
      return 'Session ended unexpectedly. Reset to start over.'
  }
}
