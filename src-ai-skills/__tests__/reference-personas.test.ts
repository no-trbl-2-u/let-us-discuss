import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { PersonaSchema, type Persona } from '@framework/schemas/persona'

const PERSONAS_DIR = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
  'personas',
)

function loadAll(): Persona[] {
  const files = fs
    .readdirSync(PERSONAS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()
  return files.map((file) => {
    const full = path.join(PERSONAS_DIR, file)
    const raw = fs.readFileSync(full, 'utf-8')
    const { data, content } = matter(raw)
    const result = PersonaSchema.safeParse({ ...data, systemPrompt: content.trim() })
    if (!result.success) {
      throw new Error(`Invalid reference persona ${full}: ${result.error.message}`)
    }
    return result.data
  })
}

describe('src-ai-skills/personas — reference cast', () => {
  const personas = loadAll()

  it('contains at least one persona', () => {
    expect(personas.length).toBeGreaterThan(0)
  })

  it('every reference persona parses cleanly against PersonaSchema', () => {
    expect(personas.length).toBeGreaterThan(0)
  })

  it('every system prompt is non-trivial (>= 40 chars)', () => {
    for (const p of personas) {
      expect(p.systemPrompt.length).toBeGreaterThanOrEqual(40)
    }
  })

  it('slugs are unique', () => {
    const slugs = personas.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('contains exactly one secretary', () => {
    const secretaries = personas.filter((p) => p.role === 'secretary')
    expect(secretaries).toHaveLength(1)
  })

  it('contains at least one lead and one specialist', () => {
    const leads = personas.filter((p) => p.role === 'lead')
    const specialists = personas.filter((p) => p.role === 'specialist')
    expect(leads.length).toBeGreaterThan(0)
    expect(specialists.length).toBeGreaterThan(0)
  })
})
