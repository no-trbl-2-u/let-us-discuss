import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { requireEnv } from './env'
import type { Database } from './database.types'

export type SupabaseServerClient = ReturnType<
  typeof createSSRServerClient<Database>
>

export async function createServerClient(): Promise<SupabaseServerClient> {
  const url = requireEnv('SUPABASE_URL')
  const anonKey = requireEnv('SUPABASE_ANON_KEY')
  const cookieStore = await cookies()

  return createSSRServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // setAll called from a server component is a no-op
            // (Next.js disallows mutation outside server actions).
            // Phase 3's middleware wires this on the request path.
          }
        }
      },
    },
  })
}

export function createServiceClient() {
  const url = requireEnv('SUPABASE_URL')
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
