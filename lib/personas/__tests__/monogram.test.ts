import { describe, expect, it } from 'vitest'
import { monogramFor } from '@/lib/personas/monogram'

describe('monogramFor', () => {
  describe('persona-object input', () => {
    it('returns the explicit `monogram` override when set', () => {
      // Phase 28 added the optional `monogram` field to break the
      // Skeptical Engineer / Secretary "SE" collision.
      expect(monogramFor({ name: 'Secretary', monogram: 'SC' })).toBe('SC')
      expect(monogramFor({ name: 'Anything else', monogram: 'X' })).toBe('X')
      expect(monogramFor({ name: 'Foo Bar', monogram: 'ABC' })).toBe('ABC')
    })

    it('falls back to name derivation when `monogram` is absent', () => {
      expect(monogramFor({ name: 'Product lead' })).toBe('PL')
      expect(monogramFor({ name: 'Skeptical engineer' })).toBe('SE')
      expect(monogramFor({ name: 'End-user proxy' })).toBe('EP')
    })

    it('falls back to name derivation when `monogram` is undefined explicitly', () => {
      // TypeScript's optional field can come through as undefined; the
      // helper treats undefined the same as absent.
      expect(monogramFor({ name: 'Growth voice', monogram: undefined })).toBe(
        'GV',
      )
    })
  })

  describe('string input (back-compat)', () => {
    it('returns first letters of the first two words on a multi-word name', () => {
      expect(monogramFor('Product lead')).toBe('PL')
      expect(monogramFor('Skeptical engineer')).toBe('SE')
    })

    it('returns the first two letters uppercased on a single-word name', () => {
      expect(monogramFor('Secretary')).toBe('SE')
      expect(monogramFor('Boardroom')).toBe('BO')
    })

    it('uppercases lowercase input', () => {
      expect(monogramFor('product lead')).toBe('PL')
    })

    it('tolerates extra whitespace between words', () => {
      expect(monogramFor('Product   lead')).toBe('PL')
    })
  })

  describe('edge cases on derivation', () => {
    it('returns the `··` fallback for empty / whitespace-only input', () => {
      expect(monogramFor('')).toBe('··')
      expect(monogramFor('   ')).toBe('··')
      expect(monogramFor({ name: '' })).toBe('··')
      expect(monogramFor({ name: '   ' })).toBe('··')
    })

    it('returns first-letter pair when the persona name has 3+ words', () => {
      // Algorithm uses first letters of the first two words; later
      // words don't contribute.
      expect(monogramFor('Product Marketing Lead')).toBe('PM')
    })
  })
})
