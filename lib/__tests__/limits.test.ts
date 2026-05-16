import { describe, expect, it } from 'vitest'
import {
  MAX_PERSONAS_SEATED,
  MAX_PITCH_WORDS,
  MIN_PERSONAS_SEATED,
} from '@/lib/limits'

describe('lib/limits', () => {
  it('exports the documented constants', () => {
    expect(MIN_PERSONAS_SEATED).toBe(2)
    expect(MAX_PERSONAS_SEATED).toBe(6)
    expect(MAX_PITCH_WORDS).toBe(600)
  })

  it('keeps min <= max', () => {
    expect(MIN_PERSONAS_SEATED).toBeLessThanOrEqual(MAX_PERSONAS_SEATED)
  })
})
