import { describe, expect, it } from 'vitest'
import { MODEL_RATES, estimateCostCents } from '@/lib/observability/pricing'

describe('estimateCostCents', () => {
  it('returns 0 cents for 0 + 0 token input on a known model', () => {
    expect(estimateCostCents('claude-sonnet-4-6', 0, 0)).toBe(0)
  })

  it('returns null for an unrecognized model', () => {
    expect(estimateCostCents('imaginary-model-9000', 1000, 1000)).toBeNull()
  })

  it('returns the expected cents for a Sonnet 4.6 round-number input', () => {
    // 1M prompt + 1M completion on Sonnet: 300 + 1500 = 1800 cents = $18
    expect(estimateCostCents('claude-sonnet-4-6', 1_000_000, 1_000_000)).toBe(
      1800,
    )
  })

  it('ceils sub-cent usage to a positive integer', () => {
    // tiny usage: a few hundred tokens should still register as
    // 1 cent (rather than rounding down to 0)
    const cost = estimateCostCents('claude-opus-4-7', 100, 100)
    expect(cost).toBeGreaterThanOrEqual(1)
    expect(Number.isInteger(cost)).toBe(true)
  })

  it('every documented model in MODEL_RATES returns a non-null estimate', () => {
    for (const model of Object.keys(MODEL_RATES)) {
      expect(estimateCostCents(model, 1000, 1000)).not.toBeNull()
    }
  })

  it('Opus rates are higher than Haiku rates for matched inputs', () => {
    const opus = estimateCostCents('claude-opus-4-7', 10_000, 10_000) ?? 0
    const haiku = estimateCostCents('claude-haiku-4-5', 10_000, 10_000) ?? 0
    expect(opus).toBeGreaterThan(haiku)
  })
})
