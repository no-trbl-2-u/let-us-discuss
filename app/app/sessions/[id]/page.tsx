import { ArtifactPreviewGrid } from '@/components/boardroom/artifact-preview-grid'
import { StatusPill } from '@/components/sessions/status-pill'
import { Heading } from '@/design/primitives/heading'
import { Link } from '@/design/primitives/link'
import { loadSession } from '@/lib/sessions/queries'
import { requireUser } from '@/lib/supabase/auth'
import { createServerClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Session results — boardroom',
  robots: { index: false, follow: false },
}

export default async function SessionResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const supabase = await createServerClient()
  const session = await loadSession(supabase, user.id, id)
  if (!session) notFound()

  return (
    <section className="mx-auto max-w-[1080px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-6)] md:py-[var(--space-7)]">
      <header className="mb-[var(--space-6)] flex flex-col gap-[var(--space-3)]">
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          boardroom &nbsp;·&nbsp;{' '}
          <Link href="/app/sessions" variant="quiet">
            past sessions
          </Link>{' '}
          &nbsp;/&nbsp; results
        </p>
        <Heading level={1}>Session results.</Heading>
        <div className="flex items-baseline gap-[var(--space-4)]">
          <StatusPill status={session.status} />
          <span className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
            {session.createdAt.slice(0, 10)} &nbsp;·&nbsp;{' '}
            {session.totalTokens.toLocaleString()} tok &nbsp;·&nbsp;{' '}
            {session.turnCount} turns
          </span>
        </div>
      </header>

      <article className="mb-[var(--space-6)] font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink)]">
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-2)]">
          pitch
        </p>
        <p>{session.pitch}</p>
      </article>

      {session.artifact ? (
        <ArtifactPreviewGrid
          artifact={{
            specMd: session.artifact.specMd,
            execSummary: session.artifact.execSummary,
            callouts: session.artifact.callouts,
          }}
          tokensUsed={session.artifact.tokensUsed}
          sessionId={session.id}
        />
      ) : (
        <p className="mt-[var(--space-5)] font-[var(--font-serif)] italic text-[var(--text-md)] text-[color:var(--ink-muted)]">
          This session ended before producing artifacts.
        </p>
      )}

      <nav className="mt-[var(--space-7)] flex items-center gap-[var(--space-5)]">
        <Link href={`/app/sessions/${session.id}/transcript`} variant="default">
          View transcript →
        </Link>
        <Link href="/app/sessions" variant="quiet">
          ← Back to past sessions
        </Link>
      </nav>
    </section>
  )
}
