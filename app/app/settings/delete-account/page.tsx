import type { Metadata } from 'next'
import { Heading } from '@/design/primitives/heading'
import { Link } from '@/design/primitives/link'
import { DeleteAccountForm } from '@/components/settings/delete-account-form'
import { requireUser } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Delete account — boardroom',
  robots: { index: false, follow: false },
}

export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  await requireUser()
  const { error } = await searchParams

  return (
    <section className="mx-auto max-w-[540px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-7)] md:py-[var(--space-8)]">
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-4)]">
        boardroom &nbsp;·&nbsp;{' '}
        <Link href="/app/settings" variant="quiet">
          settings
        </Link>{' '}
        &nbsp;/&nbsp; delete account
      </p>
      <Heading level={1} className="mb-[var(--space-5)]">
        Delete account.
      </Heading>

      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch]">
        Closing your account permanently deletes every session, transcript,
        and downloadable artifact tied to it, along with the moderation-flag
        log and your daily session quota counter. This is immediate and
        cannot be undone.
      </p>

      <p className="mt-[var(--space-4)] font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch]">
        Your email is removed from the boardroom account table; you can sign
        up again later with the same address, but you won&apos;t see any of
        the sessions above.
      </p>

      <DeleteAccountForm initialError={error} />
    </section>
  )
}
