import type { Persona } from '@framework/schemas/persona'
import { cn } from '@/lib/cn'
import { monogramFor } from '@/lib/personas/monogram'

export function PersonaCard({ persona }: { persona: Persona }) {
  const isLead = persona.role === 'lead'

  return (
    <article
      id={persona.slug}
      className={cn(
        'relative bg-[color:var(--paper-raised)] text-[color:var(--ink)]',
        'border border-[color:var(--paper-edge)] rounded-[var(--radius-md)]',
        'shadow-[var(--shadow-resting)]',
        'p-[var(--space-5)]',
      )}
    >
      <header className="flex items-center gap-[var(--space-3)]">
        <span
          aria-hidden
          className={cn(
            'w-[44px] h-[44px] inline-flex items-center justify-center',
            'bg-[color:var(--paper-sunken)] text-[color:var(--ink-strong)]',
            'font-[var(--font-serif)] italic font-semibold text-[var(--text-md)]',
            'rounded-[var(--radius-sm)]',
            'shadow-[inset_0_1px_2px_oklch(0%_0_0_/_0.08),inset_0_-1px_0_oklch(100%_0_0_/_0.6)]',
          )}
        >
          {monogramFor(persona)}
        </span>
        <div className="flex flex-col leading-tight">
          <h2 className="font-[var(--font-serif)] font-semibold text-[var(--text-lg)] tracking-[var(--tracking-tight)] text-[color:var(--ink-strong)]">
            {persona.name}
          </h2>
          <span className="font-[var(--font-sans)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
            <span
              className={cn(
                'inline-flex items-center rounded-[var(--radius-sm)] px-[var(--space-2)] py-[1px] mr-[var(--space-2)]',
                'font-medium uppercase tracking-[var(--tracking-caps)]',
                isLead
                  ? 'bg-[color:var(--accent-tint)] text-[color:var(--accent)]'
                  : 'bg-[color:var(--paper-sunken)] text-[color:var(--ink-muted)]',
              )}
            >
              {persona.role}
            </span>
            <span className="italic">{persona.voice}</span>
          </span>
        </div>
      </header>

      <p className="mt-[var(--space-4)] font-[var(--font-serif)] text-[var(--text-base)] leading-[var(--leading-prose)] text-[color:var(--ink)]">
        {persona.summary}
      </p>

      <details className="mt-[var(--space-4)] group">
        <summary className="cursor-pointer font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]">
          System prompt
        </summary>
        <pre className="mt-[var(--space-3)] max-h-[40rem] overflow-auto whitespace-pre-wrap rounded-[var(--radius-sm)] border border-[color:var(--paper-edge)] bg-[color:var(--paper-sunken)] p-[var(--space-4)] font-[var(--font-mono)] text-[var(--text-2xs)] leading-[var(--leading-snug)] text-[color:var(--ink)]">
          {persona.systemPrompt}
        </pre>
      </details>
    </article>
  )
}
