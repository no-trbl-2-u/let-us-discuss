// Phase 7b orchestrator. An async generator that walks the pitch-to-spec
// template phases (clarify → confer → exec-summary → specialists →
// artifact) and yields SSE events. The route handler pipes each yielded
// event to the SSE stream; the in-memory resume map (see route.ts) feeds
// user answers back via the awaitAnswer promise.

import { MAX_SESSION_TOKENS } from '@/lib/limits'
import type { Persona } from '@/lib/schemas/persona'
import type { Template, TemplatePhase } from '@/lib/schemas/template'
import { BudgetTracker } from '@/lib/sessions/budget'
import type {
  SessionEvent,
  SessionPhase,
  TurnAuthor,
} from '@/lib/sessions/events'
import Anthropic from '@anthropic-ai/sdk'
import { AnthropicConfigError, getAnthropicClient } from './client'

const MODERATOR_NAME = 'Boardroom'

export type ClarifyAnswer = { kind: 'clarify'; body: string }
export type ExecSummaryAccept = { kind: 'exec-summary-accept'; body: string }
export type ExecSummaryRedirect = {
  kind: 'exec-summary-redirect'
  body: string
}
export type AnswerInput =
  | ClarifyAnswer
  | ExecSummaryAccept
  | ExecSummaryRedirect

export type RecordedTurn = {
  id: string
  phase: SessionPhase | 'moderator'
  personaSlug: string | null
  author: TurnAuthor
  body: string
  replyingTo: string | null
  tokens: number
}

export type ConferringHooks = {
  persistTurn(turn: RecordedTurn & { idx: number }): Promise<void>
  persistArtifact(artifact: {
    specMd: string
    execSummary: string
    callouts: string
    tokensUsed: number
  }): Promise<void>
  markStatus(
    status:
      | 'clarify'
      | 'confer'
      | 'exec-summary'
      | 'specialists'
      | 'artifact'
      | 'done'
      | 'aborted',
  ): Promise<void>
}

// Lightweight interface over the SDK so tests can mock without touching the
// real network. Only the surface we actually use.
export type AnthropicStreamClient = {
  streamCompletion(input: {
    system: string
    messages: { role: 'user' | 'assistant'; content: string }[]
    model: string
    maxTokens: number
  }): Promise<{
    deltas: AsyncIterable<string>
    final: Promise<{ text: string; tokens: number }>
  }>
}

export type RunConferringInput = {
  pitch: string
  personas: Persona[]
  template: Template
  hooks: ConferringHooks
  awaitAnswer(): Promise<AnswerInput>
  client?: AnthropicStreamClient
}

export async function* runConferring(
  input: RunConferringInput,
): AsyncGenerator<SessionEvent> {
  const { pitch, personas, template, hooks, awaitAnswer } = input

  let client: AnthropicStreamClient
  try {
    client = input.client ?? defaultStreamClient()
  } catch (err) {
    if (err instanceof AnthropicConfigError) {
      yield {
        type: 'session.error',
        code: 'config',
        message: err.message,
      }
      return
    }
    throw err
  }

  const budget = BudgetTracker.create(MAX_SESSION_TOKENS)
  const turns: RecordedTurn[] = []
  let turnIdx = 0

  const leads = personas.filter((p) => p.role === 'lead')
  const specialists = personas.filter((p) => p.role === 'specialist')
  const phaseById = new Map<string, TemplatePhase>(
    template.phases.map((p) => [p.id, p]),
  )

  async function* runPersonaTurn(
    persona: Persona,
    phase: SessionPhase,
    directive: string,
  ): AsyncGenerator<SessionEvent, RecordedTurn> {
    const turnId = `t-${++turnIdx}`
    yield {
      type: 'turn.begin',
      turnId,
      phase,
      author: 'persona',
      personaSlug: persona.slug,
      replyingTo: null,
    }
    const stream = await client.streamCompletion({
      system: `${persona.systemPrompt}\n\nDirective: ${directive}`,
      messages: messagesFor(turns, pitch),
      model: defaultModel(),
      maxTokens: 600,
    })
    let body = ''
    for await (const delta of stream.deltas) {
      body += delta
      yield { type: 'turn.delta', turnId, delta }
    }
    const final = await stream.final
    if (!body) body = final.text
    budget.add(final.tokens)
    yield { type: 'turn.end', turnId, tokens: final.tokens }
    const turn: RecordedTurn = {
      id: turnId,
      phase,
      personaSlug: persona.slug,
      author: 'persona',
      body: body.trim(),
      replyingTo: null,
      tokens: final.tokens,
    }
    turns.push(turn)
    await hooks.persistTurn({ ...turn, idx: turnIdx })
    return turn
  }

  async function* runModeratorTurn(
    phase: SessionPhase,
    body: string,
  ): AsyncGenerator<SessionEvent, RecordedTurn> {
    const turnId = `t-${++turnIdx}`
    yield {
      type: 'turn.begin',
      turnId,
      phase,
      author: 'moderator',
      personaSlug: null,
      replyingTo: null,
    }
    yield { type: 'turn.delta', turnId, delta: body }
    yield { type: 'turn.end', turnId, tokens: 0 }
    const turn: RecordedTurn = {
      id: turnId,
      phase,
      personaSlug: null,
      author: 'moderator',
      body,
      replyingTo: null,
      tokens: 0,
    }
    turns.push(turn)
    await hooks.persistTurn({ ...turn, idx: turnIdx })
    return turn
  }

  async function recordUserTurn(
    phase: SessionPhase,
    body: string,
  ): Promise<RecordedTurn> {
    const turnId = `t-${++turnIdx}`
    const turn: RecordedTurn = {
      id: turnId,
      phase,
      personaSlug: null,
      author: 'user',
      body,
      replyingTo: null,
      tokens: estimateTokens(body),
    }
    turns.push(turn)
    await hooks.persistTurn({ ...turn, idx: turnIdx })
    return turn
  }

  function emitBudgetSignal(): SessionEvent | null {
    const snap = budget.snapshot()
    if (snap.remaining <= 0) return { type: 'budget.wrap', used: snap.used }
    if (snap.used >= snap.cap * 0.75)
      return { type: 'budget.warn', used: snap.used, remaining: snap.remaining }
    return null
  }

  // ----- Clarify -----
  await hooks.markStatus('clarify')
  yield { type: 'phase.entered', phase: 'clarify' }
  const clarifyPhase = phaseById.get('clarify')
  const clarifyCap = clarifyPhase?.lead_round_max_questions ?? 4
  const questions: { id: string; personaSlug: string; body: string }[] = []
  for (let i = 0; i < leads.length && questions.length < clarifyCap; i++) {
    if (budget.willOverflow(700)) break
    const persona = leads[i]!
    const turn = yield* runPersonaTurn(
      persona,
      'clarify',
      'Ask ONE brief clarifying question that the user can answer in a word or one sentence. Output only the question.',
    )
    questions.push({
      id: turn.id,
      personaSlug: persona.slug,
      body: turn.body,
    })
    const signal = emitBudgetSignal()
    if (signal) yield signal
  }
  yield { type: 'checkpoint.clarify', questions }
  const clarifyAnswer = await awaitAnswer()
  if (clarifyAnswer.kind !== 'clarify') {
    yield {
      type: 'session.error',
      code: 'internal',
      message: `expected clarify answer, got ${clarifyAnswer.kind}`,
    }
    await hooks.markStatus('aborted')
    return
  }
  await recordUserTurn('clarify', clarifyAnswer.body)

  // ----- Confer -----
  await hooks.markStatus('confer')
  yield { type: 'phase.entered', phase: 'confer' }
  const conferPhase = phaseById.get('confer')
  const conferBudget = conferPhase?.turn_budget ?? 8
  const conferRoster = [...leads, ...specialists]
  let wrapped = false
  for (let i = 0; i < conferBudget && !wrapped; i++) {
    if (budget.willOverflow(700)) break
    const persona = conferRoster[i % conferRoster.length]!
    yield* runPersonaTurn(
      persona,
      'confer',
      'Build on the prior turns. Push toward a concrete spec; keep it short.',
    )
    const signal = emitBudgetSignal()
    if (signal) {
      yield signal
      if (signal.type === 'budget.wrap') wrapped = true
    }
  }

  // ----- Exec-summary -----
  await hooks.markStatus('exec-summary')
  yield { type: 'phase.entered', phase: 'exec-summary' }
  let summary = await composeExecSummary({ client, pitch, turns, budget })
  if (summary) {
    yield* runModeratorTurn('exec-summary', summary)
    yield { type: 'checkpoint.exec-summary', body: summary }
  }
  let redirects = 0
  const redirectCap = template.escalation.user_redirect_max
  while (true) {
    const ans = await awaitAnswer()
    if (ans.kind === 'exec-summary-accept') {
      await recordUserTurn('exec-summary', ans.body || 'accepted')
      break
    }
    if (ans.kind === 'exec-summary-redirect') {
      redirects += 1
      await recordUserTurn('exec-summary', ans.body)
      if (redirects > redirectCap) {
        yield* runModeratorTurn(
          'exec-summary',
          'Redirect cap reached — proceeding to the specialist round.',
        )
        break
      }
      summary = await composeExecSummary({ client, pitch, turns, budget })
      if (summary) {
        yield* runModeratorTurn('exec-summary', summary)
        yield { type: 'checkpoint.exec-summary', body: summary }
      }
      continue
    }
    yield {
      type: 'session.error',
      code: 'internal',
      message: `expected exec-summary answer, got ${ans.kind}`,
    }
    await hooks.markStatus('aborted')
    return
  }

  // ----- Specialists -----
  await hooks.markStatus('specialists')
  yield { type: 'phase.entered', phase: 'specialists' }
  const specPhase = phaseById.get('specialists')
  const specBudget = specPhase?.turn_budget ?? 8
  const specRoster = specialists.length > 0 ? specialists : conferRoster
  const summaryAtEntry = summary
  for (let i = 0; i < specBudget; i++) {
    if (budget.willOverflow(700)) break
    const persona = specRoster[i % specRoster.length]!
    yield* runPersonaTurn(
      persona,
      'specialists',
      'Drill into your domain. Output a short paragraph plus 1-3 concrete bullet points.',
    )
    const signal = emitBudgetSignal()
    if (signal) {
      yield signal
      if (signal.type === 'budget.wrap') break
    }
  }
  const agreement = convergenceScore(turns, summaryAtEntry)
  if (
    agreement < template.escalation.convergence_min_agreement &&
    redirects <= redirectCap
  ) {
    const escalate =
      'Specialists diverged on the top bullets. Pick the direction you want to lock in.'
    yield* runModeratorTurn('specialists', escalate)
    yield {
      type: 'checkpoint.clarify',
      questions: [
        { id: `escalate-${turnIdx}`, personaSlug: 'moderator', body: escalate },
      ],
    }
    const ans = await awaitAnswer()
    if (ans.kind === 'clarify') await recordUserTurn('specialists', ans.body)
  }

  // ----- Artifact -----
  await hooks.markStatus('artifact')
  yield { type: 'phase.entered', phase: 'artifact' }
  const artifact = await composeArtifact({ client, pitch, turns, budget })
  yield {
    type: 'artifact.ready',
    specMd: artifact.specMd,
    execSummary: artifact.execSummary,
    callouts: artifact.callouts,
  }
  await hooks.persistArtifact({
    specMd: artifact.specMd,
    execSummary: artifact.execSummary,
    callouts: artifact.callouts,
    tokensUsed: budget.snapshot().used,
  })
  await hooks.markStatus('done')
  yield { type: 'session.done' }
}

// ---------- helpers ----------

function messagesFor(
  turns: RecordedTurn[],
  pitch: string,
): { role: 'user' | 'assistant'; content: string }[] {
  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: `PITCH: ${pitch}` },
  ]
  for (const t of turns) {
    if (t.author === 'user') {
      messages.push({ role: 'user', content: t.body })
    } else {
      const prefix =
        t.author === 'moderator'
          ? `${MODERATOR_NAME}: `
          : `${t.personaSlug ?? 'persona'}: `
      messages.push({ role: 'assistant', content: prefix + t.body })
    }
  }
  return messages
}

function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.max(1, Math.ceil(text.length / 4))
}

function topBullets(text: string, max = 3): string[] {
  return text
    .split('\n')
    .map((l) => l.trim().replace(/^[-*•]\s+/, ''))
    .filter((l) => l.length > 0 && l.length < 200)
    .slice(0, max)
    .map(normalizeBullet)
}

function normalizeBullet(line: string): string {
  return line
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function convergenceScore(turns: RecordedTurn[], summary: string): number {
  const summaryBullets = topBullets(summary)
  if (summaryBullets.length === 0) return 1
  const specialistTurns = turns.filter(
    (t) => t.phase === 'specialists' && t.author === 'persona',
  )
  if (specialistTurns.length === 0) return 1
  let total = 0
  let hits = 0
  for (const t of specialistTurns) {
    const bullets = topBullets(t.body)
    if (bullets.length === 0) continue
    total += bullets.length
    for (const b of bullets) {
      if (summaryBullets.some((s) => bulletOverlap(s, b) >= 0.5)) hits += 1
    }
  }
  return total === 0 ? 1 : hits / total
}

function bulletOverlap(a: string, b: string): number {
  const aw = new Set(a.split(' '))
  const bw = new Set(b.split(' '))
  let inter = 0
  for (const w of aw) if (bw.has(w)) inter += 1
  return inter / Math.max(1, Math.min(aw.size, bw.size))
}

async function composeExecSummary(input: {
  client: AnthropicStreamClient
  pitch: string
  turns: RecordedTurn[]
  budget: BudgetTracker
}): Promise<string> {
  if (input.budget.willOverflow(600)) return ''
  const stream = await input.client.streamCompletion({
    system:
      'You are the Boardroom moderator. Produce a tight executive summary (<=120 words). Lead with the spec direction; close with the top-3 open questions as a bulleted list.',
    messages: messagesFor(input.turns, input.pitch),
    model: defaultModel(),
    maxTokens: 400,
  })
  let body = ''
  for await (const delta of stream.deltas) body += delta
  const final = await stream.final
  input.budget.add(final.tokens)
  return (body || final.text).trim()
}

async function composeArtifact(input: {
  client: AnthropicStreamClient
  pitch: string
  turns: RecordedTurn[]
  budget: BudgetTracker
}): Promise<{ specMd: string; execSummary: string; callouts: string }> {
  async function ask(directive: string, max: number): Promise<string> {
    if (input.budget.willOverflow(max + 100)) return ''
    const stream = await input.client.streamCompletion({
      system: `You are the Boardroom moderator. ${directive}`,
      messages: messagesFor(input.turns, input.pitch),
      model: defaultModel(),
      maxTokens: max,
    })
    let body = ''
    for await (const delta of stream.deltas) body += delta
    const final = await stream.final
    input.budget.add(final.tokens)
    return (body || final.text).trim()
  }
  const specMd = await ask(
    'Render the spec as a markdown document with H2 sections (Overview, Scope, Out of scope, Open questions). Markdown only.',
    1200,
  )
  const execSummary = await ask(
    'Render a 2-paragraph executive summary. Plain prose; no bullets.',
    400,
  )
  const callouts = await ask(
    'Render the top 5 call-outs as a markdown bulleted list. One line each, no nested bullets.',
    400,
  )
  return {
    specMd: specMd || '# Spec\n\n(no content)',
    execSummary: execSummary || '(no summary)',
    callouts: callouts || '- (no call-outs)',
  }
}

function defaultModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || 'claude-opus-4-7'
}

function defaultStreamClient(): AnthropicStreamClient {
  const config = getAnthropicClient()
  const anthropic = new Anthropic({ apiKey: config.apiKey })
  return {
    async streamCompletion({ system, messages, model, maxTokens }) {
      const stream = anthropic.messages.stream({
        model,
        system,
        messages,
        max_tokens: maxTokens,
      })
      async function* deltas() {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            yield event.delta.text
          }
        }
      }
      const final = (async () => {
        const message = await stream.finalMessage()
        const text = message.content
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('')
        const tokens =
          (message.usage?.input_tokens ?? 0) +
          (message.usage?.output_tokens ?? 0)
        return { text, tokens }
      })()
      return { deltas: deltas(), final }
    },
  }
}
