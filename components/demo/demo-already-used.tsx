'use client'

import { Card, CardBody, CardHeader } from '@/design/primitives/card'
import { Button } from '@/design/primitives/button'

export function DemoAlreadyUsed() {
  return (
    <Card>
      <CardHeader>
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          demo &nbsp;·&nbsp; one per tab
        </p>
      </CardHeader>
      <CardBody className="flex flex-col gap-[var(--space-4)]">
        <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink)] max-w-[60ch]">
          You&rsquo;ve already run the demo in this tab. Sign in to run the
          real session with all four personas and downloadable artifacts.
        </p>
        <p className="font-[var(--font-serif)] italic text-[var(--text-xs)] text-[color:var(--ink-muted)]">
          (Or close this tab and open <code className="font-[var(--font-mono)] text-[color:var(--ink)]">/try</code> again to retry the demo — sessionStorage clears on tab close.)
        </p>
        <div>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              window.location.href = '/signin?next=/app'
            }}
          >
            Sign in to continue
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
