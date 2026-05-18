'use client'

import { useSearchParams } from 'next/navigation'

/**
 * Reads the `?account=deleted` query param the
 * deleteAccountAction redirects to on success and renders a
 * small in-voice mono paragraph. Empty render otherwise.
 * Auto-dismisses on next navigation because the query param
 * is gone from the URL.
 */
export function LandingDeletedBanner() {
  const params = useSearchParams()
  if (params.get('account') !== 'deleted') return null
  return (
    <div className="mx-auto max-w-[1040px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] pt-[var(--space-5)]">
      <p
        role="status"
        className="font-[var(--font-mono)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] border-l-2 border-[color:var(--accent)] pl-[var(--space-4)] py-[var(--space-2)]"
      >
        Your account was deleted.
      </p>
    </div>
  )
}
