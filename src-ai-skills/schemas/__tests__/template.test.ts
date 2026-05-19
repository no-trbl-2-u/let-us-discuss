import { describe, expect, it } from 'vitest'
import { TemplateSchema } from '@framework/schemas/template'

const good = {
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
      exec_summary_checkpoint: true,
    },
  ],
  escalation: {
    exec_summary_checkpoint: true,
    convergence_min_agreement: 0.7,
    user_redirect_max: 2,
  },
}

describe('TemplateSchema', () => {
  it('accepts the v1 fixture', () => {
    const result = TemplateSchema.safeParse(good)
    expect(result.success).toBe(true)
  })

  it('rejects an empty phases array', () => {
    const result = TemplateSchema.safeParse({ ...good, phases: [] })
    expect(result.success).toBe(false)
  })

  it('rejects out-of-range convergence', () => {
    const result = TemplateSchema.safeParse({
      ...good,
      escalation: { ...good.escalation, convergence_min_agreement: 1.5 },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a non-kebab phase id', () => {
    const result = TemplateSchema.safeParse({
      ...good,
      phases: [{ ...good.phases[0]!, id: 'Clarify Round' }],
    })
    expect(result.success).toBe(false)
  })
})
