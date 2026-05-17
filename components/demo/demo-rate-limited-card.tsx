'use client'

import { Card, CardBody, CardHeader } from '@/design/primitives/card'
import { Link } from '@/design/primitives/link'

type Props = {
  used: number
  limit: number
}

export function DemoRateLimitedCard({ used, limit }: Props) {
  return (
    <Card className="mt-[var(--space-5)]">
      <CardHeader>
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          demo &nbsp;·&nbsp; capped today
        </p>
      </CardHeader>
      <CardBody>
        <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink)]">
          The demo has been used {used}/{limit} times from this network today.
        </p>
        <p className="mt-[var(--space-3)] font-[var(--font-serif)] text-[var(--text-sm)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)]">
          <Link href="/signin?next=/app" variant="default">
            Sign in
          </Link>{' '}
          to run a full session — no IP cap when you're authed.
        </p>
      </CardBody>
    </Card>
  )
}
