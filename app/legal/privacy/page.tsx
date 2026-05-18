import type { Metadata } from 'next'
import { Heading } from '@/design/primitives/heading'
import { Link } from '@/design/primitives/link'
import { LegalSection } from '@/components/legal/legal-section'

export const metadata: Metadata = {
  title: 'Privacy — boardroom',
  description:
    "What boardroom stores, what gets deleted, and how to close your account.",
  openGraph: {
    title: 'Privacy — boardroom',
    description:
      "What boardroom stores, what gets deleted, and how to close your account.",
  },
  twitter: {
    title: 'Privacy — boardroom',
    description:
      "What boardroom stores, what gets deleted, and how to close your account.",
  },
}

export const LAST_UPDATED = '2026-05-18'

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-[760px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-7)] md:py-[var(--space-8)]">
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-4)]">
        boardroom &nbsp;·&nbsp; privacy
      </p>
      <Heading level={1} className="mb-[var(--space-5)]">
        Privacy.
      </Heading>
      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch]">
        Plain version: we keep your sessions while your account is open and
        delete them when you close it.
      </p>

      <LegalSection id="what-we-store" title="What we store">
        <p>
          Your email (for magic-link sign-in), the pitch you submit for each
          session, the persona-conferring transcript, and the three artifacts
          the session produces. Token-usage and cost-estimate rows for each
          session. Moderation-flag rows on any turn the AI pre-filter rejects
          (with the offending text, the verdict, and the timestamp).
        </p>
      </LegalSection>

      <LegalSection id="what-we-dont-store" title="What we don't store">
        <p>
          No tracking pixels, no third-party analytics, no advertising
          identifiers. We do not sell your data; we don&apos;t sell anything.
        </p>
      </LegalSection>

      <LegalSection id="ip-addresses" title="IP addresses">
        <p>
          For abuse-prevention only: we keep a one-way hash of the IP address
          attached to each session for 30 days, then delete it. The raw IP is
          never stored.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="Retention and deletion">
        <p>
          Sessions and artifacts are kept indefinitely while your account is
          active so you can re-download them. When you close your account,
          every session, transcript, artifact, moderation-flag row, and quota
          counter belonging to that account is deleted. An account-close
          affordance lives in your account settings (or email{' '}
          <span className="font-[var(--font-mono)] text-[var(--text-sm)]">
            hello@let-us-discuss.ai
          </span>{' '}
          to request it manually).
        </p>
      </LegalSection>

      <LegalSection id="moderation" title="Moderation">
        <p>
          Every pitch you submit and every persona reply is run through
          OpenAI&apos;s omni-moderation endpoint before it&apos;s shown back or
          saved. If it trips, the session halts with a polite refusal and we
          keep a row of what tripped, the verdict, and the timestamp — see{' '}
          <Link href="/legal/terms">Terms</Link> for what use is in-bounds.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies">
        <p>
          One first-party cookie carries your Supabase session after sign-in.
          No third-party cookies, no analytics cookies.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes">
        <p>
          Material changes to this page get an updated date below. The current
          page is always the live policy.
        </p>
      </LegalSection>

      <p className="mt-[var(--space-8)] font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
        Last updated: {LAST_UPDATED}
      </p>
    </section>
  )
}
