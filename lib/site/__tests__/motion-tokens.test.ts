import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TOKENS_PATH = resolve(
  __dirname,
  '..',
  '..',
  '..',
  'design',
  'tokens.css',
)

const TOKENS = readFileSync(TOKENS_PATH, 'utf8')

const TIMING_TOKENS = ['--t-lift', '--t-settle', '--t-recede'] as const
const EASING_TOKENS = ['--ease-lift', '--ease-settle', '--ease-recede'] as const

describe('design/tokens.css declares the motion stops the design brief names', () => {
  for (const name of TIMING_TOKENS) {
    it(`declares ${name}`, () => {
      const re = new RegExp(`${name.replace(/-/g, '\\-')}\\s*:\\s*`)
      expect(re.test(TOKENS), `expected ${name} in tokens.css`).toBe(true)
    })
  }

  for (const name of EASING_TOKENS) {
    it(`declares ${name}`, () => {
      const re = new RegExp(`${name.replace(/-/g, '\\-')}\\s*:\\s*`)
      expect(re.test(TOKENS), `expected ${name} in tokens.css`).toBe(true)
    })
  }
})
