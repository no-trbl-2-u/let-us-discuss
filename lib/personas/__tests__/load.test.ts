import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadPersonasFromDir } from '@/lib/personas/load'

const VALID = `---
slug: aaa-alpha
name: Alpha
role: lead
voice: Calm, decisive.
lead: true
tools: []
summary: Test persona alpha.
---

You are alpha persona for the test suite. Plainspoken, terse.
`

const VALID_2 = `---
slug: bbb-beta
name: Beta
role: specialist
voice: Pointed, skeptical.
lead: false
tools: []
summary: Test persona beta.
---

You are beta persona for the test suite. Pointed and skeptical.
`

const INVALID_FM = `---
slug: bad slug here
name: B
role: lead
voice: Voice.
lead: true
tools: []
summary: Bad slug fixture.
---

System prompt body that is long enough to satisfy the schema's minimum.
`

let dir: string

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'personas-test-'))
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('loadPersonasFromDir', () => {
  it('returns an empty array when the dir is empty', () => {
    expect(loadPersonasFromDir(dir)).toEqual([])
  })

  it('parses valid personas and sorts leads-first', () => {
    fs.writeFileSync(path.join(dir, 'beta.md'), VALID_2)
    fs.writeFileSync(path.join(dir, 'alpha.md'), VALID)
    const list = loadPersonasFromDir(dir)
    expect(list).toHaveLength(2)
    expect(list[0]!.slug).toBe('aaa-alpha')
    expect(list[0]!.role).toBe('lead')
    expect(list[1]!.slug).toBe('bbb-beta')
    expect(list[1]!.role).toBe('specialist')
  })

  it('throws with the file path on invalid frontmatter', () => {
    fs.writeFileSync(path.join(dir, 'broken.md'), INVALID_FM)
    expect(() => loadPersonasFromDir(dir)).toThrow(/broken\.md/)
  })
})
