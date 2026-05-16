import type { Metadata } from 'next'
import { loadPersonas } from '@/lib/personas/load'
import { PersonaCard } from '@/components/personas/persona-card'

export const metadata: Metadata = {
  title: 'Personas — boardroom',
  description:
    'The v1 persona library — who comes to the boardroom table.',
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
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-sans text-3xl font-semibold tracking-tight">
        Personas
      </h1>
      <p className="mt-2 max-w-2xl font-serif text-lg text-ink/80">
        A curated v1 library. User-created personas land post-v1.
        Persona changes ship via PR — the table here is the
        canonical view.
      </p>

      {personas.length === 0 ? (
        <p className="mt-12 font-sans text-sm text-ink/70">
          No personas yet — the v1 library ships in phase 4.
        </p>
      ) : (
        <ul role="list" className="mt-10 space-y-6">
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
