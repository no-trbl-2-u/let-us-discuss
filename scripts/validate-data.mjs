#!/usr/bin/env node
// scripts/validate-data.mjs
//
// No-op placeholder for the data:validate leg of the verify
// gate. Phase 4 (Persona + template substrate) replaces this
// with a Zod-driven validator that reads every file under
// personas/ and templates/.
//
// Until then: exit 0 so `pnpm verify` does not block.

console.log('data:validate — no-op (phase 4 replaces).')
process.exit(0)
