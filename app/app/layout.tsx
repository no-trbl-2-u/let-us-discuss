import { requireUser } from '@/lib/supabase/auth'

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Belt-and-suspenders: the middleware also gates /app/*, but
  // running requireUser here means every server component
  // downstream can call getCurrentUser() and trust the result.
  await requireUser()
  return <>{children}</>
}
