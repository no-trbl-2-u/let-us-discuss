import { SessionUsageFooter } from '@/components/sessions/session-usage-footer'
import { StatusPill } from '@/components/sessions/status-pill'
import { TranscriptView } from '@/components/sessions/transcript-view'
import { Heading } from '@/design/primitives/heading'
import { Link } from '@/design/primitives/link'
import { loadPersonas } from '@/lib/personas/load'
import { loadTranscript } from '@/lib/sessions/queries'
import { requireUser } from '@/lib/supabase/auth'
import { createServerClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Transcript — boardroom',
  robots: { index: false, follow: false },
}

export default async function SessionTranscriptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const supabase = await createServerClient()
  const session = await loadTranscript(supabase, user.id, id)
  if (!session) notFound()
  const personas = loadPersonas()

  return (
    <section className="mx-auto max-w-[1080px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-6)] md:py-[var(--space-7)]">
      <header className="mb-[var(--space-6)] flex flex-col gap-[var(--space-3)]">
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          boardroom &nbsp;·&nbsp;{' '}
          <Link href="/app/sessions" variant="quiet">
            past sessions
          </Link>{' '}
          &nbsp;/&nbsp;{' '}
          <Link href={`/app/sessions/${session.id}`} variant="quiet">
            results
          </Link>{' '}
          &nbsp;/&nbsp; transcript
        </p>
        <Heading level={1}>Transcript.</Heading>
        <div className="flex items-baseline gap-[var(--space-4)]">
          <StatusPill status={session.status} />
          <span className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
            {session.createdAt.slice(0, 10)} &nbsp;·&nbsp;{' '}
            {session.turns.length} turns
          </span>
        </div>
      </header>

      <article className="mb-[var(--space-6)] font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink)]">
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-2)]">
          pitch
        </p>
        <p>{session.pitch}</p>
      </article>

      <TranscriptView turns={session.turns} personas={personas} />

      <nav className="mt-[var(--space-7)]">
        <Link href={`/app/sessions/${session.id}`} variant="quiet">
          ← Back to results
        </Link>
      </nav>

      <SessionUsageFooter
        model={session.model}
        totalTokens={session.totalTokens}
        promptTokens={session.promptTokens}
        completionTokens={session.completionTokens}
        costCents={session.costCents}
      />
    </section>
  )
}
