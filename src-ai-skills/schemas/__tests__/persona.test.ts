import { describe, expect, it } from 'vitest'
import {
  PersonaFrontmatterSchema,
  PersonaSchema,
} from '@framework/schemas/persona'

const good = {
  slug: 'product-lead',
  name: 'Product lead',
  role: 'lead' as const,
  voice: 'Concrete, decisive, scope-defending.',
  lead: true,
  tools: [],
  summary: 'Drives clarity on what the user actually needs vs. wants.',
}

describe('PersonaFrontmatterSchema', () => {
  it('accepts a known-good fixture', () => {
    const result = PersonaFrontmatterSchema.safeParse(good)
    expect(result.success).toBe(true)
  })

  it('defaults tools to []', () => {
    const { tools, ...rest } = good
    const result = PersonaFrontmatterSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.tools).toEqual([])
  })

  it('accepts the secretary role', () => {
    const result = PersonaFrontmatterSchema.safeParse({
      ...good,
      slug: 'secretary',
      name: 'Secretary',
      role: 'secretary',
      lead: false,
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown role', () => {
    const result = PersonaFrontmatterSchema.safeParse({ ...good, role: 'judge' })
    expect(result.success).toBe(false)
  })

  it('rejects a non-kebab slug', () => {
    const result = PersonaFrontmatterSchema.safeParse({
      ...good,
      slug: 'Product_Lead',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a summary that is too long', () => {
    const result = PersonaFrontmatterSchema.safeParse({
      ...good,
      summary: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
  })
})

describe('PersonaSchema', () => {
  it('requires a non-trivial systemPrompt', () => {
    const result = PersonaSchema.safeParse({ ...good, systemPrompt: 'hi' })
    expect(result.success).toBe(false)
  })

  it('accepts a real prompt body', () => {
    const result = PersonaSchema.safeParse({
      ...good,
      systemPrompt:
        'You are the product lead in a board-room conversation. Be concrete and decisive; defend scope.',
    })
    expect(result.success).toBe(true)
  })
})
