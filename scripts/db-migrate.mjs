#!/usr/bin/env node
// scripts/db-migrate.mjs
//
// Stub migration runner. Phase 3 ships the real runner alongside
// the first migration (auth.users extension / public.profiles).
// Until then: list any *.sql files under db/migrations/, exit 0.

import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve('db/migrations')
if (!fs.existsSync(dir)) {
  console.log('db:migrate — no db/migrations/ directory; nothing to do.')
  process.exit(0)
}

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

if (files.length === 0) {
  console.log('db:migrate — no migrations yet (phase 3+ populates).')
  process.exit(0)
}

console.log(`db:migrate — found ${files.length} migration(s):`)
for (const f of files) console.log(`  - ${f}`)
console.log('db:migrate — runner not yet implemented (phase 3 ships it).')
process.exit(0)
