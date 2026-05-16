'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { safeNextPath } from './safe-next'

const SignInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  next: z.string().optional(),
})

export type SignInResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; email?: string }

function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL
  if (fromEnv && fromEnv.trim() !== '') return fromEnv.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL
  if (vercel && vercel.trim() !== '') return `https://${vercel}`
  return 'http://localhost:3000'
}

export async function signInWithOtpAction(
  formData: FormData,
): Promise<SignInResult> {
  const raw = {
    email: formData.get('email')?.toString() ?? '',
    next: formData.get('next')?.toString() ?? undefined,
  }
  const parsed = SignInSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Enter a valid email address.',
      email: raw.email,
    }
  }
  const { email, next } = parsed.data
  const nextPath = safeNextPath(next)
  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  })
  if (error) {
    return { ok: false, error: error.message, email }
  }
  return { ok: true, redirectTo: `/signin?sent=1&next=${encodeURIComponent(nextPath)}` }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/')
}
