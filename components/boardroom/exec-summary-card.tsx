'use client'

import { Button } from '@/design/primitives/button'
import { Card, CardBody, CardHeader } from '@/design/primitives/card'
import { useState } from 'react'

type Props = {
  summary: string
  onAccept: () => void
  onRedirect: (body: string) => void
  disabled?: boolean
}

export function ExecSummaryCard({
  summary,
  onAccept,
  onRedirect,
  disabled = false,
}: Props) {
  const [redirecting, setRedirecting] = useState(false)
  const [redirectBody, setRedirectBody] = useState('')

  function submitRedirect(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = redirectBody.trim()
    if (!trimmed) return
    onRedirect(trimmed)
    setRedirecting(false)
    setRedirectBody('')
  }

  return (
    <Card className="mt-[var(--space-5)]">
      <CardHeader>
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          executive summary &nbsp;·&nbsp; your turn
        </p>
      </CardHeader>
      <CardBody>
        <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink)] whitespace-pre-wrap">
          {summary}
        </p>
        {!redirecting ? (
          <div className="mt-[var(--space-5)] flex items-center gap-[var(--space-3)]">
            <Button
              type="button"
              variant="primary"
              onClick={onAccept}
              disabled={disabled}
            >
              Accept
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRedirecting(true)}
              disabled={disabled}
            >
              Redirect
            </Button>
          </div>
        ) : (
          <form
            onSubmit={submitRedirect}
            className="mt-[var(--space-5)] flex flex-col gap-[var(--space-3)]"
          >
            <label
              htmlFor="redirect-body"
              className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]"
            >
              What should change?
            </label>
            <textarea
              id="redirect-body"
              value={redirectBody}
              onChange={(e) => setRedirectBody(e.target.value)}
              rows={2}
              maxLength={500}
              disabled={disabled}
              className="bg-[color:var(--paper-sunken)] border-0 border-b border-[color:var(--ink-faint)] focus:border-[color:var(--accent)] focus:outline-none px-[var(--space-3)] py-[var(--space-2)] font-[var(--font-serif)] text-[var(--text-sm)] text-[color:var(--ink)] resize-none"
            />
            <div className="flex items-center gap-[var(--space-3)]">
              <Button
                type="submit"
                variant="primary"
                disabled={disabled || redirectBody.trim().length === 0}
              >
                Send redirect
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setRedirecting(false)
                  setRedirectBody('')
                }}
                disabled={disabled}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  )
}
