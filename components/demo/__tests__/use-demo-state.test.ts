import { describe, expect, it } from 'vitest'
import {
  demoReducer,
  makeInitialDemoState,
} from '@/components/demo/use-demo-state'
import { DEMO_TURN_COUNT } from '@/lib/limits'

describe('demoReducer', () => {
  it('starts empty with no pitch', () => {
    const s = makeInitialDemoState()
    expect(s).toEqual({ tag: 'empty', pitch: '' })
  })

  it('empty → ready when pitch gains a word', () => {
    const s = demoReducer(makeInitialDemoState(), { type: 'SET_PITCH', pitch: 'idea' })
    expect(s.tag).toBe('ready')
    expect(s.pitch).toBe('idea')
  })

  it('ready → empty when pitch is cleared', () => {
    let s = demoReducer(makeInitialDemoState(), { type: 'SET_PITCH', pitch: 'idea' })
    s = demoReducer(s, { type: 'SET_PITCH', pitch: '' })
    expect(s.tag).toBe('empty')
  })

  it('ready → running on START', () => {
    let s = demoReducer(makeInitialDemoState(), { type: 'SET_PITCH', pitch: 'idea' })
    s = demoReducer(s, { type: 'START' })
    expect(s.tag).toBe('running')
    if (s.tag === 'running') expect(s.revealIndex).toBe(0)
  })

  it('ignores START when not ready', () => {
    const s = demoReducer(makeInitialDemoState(), { type: 'START' })
    expect(s.tag).toBe('empty')
  })

  it('running → running on ADVANCE (revealIndex+1) until cap', () => {
    let s = demoReducer(makeInitialDemoState(), { type: 'SET_PITCH', pitch: 'idea' })
    s = demoReducer(s, { type: 'START' })
    for (let i = 1; i < DEMO_TURN_COUNT; i += 1) {
      s = demoReducer(s, { type: 'ADVANCE' })
      if (i < DEMO_TURN_COUNT - 1) {
        expect(s.tag).toBe('running')
        if (s.tag === 'running') expect(s.revealIndex).toBe(i)
      }
    }
    // After the final ADVANCE, we should be in `done`.
    s = demoReducer(s, { type: 'ADVANCE' })
    expect(s.tag).toBe('done')
  })

  it('running → done on SKIP', () => {
    let s = demoReducer(makeInitialDemoState(), { type: 'SET_PITCH', pitch: 'idea' })
    s = demoReducer(s, { type: 'START' })
    s = demoReducer(s, { type: 'SKIP' })
    expect(s.tag).toBe('done')
  })

  it('once done, ADVANCE/SET_PITCH/START are no-ops', () => {
    let s = demoReducer(makeInitialDemoState(), { type: 'SET_PITCH', pitch: 'idea' })
    s = demoReducer(s, { type: 'START' })
    s = demoReducer(s, { type: 'SKIP' })
    const after = demoReducer(s, { type: 'ADVANCE' })
    expect(after).toBe(s)
    const after2 = demoReducer(s, { type: 'SET_PITCH', pitch: 'change' })
    expect(after2).toBe(s)
  })

  it('HYDRATE replaces state', () => {
    const target = { tag: 'done', pitch: 'saved' } as const
    const s = demoReducer(makeInitialDemoState(), {
      type: 'HYDRATE',
      state: target,
    })
    expect(s).toEqual(target)
  })

  it('RESET returns to empty even from done', () => {
    let s = demoReducer(makeInitialDemoState(), { type: 'SET_PITCH', pitch: 'idea' })
    s = demoReducer(s, { type: 'START' })
    s = demoReducer(s, { type: 'SKIP' })
    s = demoReducer(s, { type: 'RESET' })
    expect(s).toEqual({ tag: 'empty', pitch: '' })
  })
})
