import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createServerClient } from './server'

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect('/signin?next=/app')
  return user
}
