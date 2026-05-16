import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/auth/safe-next'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = safeNextPath(url.searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(
      new URL('/signin?error=missing-code', request.url),
    )
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/signin?error=${encodeURIComponent(error.message)}`,
        request.url,
      ),
    )
  }

  return NextResponse.redirect(new URL(next, request.url))
}
