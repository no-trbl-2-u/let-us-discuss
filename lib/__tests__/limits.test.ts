import { describe, expect, it } from 'vitest'
import {
  DEMO_AUTO_ADVANCE_MS,
  DEMO_PITCH_WORDS,
  DEMO_TURN_COUNT,
  MAX_PERSONAS_SEATED,
  MAX_PITCH_WORDS,
  MIN_PERSONAS_SEATED,
} from '@/lib/limits'

describe('lib/limits', () => {
  it('exports the documented constants', () => {
    expect(MIN_PERSONAS_SEATED).toBe(2)
    expect(MAX_PERSONAS_SEATED).toBe(6)
    expect(MAX_PITCH_WORDS).toBe(600)
    expect(DEMO_PITCH_WORDS).toBe(100)
    expect(DEMO_TURN_COUNT).toBe(3)
    expect(DEMO_AUTO_ADVANCE_MS).toBe(2200)
  })

  it('keeps min <= max', () => {
    expect(MIN_PERSONAS_SEATED).toBeLessThanOrEqual(MAX_PERSONAS_SEATED)
  })

  it('demo pitch cap is below the real pitch cap', () => {
    expect(DEMO_PITCH_WORDS).toBeLessThan(MAX_PITCH_WORDS)
  })
})
