import type { Persona } from '@/lib/schemas/persona'
import { PersonaRoleTag } from './persona-role-tag'

export function PersonaCard({ persona }: { persona: Persona }) {
  return (
    <article
      id={persona.slug}
      className="rounded-lg border border-ink/10 bg-ink/[0.02] p-6"
    >
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-sans text-xl font-semibold tracking-tight">
          {persona.name}
        </h2>
        <PersonaRoleTag role={persona.role} />
      </header>
      <p className="mt-2 font-serif italic text-ink/70">{persona.voice}</p>
      <p className="mt-3 font-serif text-ink/90">{persona.summary}</p>
      <details className="mt-4 group">
        <summary className="cursor-pointer font-sans text-sm font-medium text-accent group-open:underline">
          System prompt
        </summary>
        <pre className="mt-3 max-h-[40rem] overflow-auto whitespace-pre-wrap rounded border border-ink/10 bg-paper p-4 font-mono text-xs leading-relaxed">
          {persona.systemPrompt}
        </pre>
      </details>
    </article>
  )
}
