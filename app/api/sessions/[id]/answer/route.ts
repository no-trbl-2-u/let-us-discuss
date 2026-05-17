import { getRouteUser } from '@/lib/supabase/auth'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ParamsSchema = z.object({
  id: z.string().uuid(),
})

const BodySchema = z.object({
  body: z.string().min(1),
})

function jsonError(status: number, code: string, message: string) {
  return Response.json({ code, message }, { status })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRouteUser()
  if (!session) return jsonError(401, 'auth', 'sign in required')

  const resolvedParams = await params
  const parsedParams = ParamsSchema.safeParse(resolvedParams)
  if (!parsedParams.success) {
    return jsonError(400, 'invalid-id', 'session id must be a uuid')
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError(400, 'invalid-body', 'request body must be JSON')
  }
  const parsedBody = BodySchema.safeParse(raw)
  if (!parsedBody.success) {
    return jsonError(400, 'invalid-body', 'answer body required')
  }

  return jsonError(501, 'not-implemented', 'resume contract lands in phase 7b')
}
