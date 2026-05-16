#!/usr/bin/env tsx
// scripts/validate-data.ts
//
// Validates personas/ + templates/ against the Zod schemas the
// runtime uses. Run via `pnpm data:validate` -> `tsx`. Exit non-
// zero on the first invalid file so the verify gate catches it.

import fs from 'node:fs'
import path from 'node:path'
import { PERSONAS_DIR, TEMPLATES_DIR } from '../lib/content/paths'
import { loadPersonasFromDir } from '../lib/personas/load'
import { loadTemplateFromDir } from '../lib/templates/load'

function fail(message: string): never {
  process.stderr.write(`data:validate FAIL — ${message}\n`)
  process.exit(1)
}

const startedAt = Date.now()

if (!fs.existsSync(PERSONAS_DIR)) {
  fail(`personas/ directory missing at ${PERSONAS_DIR}`)
}
if (!fs.existsSync(TEMPLATES_DIR)) {
  fail(`templates/ directory missing at ${TEMPLATES_DIR}`)
}

let personas: ReturnType<typeof loadPersonasFromDir>
try {
  personas = loadPersonasFromDir(PERSONAS_DIR)
} catch (err) {
  fail(err instanceof Error ? err.message : String(err))
}

if (personas.length === 0) {
  fail('personas/ is empty — v1 ships at least one persona')
}

const templateFiles = fs
  .readdirSync(TEMPLATES_DIR)
  .filter((f) => f.endsWith('.json'))

if (templateFiles.length === 0) {
  fail('templates/ is empty — v1 ships at least one template')
}

for (const file of templateFiles) {
  const slug = path.basename(file, '.json')
  try {
    loadTemplateFromDir(TEMPLATES_DIR, slug)
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err))
  }
}

const elapsed = Date.now() - startedAt
console.log(
  `data:validate ok — ${personas.length} persona(s), ${templateFiles.length} template(s) in ${elapsed}ms.`,
)
process.exit(0)
