import { Card, CardBody } from '@/design/primitives/card'
import { Link } from '@/design/primitives/link'
import type { SessionListItem as Item } from '@/lib/sessions/queries'
import { StatusPill } from './status-pill'

type Props = {
  item: Item
}

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

export function SessionListItem({ item }: Props) {
  return (
    <Card>
      <CardBody>
        <header className="flex items-baseline justify-between gap-[var(--space-4)] mb-[var(--space-3)]">
          <StatusPill status={item.status} />
          <span className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
            {formatDate(item.createdAt)} &nbsp;·&nbsp;{' '}
            {item.totalTokens.toLocaleString()} tok
          </span>
        </header>
        <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink)] mb-[var(--space-4)]">
          {item.pitchExcerpt}
        </p>
        <Link href={`/app/sessions/${item.id}`} variant="default">
          Open results →
        </Link>
      </CardBody>
    </Card>
  )
}
