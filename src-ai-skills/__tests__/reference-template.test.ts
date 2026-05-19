import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { TemplateSchema } from '@framework/schemas/template'

const TEMPLATES_DIR = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
  'templates',
)

describe('src-ai-skills/templates — reference template', () => {
  const pitchToSpec = (() => {
    const full = path.join(TEMPLATES_DIR, 'pitch-to-spec.json')
    const raw = fs.readFileSync(full, 'utf-8')
    const parsed = JSON.parse(raw)
    const result = TemplateSchema.safeParse(parsed)
    if (!result.success) {
      throw new Error(`Invalid reference template ${full}: ${result.error.message}`)
    }
    return result.data
  })()

  it('parses against TemplateSchema', () => {
    expect(pitchToSpec.slug).toBe('pitch-to-spec')
  })

  it('contains the five core phases in canonical order', () => {
    const ids = pitchToSpec.phases.map((p) => p.id)
    const core = ['clarify', 'confer', 'exec-summary', 'specialists', 'artifact']
    const filtered = ids.filter((id) => core.includes(id))
    expect(filtered).toEqual(core)
  })

  it('declares the exec-summary checkpoint on at least one phase', () => {
    const checkpoints = pitchToSpec.phases.filter(
      (p) => p.exec_summary_checkpoint === true,
    )
    expect(checkpoints.length).toBeGreaterThan(0)
  })

  it('has a positive turn_budget on the confer phase', () => {
    const confer = pitchToSpec.phases.find((p) => p.id === 'confer')
    expect(confer).toBeDefined()
    expect(confer?.turn_budget ?? 0).toBeGreaterThan(0)
  })
})
