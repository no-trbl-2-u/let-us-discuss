import type { ReactNode } from 'react'

interface SettingsSectionProps {
  title: string
  children: ReactNode
  cta?: ReactNode
}

/**
 * Small wrapper for the /app/settings page sections. Future-
 * proofed for a settings page that grows past one section;
 * v1 ships with only the Account section, but the shape is
 * the natural home for any later settings to land.
 */
export function SettingsSection({
  title,
  children,
  cta,
}: SettingsSectionProps) {
  return (
    <section className="mt-[var(--space-6)] flex flex-col gap-[var(--space-3)]">
      <h2 className="font-[var(--font-serif)] font-semibold text-[var(--text-xl)] leading-[var(--leading-heading)] tracking-[var(--tracking-tight)] text-[color:var(--ink-strong)]">
        {title}
      </h2>
      <div className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch]">
        {children}
      </div>
      {cta ? (
        <div className="mt-[var(--space-3)] flex items-center gap-[var(--space-4)]">
          {cta}
        </div>
      ) : null}
    </section>
  )
}
