import type { Metadata } from 'next'
import { Heading } from '@/design/primitives/heading'
import { Button } from '@/design/primitives/button'
import { Link } from '@/design/primitives/link'
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
    <div className="flex flex-col items-center px-[var(--space-5)] py-[var(--space-8)]">
      <section
        className="w-full max-w-[440px] bg-[color:var(--paper-raised)] border border-[color:var(--paper-edge)] rounded-[var(--radius-md)] shadow-[var(--shadow-lifted)] p-[var(--space-6)]"
        aria-labelledby="signin-h"
      >
        {sent ? (
          <>
            <Heading level={2} id="signin-h" className="mb-[var(--space-3)]">
              Check your inbox.
            </Heading>
            <p className="font-[var(--font-serif)] text-[var(--text-sm)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] mb-[var(--space-5)]">
              We mailed a one-time sign-in link. Open it on this device.
              If it doesn’t arrive within a minute, check spam or send a
              new one.
            </p>
            <Link href="/signin" className="block">
              <Button variant="secondary" className="w-full">
                Send another link
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Heading level={2} id="signin-h" className="mb-[var(--space-3)]">
              Sign in
            </Heading>
            <p className="font-[var(--font-serif)] text-[var(--text-sm)] leading-[var(--leading-prose)] text-[color:var(--ink-muted)] mb-[var(--space-5)]">
              Enter your email and we’ll send a one-time link. No password,
              no follow-ups. The link expires in fifteen minutes.
            </p>
            <SignInForm
              next={params.next}
              error={params.error}
              email={params.email}
            />
          </>
        )}
      </section>

      <p className="mt-[var(--space-6)] font-[var(--font-sans)] text-[var(--text-2xs)] text-[color:var(--ink-muted)]">
        New here? <Link href="/about">What boardroom is.</Link>
      </p>
    </div>
  )
}
