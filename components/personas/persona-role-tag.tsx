import type { PersonaRole } from '@/lib/schemas/persona'
import { cn } from '@/lib/cn'

export function PersonaRoleTag({ role }: { role: PersonaRole }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 font-sans text-xs font-medium uppercase tracking-wide',
        role === 'lead'
          ? 'bg-accent/10 text-accent'
          : 'bg-ink/10 text-ink/70',
      )}
    >
      {role}
    </span>
  )
}
