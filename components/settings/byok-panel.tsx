'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Link } from '@/design/primitives/link'
import type { AuditEvent, KeyMeta } from '@/lib/byok/repo'

export const FIRST_RUN_COPY =
  "Once set, the key is used for every boardroom session on this account. Anthropic bills you for those calls; we don't see or log the key."

export const ROTATE_COPY =
  'Replacing the existing key. The previous ciphertext is overwritten; rotate audits are appended.'

export const REVOKE_PROMPT =
  'Revoke your Anthropic API key? Future sessions will fall back to the project key.'

export const DISABLED_COPY = 'BYOK is not enabled on this deployment.'
export const DISABLED_HINT = 'Ask the operator to set BYOK_MASTER_KEY.'

interface ByokPanelProps {
  initialMeta: KeyMeta | null
  audit: AuditEvent[]
  disabled: boolean
}

type Mode = 'unset' | 'set' | 'rotate'

export function ByokPanel({ initialMeta, audit, disabled }: ByokPanelProps) {
  const router = useRouter()
  const [meta, setMeta] = useState<KeyMeta | null>(initialMeta)
  const [mode, setMode] = useState<Mode>(initialMeta ? 'set' : 'unset')
  const [keyInput, setKeyInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (disabled) {
    return (
      <div
        className="mt-[var(--space-5)] font-[var(--font-mono)] text-[var(--text-sm)] text-[color:var(--ink-muted)]"
        data-testid="byok-disabled"
      >
        <p>{DISABLED_COPY}</p>
        <p className="mt-[var(--space-2)]">{DISABLED_HINT}</p>
      </div>
    )
  }

  async function submitSet(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/byok', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: keyInput }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { code?: string }
          | null
        setError(body?.code ?? `error ${res.status}`)
        return
      }
      const body = (await res.json()) as {
        ok: true
        mask: string
        keyVersion: number
      }
      setMeta({
        mask: body.mask,
        keyVersion: body.keyVersion,
        updatedAt: new Date().toISOString(),
      })
      setMode('set')
      setKeyInput('')
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  async function submitRevoke() {
    if (typeof window !== 'undefined' && !window.confirm(REVOKE_PROMPT)) {
      return
    }
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/byok', { method: 'DELETE' })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { code?: string }
          | null
        setError(body?.code ?? `error ${res.status}`)
        return
      }
      setMeta(null)
      setMode('unset')
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  const showForm = mode === 'unset' || mode === 'rotate'

  return (
    <div className="mt-[var(--space-5)] flex flex-col gap-[var(--space-5)]">
      {meta && mode === 'set' ? (
        <div
          className="font-[var(--font-mono)] text-[var(--text-sm)]"
          data-testid="byok-set-summary"
        >
          <p className="text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
            Anthropic key
          </p>
          <p className="mt-[var(--space-2)] text-[color:var(--ink-strong)]">
            {meta.mask}
            <span className="ml-[var(--space-3)] text-[color:var(--ink-muted)]">
              · updated{' '}
              {new Date(meta.updatedAt).toISOString().slice(0, 16).replace('T', ' ')}{' '}
              UTC · v{meta.keyVersion}
            </span>
          </p>
          <div className="mt-[var(--space-4)] flex flex-wrap items-center gap-[var(--space-4)]">
            <button
              type="button"
              onClick={() => {
                setMode('rotate')
                setKeyInput('')
                setError(null)
              }}
              className="inline-flex items-center justify-center h-[40px] px-[var(--space-5)] font-[var(--font-sans)] font-medium tracking-[var(--tracking-ui)] text-[var(--text-sm)] rounded-[var(--radius-sm)] bg-[color:var(--paper-sunken)] text-[color:var(--ink-strong)] border border-[color:var(--paper-edge)] hover:bg-[color:var(--paper-edge)] active:translate-y-[1px] transition-[background-color,transform] duration-[var(--t-lift)] ease-[var(--ease-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ring-offset)]"
            >
              Rotate
            </button>
            <button
              type="button"
              onClick={submitRevoke}
              disabled={pending}
              className="inline-flex items-center justify-center h-[40px] px-[var(--space-5)] font-[var(--font-sans)] font-medium tracking-[var(--tracking-ui)] text-[var(--text-sm)] rounded-[var(--radius-sm)] bg-[color:var(--accent)] text-[color:var(--accent-ink)] shadow-[var(--shadow-resting)] hover:bg-[color:var(--accent-pressed)] active:translate-y-[1px] active:shadow-none transition-[background-color,box-shadow,transform] duration-[var(--t-lift)] ease-[var(--ease-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ring-offset)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Revoke
            </button>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={submitSet}
          className="flex flex-col gap-[var(--space-3)]"
          data-testid="byok-form"
        >
          <p className="font-[var(--font-serif)] text-[var(--text-md)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] max-w-[60ch]">
            {mode === 'rotate' ? ROTATE_COPY : FIRST_RUN_COPY}
          </p>
          <label className="flex flex-col gap-[var(--space-2)]">
            <span className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
              Anthropic API key (starts with sk-ant-)
            </span>
            <input
              type="password"
              name="key"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              required
              minLength={32}
              maxLength={256}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? 'byok-error' : undefined}
              className="font-[var(--font-mono)] text-[var(--text-sm)] px-[var(--space-3)] py-[var(--space-2)] bg-[color:var(--paper-sunken)] border border-[color:var(--paper-edge)] rounded-[var(--radius-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ring-offset)]"
            />
          </label>

          {error ? (
            <p
              id="byok-error"
              className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--accent)]"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-[var(--space-4)]">
            <button
              type="submit"
              disabled={pending || keyInput.trim().length < 32}
              className="inline-flex items-center justify-center h-[40px] px-[var(--space-5)] font-[var(--font-sans)] font-medium tracking-[var(--tracking-ui)] text-[var(--text-sm)] rounded-[var(--radius-sm)] bg-[color:var(--accent)] text-[color:var(--accent-ink)] shadow-[var(--shadow-resting)] hover:bg-[color:var(--accent-pressed)] active:translate-y-[1px] active:shadow-none transition-[background-color,box-shadow,transform] duration-[var(--t-lift)] ease-[var(--ease-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ring-offset)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[color:var(--accent)]"
            >
              {mode === 'rotate' ? 'Save new key' : 'Save key'}
            </button>
            {mode === 'rotate' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('set')
                  setKeyInput('')
                  setError(null)
                }}
                className="font-[var(--font-sans)] text-[var(--text-sm)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink-strong)] underline-offset-4 hover:underline"
              >
                Cancel
              </button>
            ) : (
              <Link href="/app/settings" variant="quiet">
                ← Back to settings
              </Link>
            )}
          </div>
        </form>
      ) : null}

      <div data-testid="byok-audit">
        <p className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          Last 5 events
        </p>
        {audit.length === 0 ? (
          <p className="mt-[var(--space-2)] font-[var(--font-mono)] text-[var(--text-sm)] text-[color:var(--ink-muted)]">
            no events yet
          </p>
        ) : (
          <ul className="mt-[var(--space-2)] font-[var(--font-mono)] text-[var(--text-sm)] text-[color:var(--ink-muted)]">
            {audit.map((event) => (
              <li key={event.id}>
                {event.event.padEnd(8, ' ')}
                {event.createdAt.slice(0, 10)} · v{event.keyVersion}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
