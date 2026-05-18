import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { URL_CONTRACT_ROUTES } from '@/e2e/url-contract'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const BEARINGS_PATH = resolve(__dirname, '..', 'plan', 'bearings.md')

/**
 * Extract route paths from the bearings.md "URL contract (locked)"
 * block. Lines that start with a leading-pipe-or-space, contain
 * a backticked path, and live between the section heading and the
 * next blank-line + heading.
 */
function extractBearingsRoutes(): string[] {
  const text = readFileSync(BEARINGS_PATH, 'utf8')
  const sectionMatch = text.match(
    /## URL contract[^\n]*\n([\s\S]*?)\n##\s/,
  )
  const section = sectionMatch?.[1]
  if (!section) {
    throw new Error(
      'bearings.md: could not locate "## URL contract" section',
    )
  }
  const routes: string[] = []
  for (const line of section.split('\n')) {
    const m = line.match(/^(\/[a-zA-Z0-9_./[\]-]*)\s+/)
    if (m?.[1]) routes.push(m[1])
  }
  return routes
}

describe('URL contract stays in sync between bearings.md and the walker', () => {
  const bearings = extractBearingsRoutes()
  const walker = [...URL_CONTRACT_ROUTES]

  it('parses at least the v1 contract from bearings.md', () => {
    // Defensive: if the regex stops matching the bearings format the
    // whole comparison silently passes. Pin a floor.
    expect(bearings.length).toBeGreaterThanOrEqual(12)
  })

  it('every bearings route is exercised by the walker', () => {
    const missing = bearings.filter((r) => !walker.includes(r))
    expect(
      missing,
      `bearings declares these routes but the walker does not cover them: ${JSON.stringify(missing)}`,
    ).toEqual([])
  })

  it('every walker route is declared in bearings', () => {
    const extra = walker.filter((r) => !bearings.includes(r))
    expect(
      extra,
      `walker covers these routes but bearings does not declare them: ${JSON.stringify(extra)}`,
    ).toEqual([])
  })
})
