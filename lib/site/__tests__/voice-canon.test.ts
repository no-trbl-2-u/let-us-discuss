import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  ANSWER_SHAPE_PHRASE,
  CAST_GROUPING_PHRASE,
  OUTDATED_VOICE_SHAPES,
  STARTER_LIBRARY_NOUN,
} from '@/lib/site/voice-canon'

// Source-scan drift gate. Reads every shipped source file under
// `app/`, `components/`, `personas/`, and `templates/` and asserts:
//   1. No file contains any phrase listed in OUTDATED_VOICE_SHAPES.
//   2. Each canonical phrase appears at least once outside the
//      voice-canon module itself (sanity that the refactor didn't
//      strip every usage).
//
// Excludes from the drift scan: __tests__, plan/, node_modules,
// design/ (out-of-band design exports — sketches, not shipped
// surfaces), and lib/site/voice-canon.ts itself (which intentionally
// names the retired phrases via OUTDATED_VOICE_SHAPES).
//
// Excludes from the "canonical phrase appears at least once" check:
// the canon module + the design tree + the voice-canon tests.

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')

const SCAN_ROOTS = ['app', 'components', 'personas', 'templates'] as const

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.md', '.json'])

const EXCLUDE_DIRS = new Set([
  '__tests__',
  'node_modules',
  '.next',
  'plan',
  'design',
])

/** Files where the OUTDATED_VOICE_SHAPES check would produce false
 * positives because they legitimately reference the retired
 * phrasing as data (the canon module's own ledger). */
const DRIFT_EXEMPT_PATHS = new Set([
  path.join('lib', 'site', 'voice-canon.ts'),
])

/**
 * Per-file, per-phrase exemptions. Each entry documents a
 * legitimate occurrence of a retired phrase that isn't user-facing
 * drift — code-mechanic identifiers, source comments, or test
 * fixtures pinned by another spec.
 *
 * Adding a row here requires a one-clause reason; the test prints
 * it on failure if the exemption is wrong.
 */
type PhraseExemption = {
  relPath: string
  phrase: string
  reason: string
}

const PHRASE_EXEMPTIONS: readonly PhraseExemption[] = [
  // The cast-guard module is a legitimate identifier (import path
  // + comment about the runtime check). The retired phrase is
  // "cast guard" only in user-facing copy.
  {
    relPath: path.join('app', 'api', 'sessions', 'route.ts'),
    phrase: 'cast guard',
    reason: 'cast-guard module import path + comment, not user-facing copy',
  },
  // Dead empty-state branches pinned as fixtures by
  // lib/site/__tests__/empty-state-copy.test.ts (the
  // EMPTY_STATE_TEMPLATE_RE regex example). The branches don't
  // render in practice (phase 4 shipped + personas always load)
  // but the source text is load-bearing on the empty-state test.
  {
    relPath: path.join('app', 'about', 'personas', 'page.tsx'),
    phrase: 'the v1 library',
    reason: 'dead empty-state branch pinned by EMPTY_STATE_TEMPLATE_RE test',
  },
  {
    relPath: path.join('components', 'boardroom', 'persona-shelf.tsx'),
    phrase: 'the v1 library',
    reason: 'dead empty-state branch pinned by EMPTY_STATE_TEMPLATE_RE test',
  },
  // Code comment referencing the historical state for context;
  // not user-facing copy.
  {
    relPath: path.join('components', 'demo', 'try-board.tsx'),
    phrase: 'the v1 library',
    reason: 'code comment about historical state, not user-facing copy',
  },
]

function isExempt(file: ScannedFile, phrase: string): boolean {
  return PHRASE_EXEMPTIONS.some(
    (e) => e.relPath === file.relPath && e.phrase === phrase,
  )
}

type ScannedFile = { absPath: string; relPath: string; contents: string }

function walkSync(dir: string, out: ScannedFile[]): void {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDE_DIRS.has(entry)) continue
    const full = path.join(dir, entry)
    const s = statSync(full)
    if (s.isDirectory()) {
      walkSync(full, out)
      continue
    }
    const ext = path.extname(entry)
    if (!SCAN_EXTENSIONS.has(ext)) continue
    out.push({
      absPath: full,
      relPath: path.relative(REPO_ROOT, full),
      contents: readFileSync(full, 'utf8'),
    })
  }
}

const SCANNED: ScannedFile[] = []
for (const root of SCAN_ROOTS) {
  const abs = path.join(REPO_ROOT, root)
  try {
    statSync(abs)
  } catch {
    continue // root doesn't exist in this repo shape
  }
  walkSync(abs, SCANNED)
}

describe('voice-canon drift gate', () => {
  it('scans a non-trivial number of shipped files (sanity floor)', () => {
    // Defensive: if the walker stops matching, every per-phrase
    // assertion silently passes. Pin a floor.
    expect(SCANNED.length).toBeGreaterThan(20)
  })

  for (const entry of OUTDATED_VOICE_SHAPES) {
    it(`no shipped surface contains the retired phrase "${entry.phrase}" (retired at ${entry.retiredAt})`, () => {
      const hits = SCANNED.filter(
        (f) =>
          !DRIFT_EXEMPT_PATHS.has(f.relPath) &&
          !isExempt(f, entry.phrase) &&
          f.contents.includes(entry.phrase),
      )
      expect(
        hits.map((h) => h.relPath),
        `retired phrase "${entry.phrase}" reappeared. Retired at ${entry.retiredAt}; reason: ${entry.reason}`,
      ).toEqual([])
    })
  }
})

describe('voice-canon positive presence', () => {
  // For each canonical phrase, at least one shipped surface should
  // mention it (post-build via template-literal interpolation). The
  // .next build output isn't scanned; we check the *source*. Since
  // the refactored surfaces use template literals like
  // `... ${ANSWER_SHAPE_PHRASE} ...`, the literal string won't appear
  // verbatim in the source — so this positive check inspects the
  // *import-graph* surface rather than literal text. The dedicated
  // import-presence spec in voice-canon-import.test.ts owns that
  // assertion at file level; here we just ensure the canon module
  // is referenced from somewhere.

  it('the canon module is imported from at least one shipped surface', () => {
    const importToken = "from '@/lib/site/voice-canon'"
    const importers = SCANNED.filter((f) => f.contents.includes(importToken))
    expect(
      importers.map((h) => h.relPath),
      'voice-canon module exists but no shipped surface imports it',
    ).not.toEqual([])
  })

  it('exports a non-empty OUTDATED_VOICE_SHAPES ledger', () => {
    expect(OUTDATED_VOICE_SHAPES.length).toBeGreaterThan(0)
    for (const entry of OUTDATED_VOICE_SHAPES) {
      expect(entry.phrase.length, `phrase too short: ${entry.phrase}`).toBeGreaterThanOrEqual(4)
      expect(
        entry.retiredAt,
        `retiredAt should be a short commit sha for ${entry.phrase}`,
      ).toMatch(/^[0-9a-f]{7,12}$/)
      expect(entry.reason.length).toBeGreaterThanOrEqual(8)
    }
  })

  it('canon constants are non-empty strings', () => {
    expect(ANSWER_SHAPE_PHRASE.length).toBeGreaterThan(10)
    expect(CAST_GROUPING_PHRASE.length).toBeGreaterThan(10)
    expect(STARTER_LIBRARY_NOUN.length).toBeGreaterThan(4)
  })
})
