'use client'

import { useEffect } from 'react'
import type { DemoState } from './types'

const PITCH_KEY = 'boardroom:demo-pitch'
const USED_KEY = 'boardroom:demo-used'

export function readInitialDemoState(
  storage: Pick<Storage, 'getItem'> | null,
): DemoState {
  if (!storage) return { tag: 'empty', pitch: '' }
  if (storage.getItem(USED_KEY) === '1') {
    return { tag: 'done', pitch: storage.getItem(PITCH_KEY) ?? '' }
  }
  const pitch = storage.getItem(PITCH_KEY) ?? ''
  if (!pitch.trim()) return { tag: 'empty', pitch: '' }
  return { tag: 'ready', pitch }
}

export function useDemoPersistence(state: DemoState) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const storage = window.sessionStorage
    if (state.pitch) {
      storage.setItem(PITCH_KEY, state.pitch)
    } else {
      storage.removeItem(PITCH_KEY)
    }
    if (state.tag === 'done') {
      storage.setItem(USED_KEY, '1')
    }
  }, [state])
}

export const DEMO_STORAGE_KEYS = {
  PITCH: PITCH_KEY,
  USED: USED_KEY,
} as const
