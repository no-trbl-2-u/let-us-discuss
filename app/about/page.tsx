import type { Metadata } from 'next'
import { Heading } from '@/design/primitives/heading'
import { Link } from '@/design/primitives/link'

export const metadata: Metadata = {
  title: 'About boardroom — boardroom',
  description: "What boardroom is, what it isn't, and who it's for.",
  openGraph: {
    title: 'About boardroom',
    description: "What boardroom is, what it isn't, and who it's for.",
  },
  twitter: {
    title: 'About boardroom',
    description: "What boardroom is, what it isn't, and who it's for.",
  },
}

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-[760px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-7)] md:py-[var(--space-8)]">
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-4)]">
        boardroom &nbsp;·&nbsp; about
      </p>
      <Heading level={1} className="mb-[var(--space-5)]">
        About boardroom.
      </Heading>
      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch] mb-[var(--space-7)]">
        Boardroom turns a loose pitch into a usable spec by running a short,
        opinionated conversation between AI personas you staff onto a
        board-room table. You drag personas, hand over a pitch, and answer
        one-word questions at the checkpoints. The personas do the thinking.
      </p>

      <Heading level={2} className="mt-[var(--space-6)] mb-[var(--space-3)]">
        Who it&apos;s for.
      </Heading>
      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch]">
        Solo builders, indie devs, and early-stage PMs who have an idea but no
        spec. If you&apos;ve bounced off hand-rolling prompts and personas in a
        single chat thread, this is the shortcut.
      </p>

      <Heading level={2} className="mt-[var(--space-6)] mb-[var(--space-3)]">
        What you get.
      </Heading>
      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch]">
        Three artifacts at the end of every session: a{' '}
        <code className="font-[var(--font-mono)] text-[var(--text-sm)]">
          spec.md
        </code>
        , a one-page exec summary, and a list of out-of-scope call-outs the
        personas surfaced but deliberately deferred. Download them as Markdown.
      </p>

      <Heading level={2} className="mt-[var(--space-6)] mb-[var(--space-3)]">
        What it isn&apos;t.
      </Heading>
      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch]">
        Boardroom isn&apos;t a generic chat. It isn&apos;t a place to author
        personas or templates — the v1 library is curated. It isn&apos;t a
        multi-user surface; sessions are single-user only.
      </p>

      <Heading level={2} className="mt-[var(--space-6)] mb-[var(--space-3)]">
        Try it.
      </Heading>
      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch]">
        <Link href="/try">Run an anonymous demo</Link> — no sign-in needed.{' '}
        <Link href="/signin">Sign in</Link> to run full sessions and keep your
        artifacts. The <Link href="/about/personas">persona library</Link>{' '}
        has the full v1 set.
      </p>
    </section>
  )
}
