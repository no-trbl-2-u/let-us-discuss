import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const deleteAccountAction = vi.fn()
// In production Next.js's redirect() throws a NEXT_REDIRECT to signal
// navigation; React handles it silently. In jsdom the throw escapes
// the form-action promise as an unhandled rejection — the mock here
// just records the navigation target without throwing.
const redirect = vi.fn()

vi.mock('@/lib/auth/actions', () => ({
  deleteAccountAction: (...args: unknown[]) => deleteAccountAction(...args),
}))

vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirect(path),
}))

import { DeleteAccountForm } from '@/components/settings/delete-account-form'

describe('DeleteAccountForm', () => {
  beforeEach(() => {
    deleteAccountAction.mockReset()
    redirect.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('disables the submit button until the confirmation field equals "delete"', () => {
    render(<DeleteAccountForm />)
    const submit = screen.getByRole('button', { name: /delete my account/i })
    expect(submit).toBeDisabled()

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'del' } })
    expect(submit).toBeDisabled()

    fireEvent.change(input, { target: { value: 'delete' } })
    expect(submit).toBeEnabled()
  })

  it('re-disables the submit button when the field diverges from "delete"', () => {
    render(<DeleteAccountForm />)
    const input = screen.getByRole('textbox')
    const submit = screen.getByRole('button', { name: /delete my account/i })
    fireEvent.change(input, { target: { value: 'delete' } })
    expect(submit).toBeEnabled()
    fireEvent.change(input, { target: { value: 'deletex' } })
    expect(submit).toBeDisabled()
  })

  it('surfaces a server-side error in the inline message', async () => {
    deleteAccountAction.mockResolvedValue({
      ok: false,
      error: 'Sign in expired. Please sign in again.',
    })
    render(<DeleteAccountForm />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'delete' } })
    const form = input.closest('form')
    if (!form) throw new Error('form not found')
    fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByText(/sign in expired/i)).toBeInTheDocument()
    })
    expect(redirect).not.toHaveBeenCalled()
  })

  it('redirects on a successful delete', async () => {
    deleteAccountAction.mockResolvedValue({
      ok: true,
      redirectTo: '/?account=deleted',
    })
    render(<DeleteAccountForm />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'delete' } })
    const form = input.closest('form')
    if (!form) throw new Error('form not found')
    fireEvent.submit(form)
    await waitFor(() => {
      expect(redirect).toHaveBeenCalledWith('/?account=deleted')
    })
  })

  it('shows an initial server error when passed via prop', () => {
    render(<DeleteAccountForm initialError="something went wrong" />)
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })
})
