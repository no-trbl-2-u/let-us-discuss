import { runConferring } from '@/lib/anthropic/conferring'
import { hashIp } from '@/lib/anti-abuse/ip-hash'
import { countSessionsLast24h } from '@/lib/anti-abuse/quota'
import {
  MAX_PERSONAS_SEATED,
  MAX_PITCH_WORDS,
  MAX_SESSIONS_PER_DAY,
  MIN_PERSONAS_SEATED,
} from '@/lib/limits'
import { writeFlagAudit } from '@/lib/moderation/audit'
import { moderate } from '@/lib/moderation/client'
import { loadPersonas } from '@/lib/personas/load'
import {
  appendTurn,
  createSession,
  finalizeArtifact,
  markStatus,
} from '@/lib/sessions/repo'
import {
  clearResume,
  failResume,
  waitForAnswer,
} from '@/lib/sessions/resume-map'
import { encodeSseEvent } from '@/lib/sessions/sse'
import { getRouteUser } from '@/lib/supabase/auth'
import { loadTemplate } from '@/lib/templates/load'
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

  // Resolve personas + template from the repo content. The slugs the client
  // sends must intersect the curated set; we filter rather than fail so a
  // stale-cached client doesn't 400 on a personas/ rename.
  const allPersonas = loadPersonas()
  const seatedPersonas = body.personaSlugs
    .map((slug) => allPersonas.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
  if (seatedPersonas.length < MIN_PERSONAS_SEATED) {
    return jsonError(400, 'unknown personas')
  }
  let template
  try {
    template = loadTemplate(body.templateSlug)
  } catch {
    return jsonError(400, `unknown template: ${body.templateSlug}`)
  }

  // Phase 9 quota gate: cheaper to count rows than to call OpenAI, so this
  // runs before the moderation gate. On quota-exceeded: single SSE event,
  // no session row.
  let used = 0
  try {
    used = await countSessionsLast24h(session.supabase, session.user.id)
  } catch {
    used = 0
  }
  if (used >= MAX_SESSIONS_PER_DAY) {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        controller.enqueue(
          encoder.encode(
            encodeSseEvent({
              type: 'session.error',
              code: 'quota',
              message: `daily session limit reached (${used}/${MAX_SESSIONS_PER_DAY})`,
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

  // Phase 8 input gate: moderate the pitch before fan-out. On flagged: skip
  // the session insert, write an unattached flag_audit row, and return a
  // single-event SSE stream so the client renders SessionErrorCard the same
  // way it would for an in-session moderation halt.
  const inputVerdict = await moderate(body.pitch, { surface: 'input' })
  if (inputVerdict.flagged) {
    await writeFlagAudit(session.supabase, {
      sessionId: '00000000-0000-0000-0000-000000000000',
      surface: 'input',
      text: body.pitch,
      verdict: inputVerdict,
    })
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        controller.enqueue(
          encoder.encode(
            encodeSseEvent({
              type: 'session.error',
              code: 'moderation',
              message: 'pitch halted by the moderation gate',
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

  const ipHash = hashIp(req)
  let created: { id: string }
  try {
    created = await createSession(session.supabase, {
      userId: session.user.id,
      pitch: body.pitch,
      templateSlug: body.templateSlug,
      personaSlugs: body.personaSlugs,
      model: process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-7',
      status: 'clarify',
      ipHash,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    return jsonError(500, `could not start session: ${message}`)
  }

  const sessionId = created.id
  let nextIdx = 0
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          // Stream closed by the client.
        }
      }
      const supabase = session.supabase
      try {
        const generator = runConferring({
          pitch: body.pitch,
          personas: seatedPersonas,
          template,
          awaitAnswer: () => waitForAnswer(sessionId),
          async moderateOutput(text) {
            const v = await moderate(text, { sessionId, surface: 'output' })
            return { flagged: v.flagged, verdict: v }
          },
          async onFlaggedOutput(text, verdict) {
            await writeFlagAudit(supabase, {
              sessionId,
              surface: 'output',
              text,
              verdict: verdict as Parameters<
                typeof writeFlagAudit
              >[1]['verdict'],
            })
          },
          hooks: {
            async persistTurn(turn) {
              nextIdx = Math.max(nextIdx, turn.idx + 1)
              try {
                await appendTurn(supabase, {
                  sessionId,
                  idx: turn.idx,
                  phase: turn.phase === 'moderator' ? 'moderator' : turn.phase,
                  personaSlug: turn.personaSlug,
                  author: turn.author,
                  body: turn.body,
                  tokens: turn.tokens,
                })
              } catch {
                // Best-effort; the SSE stream is the source of truth for the
                // client. A failed turn write does not abort the session.
              }
            },
            async persistArtifact(artifact) {
              try {
                await finalizeArtifact(supabase, {
                  sessionId,
                  specMd: artifact.specMd,
                  execSummary: artifact.execSummary,
                  callouts: artifact.callouts,
                  tokensUsed: artifact.tokensUsed,
                })
              } catch {
                // ignored — surfaces as session.done with no persisted artifact
              }
            },
            async markStatus(status) {
              try {
                await markStatus(supabase, sessionId, status)
              } catch {
                // ignored
              }
            },
          },
        })
        for await (const event of generator) {
          send(encodeSseEvent(event))
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown'
        send(
          encodeSseEvent({
            type: 'session.error',
            code: 'internal',
            message,
          }),
        )
        try {
          await markStatus(supabase, sessionId, 'aborted')
        } catch {
          // ignored
        }
      } finally {
        clearResume(sessionId)
        try {
          controller.close()
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      failResume(sessionId, new Error('stream cancelled by client'))
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
      'X-Session-Id': sessionId,
    },
  })
}
