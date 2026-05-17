import {
  type AnswerInput,
  type AnthropicStreamClient,
  type ConferringHooks,
  runConferring,
} from '@/lib/anthropic/conferring'
import type { Persona } from '@/lib/schemas/persona'
import type { Template } from '@/lib/schemas/template'
import type { SessionEvent } from '@/lib/sessions/events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

function makeClient(replies: string[]): AnthropicStreamClient {
  let i = 0
  return {
    async streamCompletion() {
      const text = replies[i] ?? `(reply ${i + 1})`
      i += 1
      const tokens = Math.max(1, Math.ceil(text.length / 4))
      async function* deltas() {
        yield text
      }
      return {
        deltas: deltas(),
        final: Promise.resolve({ text, tokens }),
      }
    },
  }
}

function persona(slug: string, role: 'lead' | 'specialist'): Persona {
  return {
    slug,
    name: slug,
    role,
    voice: 'voice',
    lead: role === 'lead',
    tools: [],
    summary: 'x'.repeat(40),
    systemPrompt: 'x'.repeat(80),
  }
}

const template: Template = {
  slug: 'pitch-to-spec',
  name: 'Pitch to spec',
  description: 'x'.repeat(20),
  phases: [
    {
      id: 'clarify',
      name: 'Clarify',
      description: 'clarify desc',
      lead_round_max_questions: 4,
    },
    {
      id: 'confer',
      name: 'Confer',
      description: 'confer desc',
      turn_budget: 2,
    },
    {
      id: 'exec-summary',
      name: 'Executive summary',
      description: 'exec desc',
      exec_summary_checkpoint: true,
    },
    {
      id: 'specialists',
      name: 'Specialist round',
      description: 'spec desc',
      turn_budget: 2,
    },
    {
      id: 'artifact',
      name: 'Artifact',
      description: 'artifact desc',
      turn_budget: 4,
    },
  ],
  escalation: {
    exec_summary_checkpoint: true,
    // Drop convergence to 0 so the escalation checkpoint never fires in the
    // happy-path tests; a separate test would exercise that branch.
    convergence_min_agreement: 0,
    user_redirect_max: 2,
  },
}

function makeHooks(): {
  hooks: ConferringHooks
  statusCalls: string[]
  turnCalls: number
  artifactCalls: number
} {
  const statusCalls: string[] = []
  const ref = { turnCalls: 0, artifactCalls: 0 }
  const hooks: ConferringHooks = {
    async persistTurn() {
      ref.turnCalls += 1
    },
    async persistArtifact() {
      ref.artifactCalls += 1
    },
    async markStatus(status) {
      statusCalls.push(status)
    },
  }
  return {
    hooks,
    statusCalls,
    get turnCalls() {
      return ref.turnCalls
    },
    get artifactCalls() {
      return ref.artifactCalls
    },
  } as ReturnType<typeof makeHooks>
}

async function collect(
  gen: AsyncGenerator<SessionEvent>,
  answerScript: AnswerInput[],
): Promise<SessionEvent[]> {
  const out: SessionEvent[] = []
  for await (const ev of gen) {
    out.push(ev)
    if (
      (ev.type === 'checkpoint.clarify' ||
        ev.type === 'checkpoint.exec-summary') &&
      answerScript.length === 0
    ) {
      throw new Error('orchestrator hit a checkpoint with no scripted answer')
    }
  }
  return out
}

// Feed scripted answers in via a queue.
function answerQueue(answers: AnswerInput[]): () => Promise<AnswerInput> {
  let i = 0
  return async () => {
    const a = answers[i]
    if (!a) throw new Error('out of scripted answers')
    i += 1
    return a
  }
}

describe('runConferring', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('yields session.error config when no API key + no client is injected', async () => {
    const originalKey = process.env.ANTHROPIC_API_KEY
    // biome-ignore lint/performance/noDelete: needed — setting to undefined leaves the string "undefined" in process.env
    delete process.env.ANTHROPIC_API_KEY
    try {
      const gen = runConferring({
        pitch: 'pitch',
        personas: [persona('a', 'lead'), persona('b', 'specialist')],
        template,
        hooks: makeHooks().hooks,
        awaitAnswer: answerQueue([{ kind: 'clarify', body: 'x' }]),
      })
      const events: SessionEvent[] = []
      for await (const e of gen) events.push(e)
      expect(events).toHaveLength(1)
      const first = events[0]
      expect(first).toBeDefined()
      if (first?.type === 'session.error') {
        expect(first.code).toBe('config')
      } else {
        throw new Error('expected session.error')
      }
    } finally {
      if (originalKey !== undefined) process.env.ANTHROPIC_API_KEY = originalKey
    }
  })

  it('walks the full happy path with mocked client', async () => {
    const client = makeClient([
      'What is the audience?', // clarify q1
      'What is the success metric?', // clarify q2
      'A confer turn from lead', // confer t1
      'A confer turn from specialist', // confer t2
      'Exec summary draft', // exec summary compose
      'A specialist drill-in', // spec t1
      'Another specialist drill-in', // spec t2
      '# Spec\n## Overview\nx', // artifact spec
      'Exec summary', // artifact summary
      '- a\n- b', // artifact callouts
    ])
    const { hooks, statusCalls } = makeHooks()
    const gen = runConferring({
      pitch: 'short pitch',
      personas: [persona('lead-a', 'lead'), persona('spec-a', 'specialist')],
      template,
      hooks,
      awaitAnswer: answerQueue([
        { kind: 'clarify', body: 'audience answer' },
        { kind: 'exec-summary-accept', body: 'accepted' },
      ]),
      client,
    })
    const events = await collect(gen, [
      { kind: 'clarify', body: 'audience answer' },
      { kind: 'exec-summary-accept', body: 'accepted' },
    ])

    const types = events.map((e) => e.type)
    expect(types).toContain('phase.entered')
    expect(types).toContain('checkpoint.clarify')
    expect(types).toContain('checkpoint.exec-summary')
    expect(types).toContain('artifact.ready')
    expect(types[types.length - 1]).toBe('session.done')

    expect(statusCalls).toContain('clarify')
    expect(statusCalls).toContain('confer')
    expect(statusCalls).toContain('exec-summary')
    expect(statusCalls).toContain('specialists')
    expect(statusCalls).toContain('artifact')
    expect(statusCalls).toContain('done')
  })

  it('caps clarify turns at lead_round_max_questions OR lead count', async () => {
    // Two leads, cap = 4 → expect 2 clarify questions (one per lead).
    const client = makeClient([
      'q1',
      'q2',
      'confer1',
      'confer2',
      'exec',
      'spec1',
      'spec2',
      '# spec',
      'sum',
      '- c',
    ])
    const { hooks } = makeHooks()
    const gen = runConferring({
      pitch: 'pitch',
      personas: [
        persona('lead-a', 'lead'),
        persona('lead-b', 'lead'),
        persona('spec-a', 'specialist'),
      ],
      template,
      hooks,
      awaitAnswer: answerQueue([
        { kind: 'clarify', body: 'a' },
        { kind: 'exec-summary-accept', body: 'ok' },
      ]),
      client,
    })
    const events: SessionEvent[] = []
    for await (const e of gen) events.push(e)
    const clarifyCheckpoint = events.find(
      (e): e is SessionEvent & { type: 'checkpoint.clarify' } =>
        e.type === 'checkpoint.clarify',
    )
    expect(clarifyCheckpoint).toBeDefined()
    expect(clarifyCheckpoint?.questions.length).toBe(2)
  })

  it('aborts when an exec-summary-redirect arrives without acceptance under cap', async () => {
    const client = makeClient(Array(40).fill('reply'))
    const { hooks, statusCalls } = makeHooks()
    const gen = runConferring({
      pitch: 'pitch',
      personas: [persona('lead-a', 'lead'), persona('spec-a', 'specialist')],
      template,
      hooks,
      awaitAnswer: answerQueue([
        { kind: 'clarify', body: 'a' },
        { kind: 'exec-summary-redirect', body: 'change tone' },
        { kind: 'exec-summary-redirect', body: 'still off' },
        { kind: 'exec-summary-redirect', body: 'enough' },
        // After third redirect: redirects=3 > cap=2 → orchestrator breaks
      ]),
      client,
    })
    const events: SessionEvent[] = []
    for await (const e of gen) events.push(e)
    expect(events.map((e) => e.type)).toContain('session.done')
    expect(statusCalls).toContain('artifact')
  })

  it('emits session.error internal when an unexpected answer arrives', async () => {
    const client = makeClient(['q1', 'reply'])
    const { hooks, statusCalls } = makeHooks()
    const gen = runConferring({
      pitch: 'pitch',
      personas: [persona('lead-a', 'lead'), persona('spec-a', 'specialist')],
      template,
      hooks,
      awaitAnswer: answerQueue([
        { kind: 'exec-summary-accept', body: 'wrong kind' } as AnswerInput,
      ]),
      client,
    })
    const events: SessionEvent[] = []
    for await (const e of gen) events.push(e)
    const err = events.find(
      (e): e is SessionEvent & { type: 'session.error' } =>
        e.type === 'session.error',
    )
    expect(err).toBeDefined()
    expect(err?.code).toBe('internal')
    expect(statusCalls).toContain('aborted')
  })
})
