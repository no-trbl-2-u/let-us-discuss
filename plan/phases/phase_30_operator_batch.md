# Phase 30 — Operator-batch one-shot apply script + `/admin/migrations` status surface

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

1. **A new `scripts/operator-apply.mjs`** connects directly
   to the project's Postgres via `pg` + `SUPABASE_DB_URL`,
   bootstraps a `public.applied_migrations` tracking table
   on first run, and applies every pending `*.sql` under
   `db/migrations/` in lexicographic order. Each migration
   runs in its own transaction; the filename + applied-at
   timestamp are recorded on success.
2. **A new `pnpm db:apply-pending` script** is wired in
   `package.json`. Idempotent: re-runs are no-ops once all
   migrations are tracked.
3. **A new `/admin/migrations` page** (env-gated via the
   existing `requireAdmin` helper) renders a status table:
   every file under `db/migrations/` × applied / pending ×
   last-applied-at timestamp. Read-only. Joins the bearings
   URL contract.
4. **One new `[operator]` AUDIT row** consolidates the 5
   pending operator-migration rows (phase-16 token-usage,
   phase-21 secretary, phase-22 retros, phase-26 BYOK,
   phase-27 key-origin) into a single "set
   `SUPABASE_DB_URL`; run `pnpm db:apply-pending`" action.
   The 5 prior rows are marked resolved-by-consolidation
   in `plan/AUDIT.md`.

## Prerequisite

Phases 1–29 shipped. `requireAdmin` (`lib/auth/admin.ts`,
phase 23) gates `/admin/*`. `pg` library is added as a
dependency. Operator needs Postgres connection access (the
`SUPABASE_DB_URL` from the Supabase dashboard "Project
Settings → Database" page — different from the
`SUPABASE_URL` they already have).

## Dependencies (operator action required for runtime)

This phase **replaces** the 5 pending `[operator]` AUDIT
rows with one consolidated action:

- **Set `SUPABASE_DB_URL`** in `.env` (local) and in the
  Vercel Project Env (Production + Preview). The Postgres
  connection string from Supabase dashboard → Project
  Settings → Database → Connection string (URI mode).
  Required by `scripts/operator-apply.mjs` only; runtime
  code paths don't use it.
- **Run `pnpm db:apply-pending`** once locally. The
  script:
  - Creates `public.applied_migrations` on first run
    (bootstrap).
  - Detects whether the previously-applied migrations
    (phase-16, phase-21, phase-22, phase-26, phase-27)
    are already partially-present in the schema; warns
    the operator if so + offers a `--mark-applied <file>`
    one-line escape hatch (out of scope for v1 — simplest
    path is described in the new AUDIT row).
  - Applies every other pending migration in lex order.
- After the first run, the loop ships future phases'
  migrations the same way; the script picks them up
  automatically on the next `pnpm db:apply-pending`.

## Routes / endpoints (locked from bearings)

**Adds `/admin/migrations` to the URL contract.** Same
shape as `/admin`: anon → `/signin?next=/admin/migrations`;
authed-non-admin → 404; admin → render.

| Route | Method | Auth | Body / Render |
|---|---|---|---|
| `GET /admin/migrations` | server-rendered | admin (via `requireAdmin`) | Read-only status table: filename × state × applied_at |

The bearings URL contract grows by one entry; the URL
walker (`e2e/url-contract.ts`) gets the matching
redirect-on-anon entry.

## Library / helpers (new code)

**Created:**

- `db/migrations/20260521_phase_30_applied_migrations.sql`
  — bootstrap migration. Creates
  `public.applied_migrations` (filename text primary key,
  applied_at timestamptz not null default now(),
  applied_by text). RLS enabled; no policies for
  authenticated users — only the service role writes (via
  the script). The script's first run executes this
  migration before tracking anything.
- `scripts/operator-apply.mjs` — Node.js script.
  - Loads `.env`; requires `SUPABASE_DB_URL`.
  - Connects via `pg.Client`.
  - In a transaction: `CREATE TABLE IF NOT EXISTS
    public.applied_migrations ...` (bootstrap;
    idempotent).
  - Reads `db/migrations/*.sql` sorted lex.
  - For each: checks applied_migrations; if absent,
    runs the SQL in a transaction, inserts the row on
    success, rolls back on failure with a clear
    message naming the failing file.
  - Prints a summary: N applied, M skipped (already
    tracked), 0 failed.
  - Exits non-zero on first failure.
- `lib/admin/migrations.ts` — server-side helpers.
  - `loadAppliedMigrations(supabase): Promise<AppliedMigration[]>`
    where `AppliedMigration = { filename, appliedAt }`.
    Reads via the typed Supabase client; service-role
    not required (auth user with admin role reads via
    `requireAdmin`).
  - `listMigrationFiles(): string[]` — synchronous
    `fs.readdirSync('db/migrations')`, filters to
    `.sql`, returns sorted lex.
- `lib/admin/__tests__/migrations.test.ts` —
  `loadAppliedMigrations` against a mocked Supabase
  client (assertion shape mirrors phase-23 admin queries
  tests); `listMigrationFiles` against the real
  filesystem (the migrations directory ships with the
  repo).
- `app/admin/migrations/page.tsx` — server component.
  - `requireAdmin`.
  - Reads `loadAppliedMigrations` + `listMigrationFiles`
    server-side.
  - Renders breadcrumb (`boardroom · admin / migrations`),
    H1 "Migrations.", then a `<table>` of filename ×
    state × applied_at.
  - Each row reads "applied <ISO date>" or "pending".
  - No write actions.
- `app/admin/migrations/__tests__/page.test.tsx` —
  mocks `requireAdmin` + the loaders; asserts the
  table renders both applied + pending states + the
  state count summary at the top.
- `components/admin/migrations-table.tsx` — small mono
  primitive: `{ rows: { filename: string; appliedAt:
  string | null }[] }`. Two-column layout; mono font
  matches the existing `UsageTile` design.
- `components/admin/__tests__/migrations-table.test.tsx`
  — asserts the row count + the "pending" / "applied
  <date>" rendering branches.

**Edited:**

- `package.json` — new `"db:apply-pending":
  "node scripts/operator-apply.mjs"` script; `pg` added
  to `dependencies` (NOT devDependencies — though only
  the operator script imports it, keeping it in
  dependencies simplifies the Vercel build's package
  install). The legacy `db:migrate` script stays put as
  the stub it is today; a comment in `scripts/db-migrate.mjs`
  points future readers at `operator-apply.mjs`.
- `lib/supabase/database.types.ts` — add
  `applied_migrations` table type (Row + Insert).
- `plan/bearings.md` — URL contract grows by one row:
  `/admin/migrations  Read-only operator status table:
  which db/migrations/*.sql files are applied.`
- `e2e/url-contract.ts` — new authed-redirect entry for
  `/admin/migrations`.
- `app/admin/page.tsx` — small footer link added at the
  bottom: "→ Migrations status" pointing to
  `/admin/migrations`. One-line edit. Existing tests
  untouched (the existing admin-page test doesn't pin
  link inventory).
- `plan/AUDIT.md` — the 5 pending operator-migration
  rows (BYOK / ADMIN_EMAILS / phase-16 / phase-21 /
  phase-22) are each marked
  `**Resolved by consolidation 2026-05-21 at phase 30
  ship.**` with a one-line pointer to the new row. A
  new `[operator]` row replaces them: "Enable
  operator-batch: set `SUPABASE_DB_URL` + run
  `pnpm db:apply-pending`." The `[operator] ADMIN_EMAILS`
  row and the `[operator] magic-link inbox` row stay
  separate (different operator concerns — env-only +
  e2e respectively); only the 5 migration-shaped rows
  consolidate.

## Constants

`lib/admin/migrations.ts`:
```ts
export const MIGRATIONS_DIR = 'db/migrations'
```

## Cross-links

**In** (verify still wired):
- `lib/auth/admin.ts` `requireAdmin` — gate
  `/admin/migrations`.
- `lib/supabase/server.ts` `createServerClient` — read
  applied_migrations on the page.

**Out** (ship):
- `scripts/operator-apply.mjs`.
- `public.applied_migrations` table + row writes from
  the script.
- `/admin/migrations` page family.
- `lib/admin/migrations.ts` helpers.

**Retro-fit:**
- `app/admin/page.tsx` adds a one-line link to
  `/admin/migrations`. Existing tests + a11y/perf
  surface untouched.

## SEO / metadata

`generateMetadata` returns `{ robots: { index: false,
follow: false }, title: 'Migrations · boardroom admin' }`.
Mirrors `/admin`'s `noindex` shape.

## Hero / body / sub-section composition

```
boardroom · admin / migrations

Migrations.

5 applied · 0 pending

filename                                                state         applied_at
20260516_phase_7_sessions.sql                           applied       2026-05-16T...Z
20260516_phase_8_flag_audit.sql                         applied       2026-05-16T...Z
20260518_phase_16_token_usage.sql                       applied       2026-05-21T...Z
…
20260521_phase_30_applied_migrations.sql                applied       2026-05-21T...Z
```

When `loadAppliedMigrations` throws (the bootstrap
migration hasn't been applied yet), the page renders a
single line: "applied_migrations table not yet
bootstrapped — run `pnpm db:apply-pending` from a shell
with `SUPABASE_DB_URL` set."

## Empty / loading / error states

- **First-ever load (bootstrap not run):** the page
  catches the "relation does not exist" error and
  renders the bootstrap message. No table.
- **Some migrations applied, some pending:** table
  rendered; "pending" rows show `—` for applied_at.
- **All migrations applied:** table rendered; summary
  reads "N applied · 0 pending."

## Decisions made upfront — DO NOT ASK

- **`pg` (`node-postgres`) for the script, not
  `supabase-js`.** The supabase-js client doesn't expose
  generic SQL execution; it's RPC-only. `pg` is the
  standard for Node-side raw SQL + transactions. Adding
  it as a dependency is a one-line change, doesn't bloat
  the client bundle (script-only), and matches the
  existing operator-script pattern.
- **`SUPABASE_DB_URL` as a new env var.** The operator
  already has `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
  The Postgres connection string is the
  database-direct alternative; available from the same
  Supabase dashboard. The trade-off vs. a service-role
  RPC approach: pg connection is more flexible + faster
  to iterate, and migrations are operator-only — they
  don't need to be portable to the browser.
- **Bootstrap the applied_migrations table inside the
  script.** Avoids the chicken-and-egg of "you have to
  apply a migration to enable the migration runner."
  The script does `CREATE TABLE IF NOT EXISTS` as its
  first action.
- **Migration tracking is by filename, not content hash.**
  Filenames are sortable + lexically unique by date
  prefix; hashing would require re-tracking when a
  migration is edited in place (which we don't do —
  shipped migrations are immutable per convention).
- **No `--mark-applied` flag in v1.** Operators who
  already applied some migrations manually need a way
  to pre-populate applied_migrations without re-running
  the SQL. v1 punts this to the AUDIT row's
  walkthrough: "open the SQL editor, run
  `INSERT INTO public.applied_migrations (filename)
  VALUES ('<file>') ON CONFLICT DO NOTHING;` for each
  already-applied file before running
  `pnpm db:apply-pending`." A `--mark-applied` flag is
  a clean follow-up if the manual SQL annoys.
- **`/admin/migrations` is read-only.** No "apply now"
  button in the UI. The operator must run the script
  from a shell with environment access. Keeps the
  blast radius zero and respects the
  "admin surface is observation, not modification"
  contract phase 23 established.
- **The script exits non-zero on first failure.** Don't
  apply later migrations if an earlier one failed; the
  state would be ambiguous.
- **Each migration runs in its own transaction**, not
  one big transaction. If migration #3 fails, #1 + #2
  stay applied; the operator can investigate #3
  without losing partial progress.
- **`migrations-table.tsx` mirrors `usage-tile.tsx`
  visual register** (mono + ink-muted). Admin surface
  is single-style.
- **AUDIT row consolidation lists the 5 superseded
  rows by their existing titles.** Future audits can
  see the consolidation history; the new row's body
  links each one back.
- **No SEO / OG image** on `/admin/migrations` — it's
  `noindex` like the rest of `/admin`.
- **The `pg` connection closes deterministically** at
  the end of the script (`client.end()` in a `finally`
  block). Long-lived connections in a one-shot script
  would hold the operator's terminal open.

## Mobile reflow / responsive

The table is single-column-stacked at 375px (each row
becomes a small two-line block: filename / status). At
desktop, four columns. Mobile is a low-priority surface
for `/admin/*`; the same pattern as the existing
`/admin` page where breakpoints are utilitarian rather
than designed.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `scripts/operator-apply.mjs` | none — operator tool; CI runs would mutate the live DB. Manual smoke test on first operator use. | — |
| `lib/admin/migrations.ts` | `loadAppliedMigrations` against mocked supabase; `listMigrationFiles` against real filesystem (reads `db/migrations/`) | — |
| `app/admin/migrations/page.tsx` | mocked `requireAdmin` + loaders; renders table + bootstrap-not-run fallback | — |
| `components/admin/migrations-table.tsx` | applied + pending branch rendering | — |
| existing `/admin` page | small footer-link addition; existing test unchanged (no assertion on link inventory) | — |
| existing redirect specs | `/admin/migrations` joins `URL_CONTRACT` with `redirect-to-signin-with-next` shape; bearings sync test continues to pass | — |

## Hermetic e2e registration

No new hermetic e2e. The URL-contract walker covers
`/admin/migrations` via the anon-redirect leg; authed
walk is operator-gated (Chrome MCP unavailable, see
`[needs-user-call]` row).

## Verify gate

```bash
pnpm verify
```

Runs typecheck → test:run → data:validate → build → e2e.
**Each leg is a hard gate.**

## Commit body template

```
feat: operator-batch one-shot apply + /admin/migrations status — phase 30

- scripts/operator-apply.mjs: connects to SUPABASE_DB_URL
  via pg, bootstraps public.applied_migrations on first
  run, applies every pending db/migrations/*.sql in lex
  order. Each migration runs in its own transaction;
  filename + applied_at recorded on success; non-zero exit
  on first failure.
- db/migrations/20260521_phase_30_applied_migrations.sql:
  bootstrap migration creating public.applied_migrations
  (filename primary key, applied_at, applied_by). RLS on;
  no authenticated-user policies (service-role / direct-pg
  writes only).
- lib/admin/migrations.ts: loadAppliedMigrations +
  listMigrationFiles helpers. MIGRATIONS_DIR constant.
- lib/admin/__tests__/migrations.test.ts: query helper +
  filesystem walker tests.
- app/admin/migrations/page.tsx + components/admin/
  migrations-table.tsx: env-gated read-only status page
  + the table primitive. Bootstrap-not-run state renders
  a one-line instruction.
- app/admin/migrations/__tests__/page.test.tsx +
  components/admin/__tests__/migrations-table.test.tsx:
  page + primitive tests.
- package.json: `db:apply-pending` script; `pg` added to
  dependencies (script-only import, doesn't reach the
  browser bundle).
- lib/supabase/database.types.ts: applied_migrations Row +
  Insert types added.
- plan/bearings.md + e2e/url-contract.ts: URL contract
  grows by `/admin/migrations`.
- app/admin/page.tsx: one-line footer link to
  /admin/migrations.
- plan/AUDIT.md: 5 pending operator-migration rows
  (BYOK / phase-16 / phase-21 / phase-22 / key_origin)
  marked **Resolved by consolidation 2026-05-21 at phase
  30 ship.** New [operator] row: "Enable operator-batch:
  set SUPABASE_DB_URL + run pnpm db:apply-pending."
  ADMIN_EMAILS + magic-link inbox rows stay separate
  (different concerns).

Decisions:
- pg over supabase-js for the script — supabase-js is
  RPC-only; pg is the standard for raw SQL + transactions.
- SUPABASE_DB_URL as a new env var; available from the
  Supabase dashboard alongside the URL/key the operator
  already has.
- Bootstrap inside the script (CREATE TABLE IF NOT
  EXISTS) — avoids chicken-and-egg.
- Migration tracking by filename, not content hash —
  shipped migrations are immutable by convention.
- No --mark-applied flag in v1; operators with already-
  applied migrations seed applied_migrations via SQL
  editor before running the script (walkthrough in the
  new AUDIT row).
- /admin/migrations is read-only; no "apply now" button.
  Operator runs the script from a shell.
- Each migration in its own transaction; non-zero exit
  on first failure — partial progress preserved.

Operator action: set SUPABASE_DB_URL (Supabase dashboard
→ Project Settings → Database → Connection string); run
pnpm db:apply-pending. The 5 previously-pending
[operator] AUDIT rows are now satisfied by one action.

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 30's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash.

Update `plan/AUDIT.md`: 5 prior operator-migration rows
marked **Resolved by consolidation**; new row added.

## Follow-ups (out of scope this phase)

- **`--mark-applied <file>` flag** on
  `scripts/operator-apply.mjs` for operators who applied
  migrations manually before phase 30 shipped. Punted to
  a follow-up — the manual SQL escape hatch in the AUDIT
  row covers v1.
- **`/admin/migrations` "apply now" button.** Adds write
  capability to the admin surface. Real consideration:
  blast radius (a click could mutate prod schema). Defer
  unless the operator-batch flow proves inconvenient.
- **Migration rollback support.** Out of v1 scope; shipped
  migrations are forward-only by convention.
- **Per-environment migration tracking** (dev vs preview
  vs prod). Right now operator-apply runs against
  whatever `SUPABASE_DB_URL` points at. A multi-env
  setup would need per-env applied_migrations or
  database introspection at apply time.
- **CI gate to enforce migration files are immutable
  once committed.** Re-editing a shipped migration is
  the failure mode that filename-based tracking can't
  catch. Adding a CI step that checks the git history
  of `db/migrations/*` is the right safety net.
