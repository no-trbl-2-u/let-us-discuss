import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { wcagContrastRatio } from '@/lib/a11y/wcag-contrast'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TOKENS_PATH = resolve(__dirname, '..', '..', '..', 'design', 'tokens.css')

/**
 * Parse `--name: oklch(...)` declarations out of tokens.css.
 * Skips entries with alpha (`oklch(... / N)`) because the
 * WCAG formula needs a solid composite, and the alpha tokens
 * in this system are focus rings, not text colors.
 */
function loadTokenColors(): Map<string, string> {
  const text = readFileSync(TOKENS_PATH, 'utf8')
  const map = new Map<string, string>()
  const re = /--([a-z0-9-]+):\s*(oklch\([^)]+\))\s*;/gi
  let m: RegExpExecArray | null
  m = re.exec(text)
  while (m !== null) {
    const name = m[1]
    const value = m[2]
    if (name && value && !value.includes('/')) {
      map.set(name, value)
    }
    m = re.exec(text)
  }
  return map
}

const COLORS = loadTokenColors()

function color(name: string): string {
  const c = COLORS.get(name)
  if (!c) {
    throw new Error(
      `token-contrast: token "--${name}" not found in design/tokens.css`,
    )
  }
  return c
}

interface Pair {
  fg: string
  bg: string
  /**
   * `text` — must clear 4.5 (WCAG AA, normal body text).
   * `metadata` — must clear 3.0 (UI text / non-essential
   * captions; lower bar per the brief's explicit decision).
   */
  kind: 'text' | 'metadata'
  context: string
}

/**
 * Every text-on-paper combination the build agent can use
 * without surfacing in /critique. Lower-bar entries are
 * explicitly justified by their `context` field.
 */
const PAIRS: Pair[] = [
  // Body text
  { fg: 'ink', bg: 'paper', kind: 'text', context: 'body on default paper' },
  { fg: 'ink', bg: 'paper-raised', kind: 'text', context: 'body on raised card surface' },
  { fg: 'ink', bg: 'paper-sunken', kind: 'text', context: 'body on sunken well' },
  { fg: 'ink-strong', bg: 'paper', kind: 'text', context: 'h1/emphasis on paper' },
  { fg: 'ink-strong', bg: 'paper-raised', kind: 'text', context: 'h1/emphasis on raised' },
  { fg: 'ink-muted', bg: 'paper', kind: 'text', context: 'secondary text on paper' },
  { fg: 'ink-muted', bg: 'paper-raised', kind: 'text', context: 'secondary text on raised' },
  // Metadata / captions / placeholders — UI-text bar (3.0)
  {
    fg: 'ink-faint',
    bg: 'paper',
    kind: 'metadata',
    context: 'metadata/placeholder on paper (documented as non-body in tokens.css)',
  },
  // CTA / accent surfaces
  {
    fg: 'accent-ink',
    bg: 'accent',
    kind: 'text',
    context: 'primary-CTA label on accent',
  },
  {
    fg: 'accent-2',
    bg: 'accent-2-tint',
    kind: 'text',
    context: 'moderator turn-bubble label on its tinted bg',
  },
]

describe('design tokens clear WCAG AA against their documented use', () => {
  for (const p of PAIRS) {
    const bar = p.kind === 'text' ? 4.5 : 3.0
    it(`--${p.fg} on --${p.bg} (${p.context}) clears ${bar}`, () => {
      const ratio = wcagContrastRatio(color(p.fg), color(p.bg))
      expect(
        ratio,
        `--${p.fg} on --${p.bg} contrast ${ratio.toFixed(2)} below the ${bar} bar for ${p.kind} use (${p.context})`,
      ).toBeGreaterThanOrEqual(bar)
    })
  }
})
