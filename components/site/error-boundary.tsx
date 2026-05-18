'use client'

import { Heading } from '@/design/primitives/heading'
import { Link } from '@/design/primitives/link'
import { logError } from '@/lib/observability/log'
import { useEffect } from 'react'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Shared error-boundary composition. Consumed by both
 * app/error.tsx (route-segment boundary) and
 * app/global-error.tsx (root boundary that replaces the
 * layout itself).
 *
 * The error's message is NOT shown in the UI per the
 * locked decision in phase 17's brief — spec voice
 * doesn't include surfacing stack fragments. The error
 * is logged via logError so the operator can recover it
 * from Vercel's drain.
 */
export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    logError('client-boundary', error, {
      digest: error.digest ?? null,
    })
  }, [error])

  return (
    <section className="mx-auto max-w-[540px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-7)] md:py-[var(--space-8)]">
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-4)]">
        boardroom &nbsp;·&nbsp; something went wrong
      </p>
      <Heading level={1} className="mb-[var(--space-5)]">
        Something went wrong.
      </Heading>
      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] mb-[var(--space-7)]">
        The page hit an unexpected error. We logged it; you can try again,
        or head back to the landing page.
      </p>
      <div className="flex flex-wrap items-center gap-[var(--space-4)]">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center h-[40px] px-[var(--space-5)] font-[var(--font-sans)] font-medium tracking-[var(--tracking-ui)] text-[var(--text-sm)] rounded-[var(--radius-sm)] bg-[color:var(--accent)] text-[color:var(--accent-ink)] shadow-[var(--shadow-resting)] hover:bg-[color:var(--accent-pressed)] active:translate-y-[1px] active:shadow-none transition-[background-color,color,box-shadow,transform] duration-[var(--t-lift)] ease-[var(--ease-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ring-offset)]"
        >
          Try again
        </button>
        <Link href="/" variant="default">
          ← Back to /
        </Link>
      </div>
    </section>
  )
}
