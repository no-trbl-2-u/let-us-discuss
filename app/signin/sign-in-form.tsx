import { redirect } from 'next/navigation'
import { Button } from '@/design/primitives/button'
import { Input } from '@/design/primitives/input'
import { signInWithOtpAction } from '@/lib/auth/actions'

export function SignInForm({
  next,
  error,
  email,
}: {
  next?: string
  error?: string
  email?: string
}) {
  async function action(formData: FormData) {
    'use server'
    const result = await signInWithOtpAction(formData)
    if (result.ok) {
      redirect(result.redirectTo)
    }
    redirect(
      `/signin?error=${encodeURIComponent(result.error)}&email=${encodeURIComponent(result.email ?? '')}${next ? `&next=${encodeURIComponent(next)}` : ''}`,
    )
  }

  return (
    <form action={action} className="flex flex-col gap-[var(--space-5)]">
      <Input
        label="Email"
        type="email"
        name="email"
        required
        autoComplete="email"
        defaultValue={email}
        placeholder="you@studio.com"
        helper="Used to send the magic link and attach your sessions to this account."
        error={error}
      />
      {next ? (
        <input
          type="hidden"
          name="next"
          value={next}
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : null}
      <Button type="submit" variant="primary" className="w-full">
        Send the link
      </Button>
    </form>
  )
}
