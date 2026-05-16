import { describe, expect, it } from 'vitest'
import {
  boardReducer,
  countWords,
  makeInitialState,
  seatedPersonas,
} from '@/components/boardroom/use-board-state'
import type { BoardState, SeatId } from '@/components/boardroom/types'

function seatN(state: BoardState, slugs: string[]): BoardState {
  return slugs.reduce<BoardState>(
    (acc, slug, i) =>
      boardReducer(acc, {
        type: 'SEAT_PERSONA',
        personaSlug: slug,
        seatId: i as SeatId,
      }),
    state,
  )
}

describe('countWords', () => {
  it('returns 0 for empty / whitespace', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   ')).toBe(0)
  })

  it('counts words separated by whitespace', () => {
    expect(countWords('hello world')).toBe(2)
    expect(countWords('  hello   world  ')).toBe(2)
    expect(countWords('one\ntwo\nthree')).toBe(3)
  })
})

describe('boardReducer', () => {
  it('starts in empty with 6 empty seats', () => {
    const s = makeInitialState()
    expect(s.tag).toBe('empty')
    expect(s.seats).toHaveLength(6)
    expect(seatedPersonas(s.seats)).toEqual([])
  })

  it('empty → staffed when first persona seated', () => {
    const s = boardReducer(makeInitialState(), {
      type: 'SEAT_PERSONA',
      personaSlug: 'product-lead',
      seatId: 0,
    })
    expect(s.tag).toBe('staffed')
    expect(seatedPersonas(s.seats)).toEqual(['product-lead'])
  })

  it('staffed → ready when MIN seated AND pitch has ≥1 word', () => {
    let s = seatN(makeInitialState(), ['product-lead', 'skeptical-engineer'])
    expect(s.tag).toBe('staffed')
    s = boardReducer(s, { type: 'SET_PITCH', pitch: 'idea' })
    expect(s.tag).toBe('ready')
  })

  it('ready → staffed when pitch cleared', () => {
    let s = seatN(makeInitialState(), ['product-lead', 'skeptical-engineer'])
    s = boardReducer(s, { type: 'SET_PITCH', pitch: 'idea' })
    expect(s.tag).toBe('ready')
    s = boardReducer(s, { type: 'SET_PITCH', pitch: '' })
    expect(s.tag).toBe('staffed')
  })

  it('ready → running on START', () => {
    let s = seatN(makeInitialState(), ['product-lead', 'skeptical-engineer'])
    s = boardReducer(s, { type: 'SET_PITCH', pitch: 'idea' })
    s = boardReducer(s, { type: 'START' })
    expect(s.tag).toBe('running')
  })

  it('staffed → empty when last persona unseated', () => {
    let s = seatN(makeInitialState(), ['product-lead'])
    expect(s.tag).toBe('staffed')
    s = boardReducer(s, { type: 'UNSEAT_PERSONA', seatId: 0 })
    expect(s.tag).toBe('empty')
  })

  it('rejects seating a new persona when all 6 seats are full', () => {
    const slugs = ['a', 'b', 'c', 'd', 'e', 'f']
    let s = seatN(makeInitialState(), slugs)
    expect(seatedPersonas(s.seats).sort()).toEqual([...slugs].sort())
    // Attempting to seat a 7th distinct persona on any seat must be a no-op:
    // the cap is on total seated personas, not on swap behavior.
    s = boardReducer(s, { type: 'SEAT_PERSONA', personaSlug: 'g', seatId: 0 })
    const seated = seatedPersonas(s.seats)
    expect(seated).toHaveLength(6)
    expect(seated).not.toContain('g')
    expect(seated).toContain('a')
  })

  it('moves a persona when re-seated at a different seat (no duplicates)', () => {
    let s = seatN(makeInitialState(), ['product-lead'])
    s = boardReducer(s, {
      type: 'SEAT_PERSONA',
      personaSlug: 'product-lead',
      seatId: 3,
    })
    const seated = seatedPersonas(s.seats)
    expect(seated).toEqual(['product-lead'])
    expect(s.seats.find((x) => x.id === 0)?.personaSlug).toBeNull()
    expect(s.seats.find((x) => x.id === 3)?.personaSlug).toBe('product-lead')
  })

  it('RESET returns to empty', () => {
    let s = seatN(makeInitialState(), ['product-lead', 'skeptical-engineer'])
    s = boardReducer(s, { type: 'SET_PITCH', pitch: 'idea' })
    s = boardReducer(s, { type: 'START' })
    expect(s.tag).toBe('running')
    s = boardReducer(s, { type: 'RESET' })
    expect(s.tag).toBe('empty')
    expect(seatedPersonas(s.seats)).toEqual([])
    expect(s.pitch).toBe('')
  })

  it('once running, only RESET is honored', () => {
    let s = seatN(makeInitialState(), ['product-lead', 'skeptical-engineer'])
    s = boardReducer(s, { type: 'SET_PITCH', pitch: 'idea' })
    s = boardReducer(s, { type: 'START' })
    const after = boardReducer(s, { type: 'SET_PITCH', pitch: 'nope' })
    expect(after).toBe(s)
  })
})
