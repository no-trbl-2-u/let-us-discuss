#!/usr/bin/env node
// scripts/operator-apply.mjs
//
// Operator-batch one-shot migration runner. Phase 30.
//
// Connects to the project's Postgres directly via `pg` +
// `SUPABASE_DB_URL` (the connection string from the Supabase
// dashboard → Project Settings → Database). Bootstraps the
// `public.applied_migrations` tracking table on first run, then
// applies every pending `db/migrations/*.sql` in lexicographic
// order. Each migration runs in its own transaction; non-zero
// exit on first failure preserves partial progress.
//
// Idempotent: re-runs are no-ops once every file is tracked.
//
// Usage:
//   pnpm db:apply-pending
//
// Required env (loaded from .env via node's process.env; the
// script doesn't dotenv-load — invoke via `pnpm` which inherits
// the .env shell setup, or export the var directly).
//
//   SUPABASE_DB_URL   Postgres connection string (URI mode).
//                     Example: postgres://postgres:<pw>@<proj>.supabase.co:5432/postgres
//
// Operators who already applied some migrations manually before
// phase 30 shipped should pre-mark them in the SQL editor with:
//   INSERT INTO public.applied_migrations (filename)
//   VALUES ('<filename.sql>') ON CONFLICT DO NOTHING;
// Otherwise the script will re-run them — most migrations use
// `IF NOT EXISTS` so re-applying is safe but not guaranteed
// across every legacy file.

import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const { Client } = pg

const MIGRATIONS_DIR = path.resolve('db/migrations')
const BOOTSTRAP_SQL = `
  create table if not exists public.applied_migrations (
    filename text primary key,
    applied_at timestamptz not null default now(),
    applied_by text
  );
`

const dbUrl = process.env.SUPABASE_DB_URL
if (!dbUrl || dbUrl.trim() === '') {
  console.error(
    'operator-apply: SUPABASE_DB_URL is not set. Get it from\n' +
      '  Supabase dashboard → Project Settings → Database → Connection string (URI).\n' +
      'Add it to .env (and to your Vercel project env if you want this\n' +
      'to be runnable from CI).',
  )
  process.exit(2)
}

function listMigrationFiles() {
  try {
    return readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort()
  } catch (err) {
    console.error(`operator-apply: cannot read ${MIGRATIONS_DIR}:`, err)
    process.exit(1)
  }
}

async function fetchAppliedSet(client) {
  // Defensive: the bootstrap inserts the table; this runs after that.
  const { rows } = await client.query(
    'select filename from public.applied_migrations',
  )
  return new Set(rows.map((r) => r.filename))
}

async function applyOne(client, filename) {
  const sqlPath = path.join(MIGRATIONS_DIR, filename)
  const sql = readFileSync(sqlPath, 'utf8')
  await client.query('begin')
  try {
    await client.query(sql)
    await client.query(
      'insert into public.applied_migrations (filename) values ($1) on conflict do nothing',
      [filename],
    )
    await client.query('commit')
  } catch (err) {
    try {
      await client.query('rollback')
    } catch {
      // ignore rollback errors; surface the original
    }
    throw err
  }
}

async function main() {
  const client = new Client({ connectionString: dbUrl })
  await client.connect()
  let applied = 0
  let skipped = 0
  try {
    // Bootstrap the tracking table (idempotent via IF NOT EXISTS).
    await client.query(BOOTSTRAP_SQL)

    const files = listMigrationFiles()
    if (files.length === 0) {
      console.log('operator-apply: no migrations under db/migrations/.')
      return
    }

    const appliedSet = await fetchAppliedSet(client)
    console.log(
      `operator-apply: ${files.length} migration(s) total; ${appliedSet.size} already tracked.`,
    )

    for (const filename of files) {
      if (appliedSet.has(filename)) {
        console.log(`  · ${filename}  [skipped — already applied]`)
        skipped += 1
        continue
      }
      process.stdout.write(`  · ${filename}  applying ... `)
      try {
        await applyOne(client, filename)
        process.stdout.write('ok\n')
        applied += 1
      } catch (err) {
        process.stdout.write('FAILED\n')
        console.error('operator-apply: migration failed:', filename)
        console.error(err)
        process.exit(1)
      }
    }
  } finally {
    await client.end()
  }
  console.log(
    `operator-apply: done. ${applied} applied, ${skipped} skipped, 0 failed.`,
  )
}

main().catch((err) => {
  console.error('operator-apply: unexpected error:', err)
  process.exit(1)
})
