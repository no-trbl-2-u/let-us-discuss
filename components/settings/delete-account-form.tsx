'use client'

import { redirect } from 'next/navigation'
import { useState } from 'react'
import { deleteAccountAction } from '@/lib/auth/actions'
import { Link } from '@/design/primitives/link'

interface DeleteAccountFormProps {
  initialError?: string
}

export const CONFIRMATION_WORD = 'delete'

/**
 * Confirmation form for closing an account. Submit stays
 * disabled until the user types the literal word "delete"
 * verbatim. Server action re-validates (defense in depth).
 */
export function DeleteAccountForm({ initialError }: DeleteAccountFormProps) {
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | undefined>(initialError)
  const canSubmit = confirm === CONFIRMATION_WORD

  async function action(formData: FormData) {
    const result = await deleteAccountAction(formData)
    if (result.ok) {
      redirect(result.redirectTo)
    }
    setError(result.error)
  }

  return (
    <form action={action} className="mt-[var(--space-5)] flex flex-col gap-[var(--space-4)]">
      <label className="flex flex-col gap-[var(--space-2)]">
        <span className="font-[var(--font-sans)] text-[var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[color:var(--ink-muted)]">
          Type {CONFIRMATION_WORD} to confirm.
        </span>
        <input
          type="text"
          name="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? 'delete-account-error' : undefined}
          className="font-[var(--font-mono)] text-[var(--text-sm)] px-[var(--space-3)] py-[var(--space-2)] bg-[color:var(--paper-sunken)] border border-[color:var(--paper-edge)] rounded-[var(--radius-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ring-offset)]"
        />
      </label>

      {error ? (
        <p
          id="delete-account-error"
          className="font-[var(--font-mono)] text-[var(--text-2xs)] text-[color:var(--accent)]"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-[var(--space-4)]">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center h-[40px] px-[var(--space-5)] font-[var(--font-sans)] font-medium tracking-[var(--tracking-ui)] text-[var(--text-sm)] rounded-[var(--radius-sm)] bg-[color:var(--accent)] text-[color:var(--accent-ink)] shadow-[var(--shadow-resting)] hover:bg-[color:var(--accent-pressed)] active:translate-y-[1px] active:shadow-none transition-[background-color,color,box-shadow,transform] duration-[var(--t-lift)] ease-[var(--ease-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ring-offset)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[color:var(--accent)]"
        >
          Delete my account
        </button>
        <Link href="/app/settings" variant="quiet">
          ← Back to settings
        </Link>
      </div>
    </form>
  )
}
