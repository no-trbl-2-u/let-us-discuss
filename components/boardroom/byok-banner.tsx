import { BYOK_BANNER_TEXT } from '@/lib/byok/banner-text'

interface ByokBannerProps {
  visible: boolean
}

export function ByokBanner({ visible }: ByokBannerProps) {
  if (!visible) return null
  return (
    <div
      data-testid="byok-banner"
      role="status"
      className="mt-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] bg-[color:var(--paper-sunken)] border-l-2 border-[color:var(--accent)] font-[var(--font-mono)] text-[var(--text-2xs)] tracking-[var(--tracking-tight)] text-[color:var(--ink-muted)]"
    >
      {BYOK_BANNER_TEXT}
    </div>
  )
}
