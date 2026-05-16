import { describe, expect, it } from 'vitest'
import {
  DEMO_STORAGE_KEYS,
  readInitialDemoState,
} from '@/components/demo/use-demo-persistence'

function fakeStorage(initial: Record<string, string>) {
  const map = new Map<string, string>(Object.entries(initial))
  return {
    getItem: (k: string) => map.get(k) ?? null,
  }
}

describe('readInitialDemoState', () => {
  it('returns empty when no storage', () => {
    expect(readInitialDemoState(null)).toEqual({ tag: 'empty', pitch: '' })
  })

  it('returns empty when storage has nothing', () => {
    expect(readInitialDemoState(fakeStorage({}))).toEqual({
      tag: 'empty',
      pitch: '',
    })
  })

  it('returns ready when a pitch is stored but demo not used', () => {
    const s = readInitialDemoState(
      fakeStorage({ [DEMO_STORAGE_KEYS.PITCH]: 'idea' }),
    )
    expect(s.tag).toBe('ready')
    expect(s.pitch).toBe('idea')
  })

  it('returns done when demo-used flag is set', () => {
    const s = readInitialDemoState(
      fakeStorage({
        [DEMO_STORAGE_KEYS.USED]: '1',
        [DEMO_STORAGE_KEYS.PITCH]: 'saved',
      }),
    )
    expect(s.tag).toBe('done')
    expect(s.pitch).toBe('saved')
  })

  it('ignores a stored empty pitch', () => {
    const s = readInitialDemoState(
      fakeStorage({ [DEMO_STORAGE_KEYS.PITCH]: '   ' }),
    )
    expect(s.tag).toBe('empty')
  })
})
