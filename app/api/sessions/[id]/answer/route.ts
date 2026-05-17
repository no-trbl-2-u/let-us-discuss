import type { AnswerInput } from '@/lib/anthropic/conferring'
import { deliverAnswer } from '@/lib/sessions/resume-map'
import { getRouteUser } from '@/lib/supabase/auth'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ParamsSchema = z.object({ id: z.string().uuid() })

const BodySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('clarify'), body: z.string().min(1).max(2000) }),
  z.object({
    kind: z.literal('exec-summary-accept'),
    body: z.string().max(2000).default(''),
  }),
  z.object({
    kind: z.literal('exec-summary-redirect'),
    body: z.string().min(1).max(2000),
  }),
])

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
  const sessionId = parsedParams.data.id

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError(400, 'invalid-body', 'request body must be JSON')
  }
  const parsedBody = BodySchema.safeParse(raw)
  if (!parsedBody.success) {
    return jsonError(400, 'invalid-body', 'answer body invalid')
  }

  // Confirm the session belongs to the caller. RLS already enforces this;
  // the explicit read produces a clean 404/403 rather than a silent 409.
  const { data, error } = await session.supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .maybeSingle()
  if (error) {
    return jsonError(500, 'db-error', error.message)
  }
  if (!data) {
    return jsonError(404, 'not-found', 'no such session for this user')
  }

  const delivered = deliverAnswer(sessionId, parsedBody.data as AnswerInput)
  if (!delivered) {
    return jsonError(
      409,
      'session-resume-lost',
      'orchestrator is not waiting on this session — start a new one',
    )
  }
  return Response.json({ ok: true })
}
