import type { Metadata } from 'next'
import { Heading } from '@/design/primitives/heading'
import { Button } from '@/design/primitives/button'
import { signOutAction } from '@/lib/auth/actions'
import { requireUser } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Boardroom — session',
  robots: { index: false, follow: false },
}

export default async function AppHomePage() {
  const user = await requireUser()

  return (
    <section className="mx-auto max-w-[760px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-7)] md:py-[var(--space-8)]">
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-4)]">
        boardroom &nbsp;·&nbsp; session
      </p>
      <Heading level={1} className="mb-[var(--space-5)]">
        Welcome to the boardroom.
      </Heading>
      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] mb-[var(--space-6)]">
        Signed in as{' '}
        <span className="font-[var(--font-mono)] text-[var(--text-sm)] text-[color:var(--ink)]">
          {user.email}
        </span>
        . The drag-and-drop board ships in phase 5; this is the
        authenticated landing while the session orchestrator follows.
      </p>
      <form action={signOutAction}>
        <Button type="submit" variant="secondary">
          Sign out
        </Button>
      </form>
    </section>
  )
}
