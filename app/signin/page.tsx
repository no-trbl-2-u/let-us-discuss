import type { Metadata } from 'next'
import { SignInForm } from './sign-in-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign in — boardroom',
  robots: { index: false, follow: false },
}

type SignInSearchParams = {
  sent?: string
  next?: string
  error?: string
  email?: string
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SignInSearchParams>
}) {
  const params = await searchParams
  const sent = params.sent === '1'

  return (
    <section className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-sans text-3xl font-semibold tracking-tight">
        Sign in
      </h1>
      <p className="mt-2 font-sans text-sm text-ink/70">
        We email a one-time sign-in link. No password to remember.
      </p>

      <div className="mt-8">
        {sent ? (
          <div className="space-y-3">
            <p className="font-serif text-lg">Check your email.</p>
            <p className="font-sans text-sm text-ink/70">
              The link expires in 15 minutes. If it doesn&apos;t arrive,
              check spam, or request a new one.
            </p>
            <p className="font-sans text-sm">
              <a href="/signin" className="text-accent underline">
                Send another link
              </a>
            </p>
          </div>
        ) : (
          <SignInForm
            next={params.next}
            error={params.error}
            email={params.email}
          />
        )}
      </div>
    </section>
  )
}
