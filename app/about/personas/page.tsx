import type { Metadata } from 'next'
import { Heading } from '@/design/primitives/heading'
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
        boardroom &nbsp;·&nbsp; the starter shelf
      </p>
      <Heading level={1} className="mb-[var(--space-5)]">
        Personas
      </Heading>
      <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch] mb-[var(--space-7)]">
        A persona brings a fixed role and voice to the conversation. You
        staff a table by dragging the ones you want in. The starter
        library is these four; user-defined personas aren&apos;t shipped
        yet.
      </p>

      {personas.length === 0 ? (
        <p className="font-[var(--font-sans)] text-[var(--text-sm)] text-[color:var(--ink-muted)]">
          No personas yet — the v1 library ships in phase 4.
        </p>
      ) : (
        <ul role="list" className="flex flex-col gap-[var(--space-5)]">
          {personas.map((p) => (
            <li key={p.slug}>
              <PersonaCard persona={p} />
            </li>
          ))}
        </ul>
      )}

      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: schema JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  )
}
