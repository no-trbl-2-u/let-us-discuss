import { describe, expect, it } from 'vitest'
import type { Persona } from '@framework/schemas/persona'
import { CastGuardError, ensureSecretary } from '@/lib/personas/cast-guard'

function p(
  slug: string,
  role: 'lead' | 'specialist' | 'secretary',
): Persona {
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

const lead = p('product-lead', 'lead')
const specialist = p('growth-voice', 'specialist')
const secretary = p('secretary', 'secretary')
const library = [lead, specialist, secretary]

describe('ensureSecretary', () => {
  it('appends the secretary when the seated cast omits it', () => {
    const result = ensureSecretary([lead, specialist], library)
    expect(result).toHaveLength(3)
    expect(result.some((p) => p.role === 'secretary')).toBe(true)
  })

  it('returns the cast unchanged when the secretary is already seated', () => {
    const seated = [lead, specialist, secretary]
    const result = ensureSecretary(seated, library)
    expect(result).toBe(seated)
  })

  it('is idempotent across repeated calls', () => {
    const first = ensureSecretary([lead, specialist], library)
    const second = ensureSecretary(first, library)
    expect(second.filter((p) => p.role === 'secretary')).toHaveLength(1)
  })

  it('throws when the library has zero secretaries', () => {
    expect(() => ensureSecretary([lead], [lead, specialist])).toThrow(
      CastGuardError,
    )
  })

  it('throws when the library has multiple secretaries', () => {
    const second = p('archivist', 'secretary')
    expect(() =>
      ensureSecretary([lead], [lead, secretary, second]),
    ).toThrow(CastGuardError)
  })

  it('throws when the seated cast somehow has multiple secretaries', () => {
    const second = p('archivist', 'secretary')
    expect(() =>
      ensureSecretary([lead, secretary, second], [lead, secretary]),
    ).toThrow(CastGuardError)
  })
})
