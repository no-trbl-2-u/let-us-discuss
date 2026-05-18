/**
 * WCAG 2.x contrast helper.
 *
 * Accepts CSS color strings as either `#RRGGBB` hex or
 * `oklch(L% C H)` (optionally with `/ A` alpha; alpha is
 * ignored — colors with alpha need a background composite
 * before measuring contrast). Returns the 1–21 contrast
 * ratio.
 */

export type ColorString = string

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

function parseHex(color: ColorString): [number, number, number] | null {
  const m = color.trim().match(/^#([0-9a-f]{6})$/i)
  if (!m?.[1]) return null
  const hex = m[1]
  const r = Number.parseInt(hex.slice(0, 2), 16) / 255
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255
  return [r, g, b]
}

function parseOklch(
  color: ColorString,
): { L: number; C: number; H: number } | null {
  const m = color
    .trim()
    .match(
      /^oklch\(\s*([0-9.]+)(%?)\s+([0-9.]+)\s+(-?[0-9.]+)(\s*\/\s*[0-9.]+)?\s*\)$/i,
    )
  if (!m?.[1] || !m[3] || !m[4]) return null
  const Lraw = Number.parseFloat(m[1])
  const isPercent = m[2] === '%'
  const L = isPercent ? Lraw / 100 : Lraw
  const C = Number.parseFloat(m[3])
  const H = Number.parseFloat(m[4])
  return { L, C, H }
}

function oklchToLinearRGB(oklch: {
  L: number
  C: number
  H: number
}): [number, number, number] {
  const hRad = (oklch.H * Math.PI) / 180
  const a = oklch.C * Math.cos(hRad)
  const b = oklch.C * Math.sin(hRad)
  const L = oklch.L

  // oklab → LMS' (cube-root space)
  const lp = L + 0.3963377774 * a + 0.2158037573 * b
  const mp = L - 0.1055613458 * a - 0.0638541728 * b
  const sp = L - 0.0894841775 * a - 1.291485548 * b

  const lc = lp * lp * lp
  const mc = mp * mp * mp
  const sc = sp * sp * sp

  // LMS → linear sRGB
  const r = +4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc
  const g = -1.268438005 * lc + 2.6097574011 * mc - 0.3413193965 * sc
  const bl = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc
  return [r, g, bl]
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function relativeLuminance([r, g, b]: [
  number,
  number,
  number,
]): number {
  return 0.2126 * clamp01(r) + 0.7152 * clamp01(g) + 0.0722 * clamp01(b)
}

function toLinearRGB(color: ColorString): [number, number, number] {
  const hex = parseHex(color)
  if (hex) {
    return [srgbToLinear(hex[0]), srgbToLinear(hex[1]), srgbToLinear(hex[2])]
  }
  const oklch = parseOklch(color)
  if (oklch) {
    return oklchToLinearRGB(oklch)
  }
  throw new Error(`wcagContrast: unrecognized color string "${color}"`)
}

/**
 * Compute the WCAG 2.x contrast ratio between two colors.
 * Order-independent. Returns a value in [1, 21].
 */
export function wcagContrastRatio(
  foreground: ColorString,
  background: ColorString,
): number {
  const Lfg = relativeLuminance(toLinearRGB(foreground))
  const Lbg = relativeLuminance(toLinearRGB(background))
  const lighter = Math.max(Lfg, Lbg)
  const darker = Math.min(Lfg, Lbg)
  return (lighter + 0.05) / (darker + 0.05)
}
