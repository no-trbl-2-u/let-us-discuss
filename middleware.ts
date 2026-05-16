import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { isAuthedRoute } from '@/lib/auth/route-table'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!isAuthedRoute(pathname)) return NextResponse.next()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    // Fail-closed: without Supabase env, /app/* is unreachable
    // rather than authenticated. Sends the user to /signin so
    // misconfiguration surfaces visibly.
    return NextResponse.redirect(
      new URL(`/signin?next=${encodeURIComponent(pathname)}`, request.url),
    )
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(`/signin?next=${encodeURIComponent(pathname)}`, request.url),
    )
  }

  return response
}

export const config = {
  matcher: [
    // Match everything except Next.js internals and common static
    // assets; the body of `middleware` then short-circuits on
    // public routes via `isAuthedRoute`.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
