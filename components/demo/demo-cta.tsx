'use client'

import { Card, CardBody } from '@/design/primitives/card'
import { Button } from '@/design/primitives/button'

export function DemoCTA() {
  return (
    <Card>
      <CardBody className="flex flex-col gap-[var(--space-3)] sm:flex-row sm:items-center sm:justify-between">
        <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink)] max-w-[60ch]">
          You&rsquo;ve seen the shape. Sign in to run yours with all four personas, real AI, and downloadable artifacts.
        </p>
        <Button
          type="button"
          variant="primary"
          onClick={() => {
            window.location.href = '/signin?next=/app'
          }}
        >
          Sign in to continue
        </Button>
      </CardBody>
    </Card>
  )
}
