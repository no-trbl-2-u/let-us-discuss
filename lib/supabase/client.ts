import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'
import { requireEnv } from './env'
import type { Database } from './database.types'

export type SupabaseBrowserClient = ReturnType<
  typeof createSSRBrowserClient<Database>
>

export function createBrowserClient(): SupabaseBrowserClient {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return createSSRBrowserClient<Database>(url, anonKey)
}
