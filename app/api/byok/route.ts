import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { MAX_KEY_LENGTH, MIN_KEY_LENGTH } from '@/lib/byok/encrypt'
import { getMasterKey } from '@/lib/byok/master-key'
import { deleteKey, setKey } from '@/lib/byok/repo'
import { logError } from '@/lib/observability/log'
import { getRouteUser } from '@/lib/supabase/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  key: z
    .string()
    .trim()
    .min(MIN_KEY_LENGTH, { message: 'key too short' })
    .max(MAX_KEY_LENGTH, { message: 'key too long' }),
})

function notEnabled(): Response {
  return Response.json(
    { code: 'byok-not-enabled' },
    { status: 503 },
  )
}

export async function POST(req: NextRequest) {
  if (getMasterKey() === null) return notEnabled()

  const session = await getRouteUser()
  if (!session) {
    return Response.json({ code: 'unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json(
      { code: 'invalid-body' },
      { status: 400 },
    )
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { code: 'invalid-body', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const meta = await setKey(session.supabase, session.user.id, parsed.data.key)
    return Response.json(
      { ok: true, mask: meta.mask, keyVersion: meta.keyVersion },
      { status: 200 },
    )
  } catch (err) {
    logError('byok', err, { route: 'POST /api/byok' })
    return Response.json({ code: 'internal' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest) {
  if (getMasterKey() === null) return notEnabled()

  const session = await getRouteUser()
  if (!session) {
    return Response.json({ code: 'unauthorized' }, { status: 401 })
  }

  try {
    await deleteKey(session.supabase, session.user.id)
    return Response.json({ ok: true }, { status: 200 })
  } catch (err) {
    logError('byok', err, { route: 'DELETE /api/byok' })
    return Response.json({ code: 'internal' }, { status: 500 })
  }
}
