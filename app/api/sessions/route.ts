import {
  MAX_PERSONAS_SEATED,
  MAX_PITCH_WORDS,
  MIN_PERSONAS_SEATED,
} from '@/lib/limits'
import { createSession } from '@/lib/sessions/repo'
import { encodeSseEvent } from '@/lib/sessions/sse'
import { getRouteUser } from '@/lib/supabase/auth'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  pitch: z
    .string()
    .trim()
    .min(1, 'pitch must be at least one word')
    .refine(
      (v) => v.split(/\s+/).filter(Boolean).length <= MAX_PITCH_WORDS,
      `pitch must be at most ${MAX_PITCH_WORDS} words`,
    ),
  personaSlugs: z
    .array(z.string().min(1))
    .min(MIN_PERSONAS_SEATED)
    .max(MAX_PERSONAS_SEATED),
  templateSlug: z.string().min(1),
})

function jsonError(
  status: number,
  message: string,
  extra?: Record<string, unknown>,
) {
  return Response.json({ error: message, ...extra }, { status })
}

export async function POST(req: NextRequest) {
  const session = await getRouteUser()
  if (!session) return jsonError(401, 'sign in required')

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError(400, 'request body must be JSON')
  }
  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) {
    return jsonError(400, 'invalid request body', {
      issues: parsed.error.issues.map((i) => ({
        path: i.path,
        message: i.message,
      })),
    })
  }
  const body = parsed.data

  let created: { id: string }
  try {
    created = await createSession(session.supabase, {
      userId: session.user.id,
      pitch: body.pitch,
      templateSlug: body.templateSlug,
      personaSlugs: body.personaSlugs,
      model: process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-7',
      status: 'aborted',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    return jsonError(500, `could not start session: ${message}`)
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      controller.enqueue(
        encoder.encode(
          encodeSseEvent({ type: 'session.started', sessionId: created.id }),
        ),
      )
      controller.enqueue(
        encoder.encode(
          encodeSseEvent({
            type: 'session.error',
            code: 'not-implemented',
            message: 'phase 7b lights this up',
          }),
        ),
      )
      controller.close()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
    },
  })
}
