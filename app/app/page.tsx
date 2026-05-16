import type { Metadata } from 'next'
import { Heading } from '@/design/primitives/heading'
import { Button } from '@/design/primitives/button'
import { Board } from '@/components/boardroom/board'
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
    <section className="mx-auto max-w-[1080px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-6)] md:py-[var(--space-7)]">
      <header className="flex items-end justify-between gap-[var(--space-4)] mb-[var(--space-6)]">
        <div>
          <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-2)]">
            boardroom &nbsp;·&nbsp; session
          </p>
          <Heading level={1}>Staff a table.</Heading>
        </div>
        <form action={signOutAction} className="shrink-0">
          <Button type="submit" variant="secondary" size="sm">
            Sign out
            <span className="hidden sm:inline font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)] ml-[var(--space-2)]">
              {user.email}
            </span>
          </Button>
        </form>
      </header>
      <Board />
    </section>
  )
}
