import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The four shipped surfaces that the phase-29 refactor pointed at
// the voice-canon module. Split from the drift spec so failure
// messages name the specific surface; the drift spec catches new
// inlining anywhere, this one catches removed imports on the
// refactored surfaces.

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')

type Expectation = {
  relPath: string
  expectedImports: readonly (
    | 'ANSWER_SHAPE_PHRASE'
    | 'CAST_GROUPING_PHRASE'
    | 'STARTER_LIBRARY_NOUN'
  )[]
}

const EXPECTATIONS: readonly Expectation[] = [
  { relPath: 'app/layout.tsx', expectedImports: ['ANSWER_SHAPE_PHRASE'] },
  {
    relPath: 'app/about/page.tsx',
    expectedImports: ['ANSWER_SHAPE_PHRASE', 'STARTER_LIBRARY_NOUN'],
  },
  {
    relPath: 'components/site/landing-hero.tsx',
    expectedImports: ['ANSWER_SHAPE_PHRASE'],
  },
  {
    relPath: 'app/about/personas/page.tsx',
    expectedImports: ['CAST_GROUPING_PHRASE', 'STARTER_LIBRARY_NOUN'],
  },
] as const

describe('voice-canon import presence on refactored surfaces', () => {
  for (const exp of EXPECTATIONS) {
    it(`${exp.relPath} imports the documented canon constants`, () => {
      const contents = readFileSync(
        path.join(REPO_ROOT, exp.relPath),
        'utf8',
      )
      expect(contents).toContain("from '@/lib/site/voice-canon'")
      for (const name of exp.expectedImports) {
        expect(
          contents,
          `${exp.relPath} should import ${name}`,
        ).toContain(name)
      }
    })
  }
})
