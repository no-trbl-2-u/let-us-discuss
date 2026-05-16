'use client'

import { useEffect } from 'react'
import type { BoardPersonas, BoardState, SeatId } from './types'
import { makeInitialState } from './use-board-state'

const PITCH_KEY = 'boardroom:pitch'
const PERSONAS_PARAM = 'personas'

export function encodePersonasParam(seats: BoardState['seats']): string {
  return seats
    .filter((s) => s.personaSlug)
    .sort((a, b) => a.id - b.id)
    .map((s) => `${s.id}:${s.personaSlug}`)
    .join(',')
}

export function parsePersonasParam(
  raw: string | null | undefined,
  validSlugs: ReadonlySet<string>,
): { seatId: SeatId; personaSlug: string }[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((pair) => pair.split(':'))
    .flatMap(([seatStr, slug]) => {
      const seatId = Number(seatStr)
      if (!Number.isInteger(seatId) || seatId < 0 || seatId > 5) return []
      if (!slug || !validSlugs.has(slug)) return []
      return [{ seatId: seatId as SeatId, personaSlug: slug }]
    })
}

export function readInitialBoardState(
  search: string | null | undefined,
  storage: Pick<Storage, 'getItem'> | null,
  personas: BoardPersonas,
): BoardState {
  const initial = makeInitialState()
  const validSlugs = new Set(personas.map((p) => p.slug))
  const params = new URLSearchParams(search ?? '')
  const seatedPairs = parsePersonasParam(params.get(PERSONAS_PARAM), validSlugs)
  const seats = initial.seats.map((seat) => {
    const hit = seatedPairs.find((p) => p.seatId === seat.id)
    return hit ? { ...seat, personaSlug: hit.personaSlug } : seat
  })
  const pitch = storage?.getItem(PITCH_KEY) ?? ''
  const hasSeated = seats.some((s) => s.personaSlug !== null)
  const words = pitch.trim() ? pitch.trim().split(/\s+/).length : 0
  let tag: BoardState['tag'] = 'empty'
  if (hasSeated) {
    const seatedCount = seats.filter((s) => s.personaSlug).length
    tag = seatedCount >= 2 && words >= 1 ? 'ready' : 'staffed'
  }
  return { tag, seats, pitch }
}

export function useBoardPersistence(state: BoardState) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const personasEncoded = encodePersonasParam(state.seats)
    const url = new URL(window.location.href)
    if (personasEncoded) {
      url.searchParams.set(PERSONAS_PARAM, personasEncoded)
    } else {
      url.searchParams.delete(PERSONAS_PARAM)
    }
    window.history.replaceState(null, '', url.toString())
    if (state.pitch) {
      window.sessionStorage.setItem(PITCH_KEY, state.pitch)
    } else {
      window.sessionStorage.removeItem(PITCH_KEY)
    }
  }, [state.seats, state.pitch])
}
