'use client'

import { useReducer } from 'react'
import {
  MAX_PERSONAS_SEATED,
  MAX_PITCH_WORDS,
  MIN_PERSONAS_SEATED,
} from '@/lib/limits'
import type {
  BoardAction,
  BoardSeat,
  BoardState,
  SeatId,
} from './types'

export const SEAT_COUNT = MAX_PERSONAS_SEATED

const SEAT_IDS: SeatId[] = [0, 1, 2, 3, 4, 5]

export function makeInitialSeats(): BoardSeat[] {
  return SEAT_IDS.map((id) => ({
    id,
    t: id / SEAT_COUNT,
    personaSlug: null,
  }))
}

export function makeInitialState(): BoardState {
  return { tag: 'empty', seats: makeInitialSeats(), pitch: '' }
}

export function countWords(pitch: string): number {
  const trimmed = pitch.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export function seatedPersonas(seats: BoardSeat[]): string[] {
  return seats
    .filter((s): s is BoardSeat & { personaSlug: string } => s.personaSlug !== null)
    .map((s) => s.personaSlug)
}

function gateTag(seats: BoardSeat[], pitch: string): 'empty' | 'staffed' | 'ready' {
  const seated = seatedPersonas(seats)
  if (seated.length === 0) return 'empty'
  const words = countWords(pitch)
  if (seated.length >= MIN_PERSONAS_SEATED && words >= 1) return 'ready'
  return 'staffed'
}

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  // Once running, only RESET is honored — phase 7 wires the real session.
  if (state.tag === 'running' && action.type !== 'RESET') return state

  switch (action.type) {
    case 'SEAT_PERSONA': {
      const seated = seatedPersonas(state.seats)
      // Already seated elsewhere? Move it (single-seat-per-persona invariant).
      // Already at max? Reject.
      const alreadySeatedSeatId = state.seats.find(
        (s) => s.personaSlug === action.personaSlug,
      )?.id
      if (alreadySeatedSeatId === action.seatId) return state
      if (alreadySeatedSeatId === undefined && seated.length >= MAX_PERSONAS_SEATED) {
        return state
      }
      const seats = state.seats.map((s) => {
        if (s.id === action.seatId) return { ...s, personaSlug: action.personaSlug }
        if (s.id === alreadySeatedSeatId) return { ...s, personaSlug: null }
        return s
      })
      return { ...state, tag: gateTag(seats, state.pitch), seats }
    }
    case 'UNSEAT_PERSONA': {
      const seats = state.seats.map((s) =>
        s.id === action.seatId ? { ...s, personaSlug: null } : s,
      )
      return { ...state, tag: gateTag(seats, state.pitch), seats }
    }
    case 'SET_PITCH': {
      const pitch = clampPitchByWords(action.pitch, MAX_PITCH_WORDS)
      return { ...state, tag: gateTag(state.seats, pitch), pitch }
    }
    case 'START': {
      if (state.tag !== 'ready') return state
      return { ...state, tag: 'running' }
    }
    case 'RESET':
      return makeInitialState()
    case 'HYDRATE':
      return action.state
  }
}

function clampPitchByWords(pitch: string, maxWords: number): string {
  // Soft cap: keep whatever the user typed up to maxWords; we don't slice
  // characters mid-word. The UI surfaces a hard-cap signal at 100%.
  const words = pitch.split(/(\s+)/)
  let count = 0
  const out: string[] = []
  for (const chunk of words) {
    if (/^\s+$/.test(chunk)) {
      out.push(chunk)
      continue
    }
    if (chunk.length === 0) continue
    if (count >= maxWords) break
    out.push(chunk)
    count += 1
  }
  return out.join('')
}

export function useBoardState(initial?: BoardState) {
  return useReducer(boardReducer, initial ?? makeInitialState())
}
