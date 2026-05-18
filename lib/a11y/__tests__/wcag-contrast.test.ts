import { describe, expect, it } from 'vitest'
import { wcagContrastRatio } from '@/lib/a11y/wcag-contrast'

/**
 * Sample pairs validated against the public WCAG 2.x sample
 * tools (e.g. webaim.org/resources/contrastchecker/).
 * Tolerance is generous to cover ulp variation across the
 * oklch round-trip.
 */
describe('wcagContrastRatio', () => {
  it('black on white returns the maximum 21:1 ratio', () => {
    expect(wcagContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
  })

  it('white on white returns 1:1', () => {
    expect(wcagContrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 2)
  })

  it('order-independent: black on white === white on black', () => {
    const a = wcagContrastRatio('#000000', '#FFFFFF')
    const b = wcagContrastRatio('#FFFFFF', '#000000')
    expect(a).toBeCloseTo(b, 5)
  })

  it('mid gray on white sits at the AA boundary (~4.5)', () => {
    const ratio = wcagContrastRatio('#767676', '#FFFFFF')
    expect(ratio).toBeGreaterThan(4.5)
    expect(ratio).toBeLessThan(5.0)
  })

  it('pure red on white fails AA (<4.5)', () => {
    const ratio = wcagContrastRatio('#FF0000', '#FFFFFF')
    expect(ratio).toBeLessThan(4.5)
    expect(ratio).toBeGreaterThan(3.5)
  })

  it('hex and equivalent oklch round-trip close enough for AA bucketing', () => {
    // Pure black in oklch (CSS Color 4): oklch(0% 0 0)
    const hexBlackOnWhite = wcagContrastRatio('#000000', '#FFFFFF')
    const oklchBlackOnWhite = wcagContrastRatio('oklch(0% 0 0)', '#FFFFFF')
    expect(oklchBlackOnWhite).toBeCloseTo(hexBlackOnWhite, 0)
  })

  it('an oklch dark ink on warm cream paper clears AA for body text', () => {
    // Approximates the boardroom system's --ink on --paper.
    const ratio = wcagContrastRatio(
      'oklch(22% 0.014 60)',
      'oklch(96.5% 0.012 82)',
    )
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('throws on an unrecognized color string', () => {
    expect(() => wcagContrastRatio('not-a-color', '#FFFFFF')).toThrow(
      /unrecognized color string/i,
    )
  })
})
