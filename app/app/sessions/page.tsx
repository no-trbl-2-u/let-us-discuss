import { SessionList } from '@/components/sessions/session-list'
import { Heading } from '@/design/primitives/heading'
import { listSessions } from '@/lib/sessions/queries'
import { requireUser } from '@/lib/supabase/auth'
import { createServerClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Past sessions — boardroom',
  robots: { index: false, follow: false },
}

export default async function PastSessionsPage() {
  const user = await requireUser()
  const supabase = await createServerClient()
  const items = await listSessions(supabase, user.id)

  return (
    <section className="mx-auto max-w-[1080px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-6)] md:py-[var(--space-7)]">
      <header className="mb-[var(--space-6)]">
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-2)]">
          boardroom &nbsp;·&nbsp; past sessions
        </p>
        <Heading level={1}>Past sessions.</Heading>
      </header>
      <SessionList items={items} />
    </section>
  )
}
