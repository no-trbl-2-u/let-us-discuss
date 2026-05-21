import type { Metadata } from 'next'
import { ByokPanel } from '@/components/settings/byok-panel'
import { Heading } from '@/design/primitives/heading'
import { Link } from '@/design/primitives/link'
import { getMasterKey } from '@/lib/byok/master-key'
import { loadKeyMeta, loadRecentAudit } from '@/lib/byok/repo'
import type { AuditEvent, KeyMeta } from '@/lib/byok/repo'
import { logError } from '@/lib/observability/log'
import { requireUser } from '@/lib/supabase/auth'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'API key — boardroom',
  robots: { index: false, follow: false },
}

export default async function ApiKeyPage() {
  const user = await requireUser()
  const masterUnset = getMasterKey() === null

  let meta: KeyMeta | null = null
  let audit: AuditEvent[] = []

  if (!masterUnset) {
    const supabase = await createServerClient()
    try {
      meta = await loadKeyMeta(supabase, user.id)
    } catch (err) {
      // Table may not exist yet (operator hasn't run the migration);
      // treat that as "no key on file" so the panel still renders.
      logError('byok', err, { loader: 'loadKeyMeta' })
    }
    try {
      audit = await loadRecentAudit(supabase, user.id, 5)
    } catch (err) {
      logError('byok', err, { loader: 'loadRecentAudit' })
    }
  }

  return (
    <section className="mx-auto max-w-[540px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-7)] md:py-[var(--space-8)]">
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-4)]">
        boardroom &nbsp;·&nbsp;{' '}
        <Link href="/app/settings" variant="quiet">
          settings
        </Link>{' '}
        &nbsp;/&nbsp; api key
      </p>
      <Heading level={1} className="mb-[var(--space-5)]">
        API key.
      </Heading>

      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch]">
        Bring your own Anthropic API key. When set, every boardroom
        session on this account uses it; Anthropic bills you directly.
        The key is encrypted at rest and never logged.
      </p>

      <ByokPanel initialMeta={meta} audit={audit} disabled={masterUnset} />
    </section>
  )
}
