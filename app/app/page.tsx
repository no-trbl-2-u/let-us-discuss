import type { Metadata } from 'next'
import { requireUser } from '@/lib/supabase/auth'
import { signOutAction } from '@/lib/auth/actions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Boardroom — session',
  robots: { index: false, follow: false },
}

export default async function AppHomePage() {
  const user = await requireUser()

  return (
    <section className="mx-auto max-w-3xl px-6 py-16 space-y-6">
      <h1 className="font-sans text-3xl font-semibold tracking-tight">
        Boardroom
      </h1>
      <p className="font-serif text-lg text-ink/80">
        Signed in as{' '}
        <span className="font-mono text-sm">{user.email}</span>.
      </p>
      <p className="font-sans text-sm text-ink/60">
        The drag-and-drop board ships in phase 5. This is the
        authenticated landing — the session orchestrator follows.
      </p>
      <form action={signOutAction}>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded border border-ink/20 bg-paper px-4 py-2 font-sans text-sm hover:bg-ink/5"
        >
          Sign out
        </button>
      </form>
    </section>
  )
}
