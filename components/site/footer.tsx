import { Link } from '@/design/primitives/link'

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--paper-edge)] mt-[var(--space-8)]">
      <div className="mx-auto max-w-[1040px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-5)] md:py-[var(--space-6)] flex flex-col gap-[var(--space-3)] md:flex-row md:items-center md:justify-between font-[var(--font-sans)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
        <span>boardroom</span>
        <span className="flex items-center gap-[var(--space-5)]">
          <Link href="/legal/privacy" variant="quiet">
            Privacy
          </Link>
          <Link href="/legal/terms" variant="quiet">
            Terms
          </Link>
          <Link href="/about/personas" variant="quiet">
            Personas
          </Link>
        </span>
      </div>
    </footer>
  )
}
