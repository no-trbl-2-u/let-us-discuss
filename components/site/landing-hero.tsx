import NextLink from 'next/link'
import { Heading } from '@/design/primitives/heading'
import { Link } from '@/design/primitives/link'
import { ANSWER_SHAPE_PHRASE } from '@/lib/site/voice-canon'

export const HERO_HEADLINE =
  'A short, opinionated meeting between AI personas — and you leave with a usable spec.'

export const HERO_SUBHEAD = `Drop a few personas onto the table, hand them your pitch, and let them confer. You answer ${ANSWER_SHAPE_PHRASE} at the checkpoints. They do the thinking.`

const NOTES = [
  {
    n: 'i.',
    t: 'Staff the table.',
    b: 'Drag two to four personas onto the table; a Secretary keeps the log. Each persona has a fixed voice and role — you don’t write prompts.',
  },
  {
    n: 'ii.',
    t: 'Hand over the pitch.',
    b: 'Paste a paragraph. The leads circle once with one-sentence clarifying questions. “I don’t know” is a valid answer.',
  },
  {
    n: 'iii.',
    t: 'Take the artifacts.',
    b: 'Personas confer, converge, and emit three files: a spec, an exec summary, and a list of out-of-scope call-outs.',
  },
] as const

export function LandingHero() {
  return (
    <div className="mx-auto max-w-[1040px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-7)] md:py-[var(--space-8)]">
      <section className="grid grid-cols-1 gap-[var(--space-6)] md:grid-cols-12 mb-[var(--space-8)]">
        <div className="md:col-span-8">
          <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-4)]">
            boardroom &nbsp;·&nbsp; v1
          </p>
          <Heading level={1} className="mb-[var(--space-5)]">
            {HERO_HEADLINE}
          </Heading>
          <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch] mb-[var(--space-6)]">
            {HERO_SUBHEAD}
          </p>
          <div className="flex flex-wrap items-center gap-[var(--space-4)]">
            <NextLink
              href="/try"
              className="inline-flex items-center justify-center gap-[var(--space-2)] h-[40px] px-[var(--space-5)] font-[var(--font-sans)] font-medium tracking-[var(--tracking-ui)] text-[var(--text-sm)] rounded-[var(--radius-sm)] bg-[color:var(--accent)] text-[color:var(--accent-ink)] shadow-[var(--shadow-resting)] hover:bg-[color:var(--accent-pressed)] active:translate-y-[1px] active:shadow-none transition-[background-color,color,box-shadow,transform] duration-[var(--t-lift)] ease-[var(--ease-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ring-offset)]"
            >
              Try a demo session
            </NextLink>
            <Link href="/about" variant="default">
              What is a boardroom session?
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="how-it-works"
        className="grid grid-cols-1 gap-[var(--space-6)] md:grid-cols-12"
      >
        <Heading
          level={4}
          eyebrow
          as="h2"
          id="how-it-works"
          className="md:col-span-12"
        >
          How a session runs
        </Heading>
        {NOTES.map((note) => (
          <article key={note.n} className="md:col-span-4">
            <span className="font-[var(--font-serif)] italic text-[var(--text-md)] text-[color:var(--ink-faint)]">
              {note.n}
            </span>
            <h3 className="mt-[var(--space-2)] mb-[var(--space-3)] font-[var(--font-serif)] font-semibold text-[var(--text-lg)] text-[color:var(--ink-strong)] leading-[var(--leading-heading)]">
              {note.t}
            </h3>
            <p className="font-[var(--font-serif)] text-[var(--text-sm)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)]">
              {note.b}
            </p>
          </article>
        ))}
      </section>
    </div>
  )
}
