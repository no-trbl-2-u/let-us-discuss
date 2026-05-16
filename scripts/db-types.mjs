#!/usr/bin/env node
// scripts/db-types.mjs
//
// Regenerate lib/supabase/database.types.ts from the linked
// Supabase project. Currently a stub — phase 3 ships the real
// generator wired to `supabase gen types typescript`.

import fs from 'node:fs'
import path from 'node:path'

const target = path.resolve('lib/supabase/database.types.ts')
if (!fs.existsSync(target)) {
  console.error(`db:types — missing ${target}; create the placeholder first.`)
  process.exit(1)
}

console.log('db:types — no schema yet; keeping placeholder Database type.')
console.log('(Phase 3 wires the generator against the first migration.)')
process.exit(0)
