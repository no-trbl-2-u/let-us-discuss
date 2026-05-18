import { describe, expect, it } from 'vitest'
import { EMPTY_STATE_TEMPLATE_RE } from '@/lib/site/empty-state-copy'

describe('EMPTY_STATE_TEMPLATE_RE', () => {
  it('matches the canonical bearings examples', () => {
    expect(EMPTY_STATE_TEMPLATE_RE.test('No sessions yet — start one.')).toBe(
      true,
    )
    expect(
      EMPTY_STATE_TEMPLATE_RE.test(
        'No personas yet — the v1 library ships in phase 4.',
      ),
    ).toBe(true)
  })

  it('rejects copy missing the em-dash', () => {
    expect(EMPTY_STATE_TEMPLATE_RE.test('No sessions yet - start one.')).toBe(
      false,
    )
  })

  it('rejects copy missing the trailing period', () => {
    expect(EMPTY_STATE_TEMPLATE_RE.test('No sessions yet — start one')).toBe(
      false,
    )
  })

  it('rejects unrelated empty copy', () => {
    expect(EMPTY_STATE_TEMPLATE_RE.test('Nothing to see here.')).toBe(false)
    expect(EMPTY_STATE_TEMPLATE_RE.test('No data')).toBe(false)
  })
})
