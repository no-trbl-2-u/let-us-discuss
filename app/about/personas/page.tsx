import type { Metadata } from 'next'
import { Heading } from '@/design/primitives/heading'
import { Link } from '@/design/primitives/link'
import { loadPersonas } from '@/lib/personas/load'
import { PersonaCard } from '@/components/personas/persona-card'

export const metadata: Metadata = {
  title: 'Personas — boardroom',
  description:
    'The starter persona library — who comes to the boardroom table.',
  openGraph: {
    title: 'Personas — boardroom',
    description:
      'The starter persona library — who comes to the boardroom table.',
  },
  twitter: {
    title: 'Personas — boardroom',
    description:
      'The starter persona library — who comes to the boardroom table.',
  },
}

export default function PersonasPage() {
  const personas = loadPersonas()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: personas.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Thing',
        name: p.name,
        description: p.summary,
      },
    })),
  }

  return (
    <section className="mx-auto max-w-[760px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-7)] md:py-[var(--space-8)]">
      <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] mb-[var(--space-4)]">
        boardroom &nbsp;·&nbsp;{' '}
        <Link href="/about" variant="quiet">
          about
        </Link>{' '}
        &nbsp;/&nbsp; personas
      </p>
      <Heading level={1} className="mb-[var(--space-5)]">
        Personas
      </Heading>
      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch] mb-[var(--space-7)]">
        A persona brings a fixed role and voice to the conversation.
        The starter library is four conferring personas plus a
        Secretary who keeps the log; you drag the ones you want onto
        the table. Authoring your own isn&apos;t in scope.
      </p>
      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch] mb-[var(--space-7)]">
        Each prompt opens with the same scaffold (
        <span className="font-[var(--font-mono)] text-[var(--text-sm)]">
          You are the [role] at the boardroom table.
        </span>
        ) by design — the voice descriptor above each card is the
        register the prompt body rides on after that first line.
      </p>

      {personas.length === 0 ? (
        <p className="font-[var(--font-sans)] text-[var(--text-sm)] text-[color:var(--ink-muted)]">
          No personas yet — the v1 library ships in phase 4.
        </p>
      ) : (
        <>
          <ul role="list" className="flex flex-col gap-[var(--space-5)]">
            {personas
              .filter((p) => p.role !== 'secretary')
              .map((p) => (
                <li key={p.slug}>
                  <PersonaCard persona={p} />
                </li>
              ))}
          </ul>
          {personas.some((p) => p.role === 'secretary') ? (
            <>
              <h2 className="mt-[var(--space-7)] mb-[var(--space-3)] font-[var(--font-serif)] font-semibold text-[var(--text-xl)] leading-[var(--leading-heading)] tracking-[var(--tracking-tight)] text-[color:var(--ink-strong)]">
                Log-keeper
              </h2>
              <p className="mb-[var(--space-5)] font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch]">
                Always at the table; you never seat the Secretary. It
                doesn&apos;t confer; it runs the log.
              </p>
              <ul
                role="list"
                className="flex flex-col gap-[var(--space-5)]"
              >
                {personas
                  .filter((p) => p.role === 'secretary')
                  .map((p) => (
                    <li key={p.slug}>
                      <PersonaCard persona={p} />
                    </li>
                  ))}
              </ul>
            </>
          ) : null}
        </>
      )}

      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: schema JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  )
}
