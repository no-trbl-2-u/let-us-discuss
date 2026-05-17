import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type SupabaseServerClient, createServerClient } from './server'

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

// Route-handler variant: returns null instead of redirecting. The caller
// emits 401 itself. Page components and server actions keep using
// requireUser(); API routes use this.
export async function getRouteUser(): Promise<{
  user: User
  supabase: SupabaseServerClient
} | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return { user: data.user, supabase }
}
