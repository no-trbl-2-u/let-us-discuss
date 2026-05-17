import type { Metadata } from 'next'
import { Heading } from '@/design/primitives/heading'
import { TryBoard } from '@/components/demo/try-board'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Try a boardroom demo — let-us-discuss',
  description:
    'One short, AI-free walkthrough of the boardroom session. No account; nothing saved.',
  robots: { index: true, follow: true },
}

export default function TryPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Try a boardroom demo',
    description:
      'One short, AI-free walkthrough of the boardroom session.',
  }

  return (
    <section className="mx-auto max-w-[1080px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-7)] md:py-[var(--space-8)]">
      <header className="mb-[var(--space-7)] max-w-[640px]">
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-3)]">
          boardroom &nbsp;·&nbsp; try the demo
        </p>
        <Heading level={1} className="mb-[var(--space-4)]">
          What a session looks like.
        </Heading>
        <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)]">
          One persona, three canned turns, three artifact tiles. Real
          sessions sign in.
        </p>
      </header>
      <TryBoard />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: schema JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  )
}
