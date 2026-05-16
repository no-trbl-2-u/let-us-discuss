import type { Persona } from '@/lib/schemas/persona'

export type SeatId = 0 | 1 | 2 | 3 | 4 | 5

export type BoardSeat = {
  id: SeatId
  /** position on the table ring (0..1 from top-center clockwise) */
  t: number
  /** slug of the seated persona; null when empty */
  personaSlug: string | null
}

export type BoardStateTag = 'empty' | 'staffed' | 'ready' | 'running'

export type BoardState = {
  tag: BoardStateTag
  seats: BoardSeat[]
  pitch: string
}

export type BoardAction =
  | { type: 'SEAT_PERSONA'; personaSlug: string; seatId: SeatId }
  | { type: 'UNSEAT_PERSONA'; seatId: SeatId }
  | { type: 'SET_PITCH'; pitch: string }
  | { type: 'START' }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; state: BoardState }

export type BoardPersonas = readonly Persona[]
