import { describe, expect, it } from 'vitest'
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  MODEL_BLURBS,
  MODEL_LABELS,
  isAllowedModel,
  modelBlurb,
  modelLabel,
  resolveModel,
} from '@/lib/anthropic/models'
import { MODEL_RATES } from '@/lib/observability/pricing'

describe('AVAILABLE_MODELS', () => {
  it('has a stable default that matches AVAILABLE_MODELS[0]', () => {
    expect(DEFAULT_MODEL).toBe(AVAILABLE_MODELS[0])
  })

  it('every entry has a MODEL_RATES row (no — sentinels for allowlisted models)', () => {
    for (const model of AVAILABLE_MODELS) {
      expect(MODEL_RATES[model], `missing MODEL_RATES for ${model}`).toBeDefined()
    }
  })

  it('every entry has a MODEL_LABELS + MODEL_BLURBS entry', () => {
    for (const model of AVAILABLE_MODELS) {
      expect(MODEL_LABELS[model], `missing label for ${model}`).toBeDefined()
      expect(MODEL_BLURBS[model], `missing blurb for ${model}`).toBeDefined()
    }
  })
})

describe('modelLabel / modelBlurb', () => {
  it('returns the labeled string when known', () => {
    expect(modelLabel('claude-opus-4-7')).toMatch(/opus/i)
  })

  it('falls back to the raw id when unknown', () => {
    expect(modelLabel('claude-future-9')).toBe('claude-future-9')
  })

  it('returns empty blurb when unknown', () => {
    expect(modelBlurb('claude-future-9')).toBe('')
  })
})

describe('isAllowedModel', () => {
  it.each(AVAILABLE_MODELS)('returns true for allowlisted model %s', (model) => {
    expect(isAllowedModel(model)).toBe(true)
  })

  it.each([null, undefined, '', '   ', 'gpt-4', 'claude-opus-3', 'random'])(
    'returns false for %s',
    (input) => {
      expect(isAllowedModel(input as string | null | undefined)).toBe(false)
    },
  )

  it('trims whitespace before checking', () => {
    expect(isAllowedModel('  claude-opus-4-7  ')).toBe(true)
  })
})

describe('resolveModel', () => {
  it('returns the input when allowed', () => {
    expect(resolveModel('claude-sonnet-4-6')).toBe('claude-sonnet-4-6')
  })

  it.each([null, undefined, '', '   ', 'gpt-4', 'claude-opus-3'])(
    'falls back to DEFAULT_MODEL for %s',
    (input) => {
      expect(resolveModel(input as string | null | undefined)).toBe(DEFAULT_MODEL)
    },
  )

  it('trims whitespace from the input', () => {
    expect(resolveModel('  claude-haiku-4-5-20251001  ')).toBe(
      'claude-haiku-4-5-20251001',
    )
  })
})
