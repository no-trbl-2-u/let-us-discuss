import { beforeEach, describe, expect, it, vi } from 'vitest'

const logErrorSpy = vi.fn()

vi.mock('@/lib/observability/log', () => ({
  logError: (...args: unknown[]) => logErrorSpy(...args),
}))

import {
  CLARIFY_FORMAT_TAG,
  RECOMMENDED_MARKER,
  logClarifyFormatIssues,
  validateClarifyFormat,
} from '@/lib/anthropic/clarify-validator'

const WELL_FORMED_MULTI_CHOICE = `
The pitch doesn't pin a cadence. Cadence shapes the rest of the
spec; we want to lock it now.

How often does the newsletter ship?

- ${RECOMMENDED_MARKER} Weekly — standard expectation; sustainable for one person.
- Daily — higher loyalty per subscriber but a content-reservoir burden.
- Monthly — lower commitment but harder to build a habit loop.
`.trim()

const FREE_FORM_QUESTION = `
The pitch is unnamed. We need a working title.

What's the working name?
`.trim()

const MULTI_CHOICE_MISSING_RECOMMENDED = `
Cadence decision.

- Weekly — sustainable.
- Daily — higher loyalty but expensive.
- Monthly — easier to author.
`.trim()

const MULTI_CHOICE_MISSING_TRADEOFF = `
Cadence decision.

- ${RECOMMENDED_MARKER} Weekly
- Daily
- Monthly
`.trim()

const MULTI_CHOICE_MISSING_BOTH = `
Cadence?

- Weekly
- Daily
- Monthly
`.trim()

describe('validateClarifyFormat', () => {
  it('detects the literal `(Recommended)` marker', () => {
    expect(validateClarifyFormat(WELL_FORMED_MULTI_CHOICE).hasRecommended).toBe(
      true,
    )
    expect(
      validateClarifyFormat(MULTI_CHOICE_MISSING_RECOMMENDED).hasRecommended,
    ).toBe(false)
  })

  it('detects trade-off-shaped option lines (em-dash or colon delimiter)', () => {
    expect(
      validateClarifyFormat(WELL_FORMED_MULTI_CHOICE).hasTradeoffOptions,
    ).toBe(true)
    expect(
      validateClarifyFormat(MULTI_CHOICE_MISSING_TRADEOFF).hasTradeoffOptions,
    ).toBe(false)
  })

  it('flags a single-paragraph question as free-form', () => {
    expect(validateClarifyFormat(FREE_FORM_QUESTION).isFreeForm).toBe(true)
  })

  it('does not flag a multi-choice question as free-form', () => {
    expect(validateClarifyFormat(WELL_FORMED_MULTI_CHOICE).isFreeForm).toBe(
      false,
    )
  })
})

describe('logClarifyFormatIssues', () => {
  beforeEach(() => {
    logErrorSpy.mockReset()
  })

  it('is silent on a free-form question even when (Recommended) is absent', () => {
    const report = validateClarifyFormat(FREE_FORM_QUESTION)
    logClarifyFormatIssues(report, {
      sessionId: 's-1',
      personaSlug: 'product-lead',
    })
    expect(logErrorSpy).not.toHaveBeenCalled()
  })

  it('is silent on a fully well-formed multi-choice question', () => {
    const report = validateClarifyFormat(WELL_FORMED_MULTI_CHOICE)
    logClarifyFormatIssues(report, {
      sessionId: 's-1',
      personaSlug: 'product-lead',
    })
    expect(logErrorSpy).not.toHaveBeenCalled()
  })

  it('emits one line with missing="recommended" when only the marker is absent', () => {
    const report = validateClarifyFormat(MULTI_CHOICE_MISSING_RECOMMENDED)
    logClarifyFormatIssues(report, {
      sessionId: 's-1',
      personaSlug: 'product-lead',
    })
    expect(logErrorSpy).toHaveBeenCalledTimes(1)
    const call = logErrorSpy.mock.calls[0]!
    expect(call[0]).toBe('orchestrator')
    expect(call[2]).toEqual(
      expect.objectContaining({
        tag: CLARIFY_FORMAT_TAG,
        sessionId: 's-1',
        personaSlug: 'product-lead',
        missing: 'recommended',
      }),
    )
  })

  it('emits one line with missing="tradeoff-descriptions" when only trade-offs are absent', () => {
    const report = validateClarifyFormat(MULTI_CHOICE_MISSING_TRADEOFF)
    logClarifyFormatIssues(report, {
      sessionId: 's-1',
      personaSlug: null,
    })
    expect(logErrorSpy).toHaveBeenCalledTimes(1)
    const call = logErrorSpy.mock.calls[0]!
    expect(call[2]).toEqual(
      expect.objectContaining({
        missing: 'tradeoff-descriptions',
        personaSlug: '<none>',
      }),
    )
  })

  it('emits one line with missing="recommended-and-tradeoff" when both are absent', () => {
    const report = validateClarifyFormat(MULTI_CHOICE_MISSING_BOTH)
    logClarifyFormatIssues(report, {
      sessionId: 's-1',
      personaSlug: 'product-lead',
    })
    expect(logErrorSpy).toHaveBeenCalledTimes(1)
    const call = logErrorSpy.mock.calls[0]!
    expect(call[2]).toEqual(
      expect.objectContaining({ missing: 'recommended-and-tradeoff' }),
    )
  })
})
