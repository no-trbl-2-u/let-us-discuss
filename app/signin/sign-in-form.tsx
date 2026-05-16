import { signInWithOtpAction } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'

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
    <form action={action} className="space-y-4">
      {error ? (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-3 font-sans text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}
      <label className="block space-y-2">
        <span className="font-sans text-sm font-medium">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          defaultValue={email}
          placeholder="you@example.com"
          className="block w-full rounded border border-ink/20 bg-paper px-3 py-2 font-sans text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded bg-accent px-5 py-2.5 font-sans text-sm font-medium text-paper hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        Send magic link
      </button>
    </form>
  )
}
