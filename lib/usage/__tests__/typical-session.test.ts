import { describe, expect, it } from 'vitest'
import { DEFAULT_MODEL } from '@/lib/anthropic/models'
import {
  TYPICAL_SESSION,
  estimateSessionUsage,
} from '@/lib/usage/typical-session'

describe('estimateSessionUsage', () => {
  it('returns the expected token range for the default model', () => {
    const est = estimateSessionUsage(DEFAULT_MODEL)
    expect(est.tokensMin).toBe(
      TYPICAL_SESSION.promptMin + TYPICAL_SESSION.completionMin,
    )
    expect(est.tokensMax).toBe(
      TYPICAL_SESSION.promptMax + TYPICAL_SESSION.completionMax,
    )
  })

  it('returns integer cents in non-decreasing order for the default model', () => {
    const est = estimateSessionUsage(DEFAULT_MODEL)
    expect(est.costCentsMin).not.toBeNull()
    expect(est.costCentsMax).not.toBeNull()
    expect(Number.isInteger(est.costCentsMin)).toBe(true)
    expect(Number.isInteger(est.costCentsMax)).toBe(true)
    expect(est.costCentsMin!).toBeLessThanOrEqual(est.costCentsMax!)
  })

  it('returns null cost for an unknown model (UI renders —)', () => {
    const est = estimateSessionUsage('made-up-model')
    expect(est.tokensMin).toBeGreaterThan(0)
    expect(est.tokensMax).toBeGreaterThan(0)
    expect(est.costCentsMin).toBeNull()
    expect(est.costCentsMax).toBeNull()
  })

  it('Opus > Sonnet > Haiku at identical token shape (sanity guard on the picker)', () => {
    const opus = estimateSessionUsage('claude-opus-4-7')
    const sonnet = estimateSessionUsage('claude-sonnet-4-6')
    const haiku = estimateSessionUsage('claude-haiku-4-5-20251001')
    expect(opus.costCentsMax!).toBeGreaterThan(sonnet.costCentsMax!)
    expect(sonnet.costCentsMax!).toBeGreaterThan(haiku.costCentsMax!)
  })
})
