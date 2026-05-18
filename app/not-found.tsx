import type { Metadata } from 'next'
import { Heading } from '@/design/primitives/heading'
import { Link } from '@/design/primitives/link'

export const metadata: Metadata = {
  title: 'Not found — boardroom',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <section className="mx-auto max-w-[540px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-7)] md:py-[var(--space-8)]">
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-4)]">
        boardroom &nbsp;·&nbsp; not found
      </p>
      <Heading level={1} className="mb-[var(--space-5)]">
        Not found.
      </Heading>
      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] mb-[var(--space-7)]">
        That URL doesn&apos;t lead anywhere on boardroom. Head back to the
        landing page or try one of the entry points below.
      </p>
      <ul className="flex flex-col gap-[var(--space-3)] font-[var(--font-serif)] text-[var(--text-md)]">
        <li>
          <Link href="/">Go to the landing page →</Link>
        </li>
        <li>
          <Link href="/try">Run an anonymous demo</Link>
        </li>
        <li>
          <Link href="/about">Read about boardroom</Link>
        </li>
      </ul>
    </section>
  )
}
