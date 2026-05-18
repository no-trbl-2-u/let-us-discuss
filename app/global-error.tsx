'use client'

import { ErrorBoundary } from '@/components/site/error-boundary'

/**
 * Renders only when the root layout itself throws. Per Next.js
 * contract, this file replaces the layout entirely — it must
 * provide its own <html> + <body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary error={error} reset={reset} />
      </body>
    </html>
  )
}
