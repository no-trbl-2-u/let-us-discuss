import { notFound } from 'next/navigation'
import { runDiagProbe } from '@/lib/supabase/diag'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'diag',
  robots: { index: false, follow: false },
}

export default async function DiagPage() {
  if (process.env.DIAG_ENABLED !== '1') notFound()

  const result = await runDiagProbe()

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-sans text-2xl font-semibold tracking-tight">
        diag
      </h1>
      <p className="mt-2 font-sans text-sm text-ink/70">
        Server-side Supabase connectivity probe. Enabled only when
        <code className="mx-1 rounded bg-ink/10 px-1 py-0.5 font-mono text-xs">
          DIAG_ENABLED=1
        </code>
        is set at runtime.
      </p>
      <pre className="mt-6 overflow-auto rounded border border-ink/10 bg-ink/[0.04] p-4 font-mono text-sm">
        {JSON.stringify(result, null, 2)}
      </pre>
    </section>
  )
}
