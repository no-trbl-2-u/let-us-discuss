import type { User } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const raw = process.env.ADMIN_EMAILS ?? ''
  if (!raw.trim()) return false
  const target = email.trim().toLowerCase()
  if (!target) return false
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0)
    .includes(target)
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect('/signin?next=/admin')
  if (!isAdminEmail(user.email)) notFound()
  return user
}
