import { SessionLoading } from '@/components/sessions/session-loading'

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1040px] px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)] py-[var(--space-7)] md:py-[var(--space-8)]">
      <SessionLoading />
    </div>
  )
}
