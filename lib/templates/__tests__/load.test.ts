import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadTemplateFromDir } from '@/lib/templates/load'

const VALID = {
  slug: 'pitch-to-spec',
  name: 'Pitch to spec',
  description: 'Take a loose pitch and turn it into a concrete spec.',
  phases: [
    {
      id: 'clarify',
      name: 'Clarify',
      description: 'Lead personas ask 1-4 clarifying questions.',
      lead_round_max_questions: 4,
    },
    {
      id: 'confer',
      name: 'Confer',
      description: 'Personas extrapolate and refine.',
      turn_budget: 8,
    },
  ],
  escalation: {
    exec_summary_checkpoint: true,
    convergence_min_agreement: 0.7,
    user_redirect_max: 2,
  },
}

let dir: string

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'templates-test-'))
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('loadTemplateFromDir', () => {
  it('reads a valid template', () => {
    fs.writeFileSync(
      path.join(dir, 'pitch-to-spec.json'),
      JSON.stringify(VALID, null, 2),
    )
    const result = loadTemplateFromDir(dir, 'pitch-to-spec')
    expect(result.slug).toBe('pitch-to-spec')
    expect(result.phases).toHaveLength(2)
  })

  it('throws if missing', () => {
    expect(() => loadTemplateFromDir(dir, 'nope')).toThrow(/Template not found/)
  })

  it('throws on invalid JSON', () => {
    fs.writeFileSync(path.join(dir, 'bad.json'), '{ not: json')
    expect(() => loadTemplateFromDir(dir, 'bad')).toThrow(/not valid JSON/)
  })

  it('throws on schema mismatch', () => {
    fs.writeFileSync(
      path.join(dir, 'bad.json'),
      JSON.stringify({ slug: 'bad', name: 'Bad' }),
    )
    expect(() => loadTemplateFromDir(dir, 'bad')).toThrow(/Invalid template/)
  })
})
