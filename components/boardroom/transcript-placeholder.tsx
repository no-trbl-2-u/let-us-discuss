'use client'

import { Card, CardBody, CardHeader } from '@/design/primitives/card'

type Props = {
  visible: boolean
  excerpt: string
}

export function TranscriptPlaceholder({ visible, excerpt }: Props) {
  if (!visible) return null
  return (
    <Card className="mt-[var(--space-5)]">
      <CardHeader>
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          running &nbsp;·&nbsp; phase 7 wires this
        </p>
      </CardHeader>
      <CardBody>
        <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink)]">
          Session shipped in phase 7.
        </p>
        <p className="mt-[var(--space-3)] font-[var(--font-serif)] text-[var(--text-sm)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] italic">
          {excerpt}
        </p>
      </CardBody>
    </Card>
  )
}
