import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import {
  type AnswerInput,
  type ConferringHooks,
  runConferring,
} from '@/lib/anthropic/conferring'
import { PersonaSchema, type Persona } from '@framework/schemas/persona'
import { TemplateSchema, type Template } from '@framework/schemas/template'
import type { SessionEvent } from '@framework/schemas/events'
import { makeStubClient } from './stub-llm-client'

const HERE = path.dirname(new URL(import.meta.url).pathname)
const PERSONAS_DIR = path.join(HERE, '..', 'personas')
const TEMPLATES_DIR = path.join(HERE, '..', 'templates')

function loadPersonas(): Persona[] {
  const files = fs
    .readdirSync(PERSONAS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(PERSONAS_DIR, file), 'utf-8')
    const { data, content } = matter(raw)
    const parsed = PersonaSchema.parse({ ...data, systemPrompt: content.trim() })
    return parsed
  })
}

function loadTemplate(): Template {
  const raw = fs.readFileSync(
    path.join(TEMPLATES_DIR, 'pitch-to-spec.json'),
    'utf-8',
  )
  return TemplateSchema.parse(JSON.parse(raw))
}

function makeHooks(): {
  hooks: ConferringHooks
  statusCalls: string[]
} {
  const statusCalls: string[] = []
  return {
    hooks: {
      async persistTurn() {},
      async persistArtifact() {},
      async markStatus(status) {
        statusCalls.push(status)
      },
      async loadRetros() {
        return []
      },
      async appendRetro() {},
    },
    statusCalls,
  }
}

function answerQueue(answers: AnswerInput[]): () => Promise<AnswerInput> {
  let i = 0
  return async () => {
    const a = answers[i]
    if (!a) throw new Error('orchestrator-stub: out of scripted answers')
    i += 1
    return a
  }
}

describe('orchestrator — reference cast + reference template via stub', () => {
  it('walks the five core phases and emits artifact.ready before session.done', async () => {
    const personas = loadPersonas()
    const template = loadTemplate()
    const { hooks, statusCalls } = makeHooks()
    const client = makeStubClient(
      Array.from({ length: 40 }, (_, i) => `stub reply ${i + 1}`),
    )

    const events: SessionEvent[] = []
    for await (const ev of runConferring({
      pitch: 'A short pitch describing a fuzzy product idea.',
      personas,
      template,
      hooks,
      awaitAnswer: answerQueue([
        { kind: 'clarify', body: 'audience: indie devs new to multi-agent AI' },
        { kind: 'exec-summary-accept', body: 'accepted' },
      ]),
      client,
    })) {
      events.push(ev)
    }

    const types = events.map((e) => e.type)

    // Lifecycle envelope. runConferring is the inner generator; the host
    // route emits `session.started` before invoking it, so the first event
    // from the generator itself is the first `phase.entered` (clarify).
    expect(types[0]).toBe('phase.entered')
    expect(types[types.length - 1]).toBe('session.done')
    expect(types).not.toContain('session.error')

    // Five core phase transitions emitted in order
    const phaseEntered = events
      .filter((e): e is SessionEvent & { type: 'phase.entered' } =>
        e.type === 'phase.entered',
      )
      .map((e) => e.phase)
    // retro-review is silently skipped when loadRetros returns [];
    // retrospective fires when the template includes it (it does).
    expect(phaseEntered).toEqual([
      'clarify',
      'confer',
      'exec-summary',
      'specialists',
      'artifact',
      'retrospective',
    ])

    // Each phase produced at least one turn (begin/delta/end triple)
    const turnBegins = events.filter((e) => e.type === 'turn.begin')
    expect(turnBegins.length).toBeGreaterThan(0)
    const turnEnds = events.filter((e) => e.type === 'turn.end')
    expect(turnEnds.length).toBe(turnBegins.length)

    // Checkpoints resolved
    expect(types).toContain('checkpoint.clarify')
    expect(types).toContain('checkpoint.exec-summary')

    // Artifact emitted before session.done
    const artifactIdx = types.indexOf('artifact.ready')
    const doneIdx = types.indexOf('session.done')
    expect(artifactIdx).toBeGreaterThanOrEqual(0)
    expect(doneIdx).toBeGreaterThan(artifactIdx)

    // Status hooks walked the canonical sequence
    expect(statusCalls).toContain('clarify')
    expect(statusCalls).toContain('confer')
    expect(statusCalls).toContain('exec-summary')
    expect(statusCalls).toContain('specialists')
    expect(statusCalls).toContain('artifact')
    expect(statusCalls).toContain('done')
  })
})
