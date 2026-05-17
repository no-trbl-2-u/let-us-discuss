import type { SessionStatus } from '@/lib/sessions/repo'

type Props = {
  status: SessionStatus
}

const TONE_PER_STATUS: Record<SessionStatus, string> = {
  done: 'text-[color:var(--ink)]',
  aborted: 'text-[color:var(--ink-muted)]',
  clarify: 'italic text-[color:var(--ink-muted)]',
  confer: 'italic text-[color:var(--ink-muted)]',
  'exec-summary': 'italic text-[color:var(--ink-muted)]',
  specialists: 'italic text-[color:var(--ink-muted)]',
  artifact: 'italic text-[color:var(--ink-muted)]',
}

export function StatusPill({ status }: Props) {
  return (
    <span
      className={`font-[var(--font-mono)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] ${TONE_PER_STATUS[status]}`}
    >
      {status}
    </span>
  )
}
