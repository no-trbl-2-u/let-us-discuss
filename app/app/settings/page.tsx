import type { Metadata } from 'next'
import { AccountUsageSummary } from '@/components/settings/account-usage-summary'
import { SettingsSection } from '@/components/settings/settings-section'
import { Heading } from '@/design/primitives/heading'
import { Link } from '@/design/primitives/link'
import { logError } from '@/lib/observability/log'
import { createServerClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/supabase/auth'
import {
  type UsageWindow,
  type WindowSummary,
  getUserUsageSummary,
} from '@/lib/usage/summary'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Settings — boardroom',
  robots: { index: false, follow: false },
}

export default async function SettingsPage() {
  const user = await requireUser()
  const supabase = await createServerClient()
  let summary: Record<UsageWindow, WindowSummary> | null = null
  try {
    summary = await getUserUsageSummary(supabase, user.id)
  } catch (err) {
    logError('data', err, { loader: 'getUserUsageSummary' })
  }

  return (
    <section className="mx-auto max-w-[540px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-7)] md:py-[var(--space-8)]">
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-4)]">
        boardroom &nbsp;·&nbsp;{' '}
        <Link href="/app" variant="quiet">
          app
        </Link>{' '}
        &nbsp;/&nbsp; settings
      </p>
      <Heading level={1} className="mb-[var(--space-5)]">
        Settings.
      </Heading>

      {summary ? (
        <AccountUsageSummary summary={summary} />
      ) : (
        <p className="font-[var(--font-mono)] text-[var(--text-sm)] text-[color:var(--ink-muted)] mt-[var(--space-6)]">
          couldn&apos;t load usage — reload the page to retry
        </p>
      )}

      <SettingsSection
        title="Account"
        cta={
          <Link href="/app/settings/delete-account" variant="default">
            Delete account →
          </Link>
        }
      >
        <p>
          Close your account and delete every session, transcript, and
          artifact tied to it.
        </p>
      </SettingsSection>
    </section>
  )
}
