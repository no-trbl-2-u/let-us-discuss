import { BudgetTracker } from '@/lib/sessions/budget'
import { describe, expect, it } from 'vitest'

describe('BudgetTracker', () => {
  it('rejects non-positive cap', () => {
    expect(() => BudgetTracker.create(0)).toThrow(/positive finite/)
    expect(() => BudgetTracker.create(-1)).toThrow(/positive finite/)
    expect(() => BudgetTracker.create(Number.NaN)).toThrow(/positive finite/)
  })

  it('starts at zero used, full remaining', () => {
    const t = BudgetTracker.create(100)
    expect(t.snapshot()).toEqual({ used: 0, cap: 100, remaining: 100 })
  })

  it('accumulates tokens via add()', () => {
    const t = BudgetTracker.create(100)
    t.add(40)
    t.add(20)
    expect(t.snapshot()).toEqual({ used: 60, cap: 100, remaining: 40 })
  })

  it('willOverflow returns false strictly under cap and true above', () => {
    const t = BudgetTracker.create(100)
    t.add(80)
    expect(t.willOverflow(20)).toBe(false)
    expect(t.willOverflow(21)).toBe(true)
  })

  it('remaining clamps at zero when over cap', () => {
    const t = BudgetTracker.create(50)
    t.add(80)
    expect(t.snapshot().remaining).toBe(0)
    expect(t.willOverflow(0)).toBe(true)
  })

  it('rejects negative or non-finite token deltas', () => {
    const t = BudgetTracker.create(100)
    expect(() => t.add(-1)).toThrow(/non-negative finite/)
    expect(() => t.add(Number.POSITIVE_INFINITY)).toThrow(/non-negative finite/)
    expect(() => t.willOverflow(-1)).toThrow(/non-negative finite/)
  })
})
