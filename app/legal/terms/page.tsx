import type { Metadata } from 'next'
import { Heading } from '@/design/primitives/heading'
import { Link } from '@/design/primitives/link'
import { LegalSection } from '@/components/legal/legal-section'

export const metadata: Metadata = {
  title: 'Terms — boardroom',
  description:
    'Acceptable use, moderation policy, and account-quota terms for boardroom.',
}

export const LAST_UPDATED = '2026-05-18'

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-[760px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-7)] md:py-[var(--space-8)]">
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-4)]">
        boardroom &nbsp;·&nbsp; terms
      </p>
      <Heading level={1} className="mb-[var(--space-5)]">
        Terms of use.
      </Heading>
      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch]">
        Plain version: you bring a pitch, the AI personas confer on it, you
        get three files. Don&apos;t try to grind the AI for something it
        refuses. Quotas exist.
      </p>

      <LegalSection id="who-can-use" title="Who can use boardroom">
        <p>
          Anyone can read these pages. Anyone with a working email can request
          a magic-link sign-in. The product is offered as-is to individual
          users; no enterprise agreements, no team accounts in v1.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="Acceptable use">
        <p>
          Use boardroom to spec real product ideas. Don&apos;t use it to
          generate prohibited content — the AI pre-filter will refuse, but
          please don&apos;t waste your time or ours probing it. Repeated abuse
          can lead to account closure.
        </p>
      </LegalSection>

      <LegalSection id="quotas" title="Quotas and limits">
        <p>
          Signed-in accounts get <strong>10 sessions per day</strong>.
          Anonymous demos (<Link href="/try">/try</Link>) are limited to{' '}
          <strong>3 per IP per day</strong>. Every session has a{' '}
          <strong>60,000-token cap</strong> — if the personas haven&apos;t
          converged by then, the session wraps gracefully and you keep
          whatever artifacts exist. These numbers may move in future releases;
          the current numbers are the live ones.
        </p>
      </LegalSection>

      <LegalSection id="moderation" title="Moderation refusals">
        <p>
          Inputs and persona outputs run through OpenAI&apos;s omni-moderation
          endpoint. Suspect verdicts halt the session with a polite refusal.
          We log what tripped (see{' '}
          <Link href="/legal/privacy#moderation">Privacy</Link>). We do not
          publish a list of disallowed topics — OpenAI&apos;s moderation
          taxonomy is the authority.
        </p>
      </LegalSection>

      <LegalSection id="no-warranty" title="No warranty">
        <p>
          Boardroom&apos;s output is AI-generated and may be wrong,
          inconsistent, or context-blind. Treat it as a draft. The service is
          provided &quot;as is&quot; without warranty of any kind.
        </p>
      </LegalSection>

      <LegalSection id="closure" title="Account closure">
        <p>
          You can close your account at any time; see{' '}
          <Link href="/legal/privacy#retention">Privacy</Link> for what gets
          deleted. We may close an account that repeatedly trips moderation
          refusals or attempts to bypass quota.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          Questions:{' '}
          <span className="font-[var(--font-mono)] text-[var(--text-sm)]">
            hello@let-us-discuss.ai
          </span>
          .
        </p>
      </LegalSection>

      <p className="mt-[var(--space-8)] font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
        Last updated: {LAST_UPDATED}
      </p>
    </section>
  )
}
