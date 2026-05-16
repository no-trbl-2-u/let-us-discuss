import { describe, expect, it } from 'vitest'
import type { Persona } from '@/lib/schemas/persona'
import {
  encodePersonasParam,
  parsePersonasParam,
  readInitialBoardState,
} from '@/components/boardroom/use-board-persistence'
import { makeInitialSeats } from '@/components/boardroom/use-board-state'

const personas: Persona[] = [
  {
    slug: 'product-lead',
    name: 'Product lead',
    role: 'lead',
    voice: 'concrete',
    lead: true,
    tools: [],
    summary: 'Drives clarity',
    systemPrompt: 'a'.repeat(80),
  },
  {
    slug: 'skeptical-engineer',
    name: 'Skeptical engineer',
    role: 'specialist',
    voice: 'rigorous',
    lead: false,
    tools: [],
    summary: 'Pushes for proof',
    systemPrompt: 'a'.repeat(80),
  },
]

const validSlugs = new Set(personas.map((p) => p.slug))

describe('encodePersonasParam', () => {
  it('encodes seated seats only, ordered by id', () => {
    const seats = makeInitialSeats().map((s) =>
      s.id === 0
        ? { ...s, personaSlug: 'product-lead' }
        : s.id === 3
          ? { ...s, personaSlug: 'skeptical-engineer' }
          : s,
    )
    expect(encodePersonasParam(seats)).toBe('0:product-lead,3:skeptical-engineer')
  })

  it('returns empty string when no seats are filled', () => {
    expect(encodePersonasParam(makeInitialSeats())).toBe('')
  })
})

describe('parsePersonasParam', () => {
  it('parses valid pairs', () => {
    expect(parsePersonasParam('0:product-lead,3:skeptical-engineer', validSlugs)).toEqual([
      { seatId: 0, personaSlug: 'product-lead' },
      { seatId: 3, personaSlug: 'skeptical-engineer' },
    ])
  })

  it('drops unknown slugs', () => {
    expect(parsePersonasParam('0:product-lead,1:nope', validSlugs)).toEqual([
      { seatId: 0, personaSlug: 'product-lead' },
    ])
  })

  it('drops out-of-range seat ids', () => {
    expect(parsePersonasParam('9:product-lead', validSlugs)).toEqual([])
  })

  it('returns [] for empty or null', () => {
    expect(parsePersonasParam(null, validSlugs)).toEqual([])
    expect(parsePersonasParam('', validSlugs)).toEqual([])
  })
})

describe('readInitialBoardState', () => {
  it('returns empty state when no params and no storage', () => {
    const s = readInitialBoardState('', null, personas)
    expect(s.tag).toBe('empty')
    expect(s.pitch).toBe('')
    expect(s.seats.every((seat) => seat.personaSlug === null)).toBe(true)
  })

  it('hydrates seats from URL params', () => {
    const s = readInitialBoardState('?personas=0:product-lead', null, personas)
    expect(s.tag).toBe('staffed')
    expect(s.seats[0]!.personaSlug).toBe('product-lead')
  })

  it('hydrates pitch from sessionStorage', () => {
    const storage = { getItem: (k: string) => (k === 'boardroom:pitch' ? 'hello' : null) }
    const s = readInitialBoardState('', storage, personas)
    expect(s.pitch).toBe('hello')
  })

  it('lands in `ready` when both seats + pitch are present', () => {
    const storage = { getItem: () => 'idea' }
    const s = readInitialBoardState(
      '?personas=0:product-lead,1:skeptical-engineer',
      storage,
      personas,
    )
    expect(s.tag).toBe('ready')
  })
})
