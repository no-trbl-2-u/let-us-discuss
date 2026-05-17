import { Card, CardBody } from '@/design/primitives/card'
import { Link } from '@/design/primitives/link'

export function SessionEmpty() {
  return (
    <Card className="mt-[var(--space-5)]">
      <CardBody>
        <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink)]">
          No sessions yet —{' '}
          <Link href="/app" variant="default">
            start one
          </Link>
          .
        </p>
      </CardBody>
    </Card>
  )
}
