'use client'

import { useReducer } from 'react'
import { DEMO_TURN_COUNT } from '@/lib/limits'
import { countWords } from '@/components/boardroom/use-board-state'
import type { DemoAction, DemoState } from './types'

export function makeInitialDemoState(): DemoState {
  return { tag: 'empty', pitch: '' }
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  // Once done, only HYDRATE or RESET can leave the state.
  if (state.tag === 'done' && action.type !== 'HYDRATE' && action.type !== 'RESET') {
    return state
  }

  switch (action.type) {
    case 'SET_PITCH': {
      if (state.tag === 'running') return state
      const pitch = action.pitch
      const words = countWords(pitch)
      const tag: DemoState['tag'] = words >= 1 ? 'ready' : 'empty'
      return { tag, pitch } as DemoState
    }
    case 'START': {
      if (state.tag !== 'ready') return state
      return { tag: 'running', pitch: state.pitch, revealIndex: 0 }
    }
    case 'ADVANCE': {
      if (state.tag !== 'running') return state
      const next = state.revealIndex + 1
      if (next >= DEMO_TURN_COUNT) {
        return { tag: 'done', pitch: state.pitch }
      }
      return { tag: 'running', pitch: state.pitch, revealIndex: next }
    }
    case 'SKIP': {
      if (state.tag !== 'running') return state
      return { tag: 'done', pitch: state.pitch }
    }
    case 'RESET':
      return makeInitialDemoState()
    case 'HYDRATE':
      return action.state
  }
}

export function useDemoState(initial?: DemoState) {
  return useReducer(demoReducer, initial ?? makeInitialDemoState())
}
