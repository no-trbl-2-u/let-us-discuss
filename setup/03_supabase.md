# Supabase setup — boardroom

> **PARTIAL.** Phase 2 has landed: typed clients exist
> (`lib/supabase/{server,client,diag}.ts`), `/_diag` round-trips
> a Supabase probe, and `.env` carries the three keys. Auth
> section is still **PARTIAL** — magic-link configuration
> (Section C) and the first migration (Section D) ship in
> phase 3.
>
> **Account:** TBD (the user's personal Supabase account)
> **Region:** Pick the region closest to Vercel's primary
> serverless region (US-East default unless the user specifies)
> **Dashboard:** https://supabase.com/dashboard

See `../../nexus/customization/external-services.md`.

---

## What boardroom needs from Supabase

- **Postgres** — sessions, transcripts, artifacts, `flag_audit`,
  `token_usage`, `users` (auth schema is managed).
- **Auth** — magic-link sign-in only (no password fields in v1).
- **(Future)** Storage for downloadable artifact archives —
  post-v1; v1 downloads are client-side.

## What Supabase is NOT doing (deferred)

- Supabase Edge Functions — not used; server actions in the
  Next.js app are the API surface.
- Supabase Realtime — out of v1; sessions are single-user.
- Branching — out of v1 (small team; cheap to drop and rebuild
  a dev project).

---

## Section A — Project creation

Path: https://supabase.com/dashboard/new

- [ ] Project name: `boardroom`
- [ ] Database password: generate a long random; store in 1Password
- [ ] Region: nearest to the Vercel primary region

## Section B — Capture keys (PARTIAL — local `.env` populated; Vercel mirror still required)

Path: Project → Settings → API

- [x] `SUPABASE_URL` ← Project URL
- [x] `SUPABASE_ANON_KEY` ← anon public
- [x] `SUPABASE_SERVICE_ROLE_KEY` ← service_role (server-only)
- [ ] Mirror into Vercel env vars per `02_vercel.md` Section B
      (include `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
      — phase 3 reads them from the browser bundle)
- [x] Mirror into local `.env`

### Diagnostic route (`/diag`)

Phase 2 ships a guarded diagnostic route at `/diag` that runs a
Supabase `auth.getSession()` probe and renders the result.

- The route returns **404** unless `DIAG_ENABLED=1` is present
  at runtime.
- Set `DIAG_ENABLED=1` locally in `.env` and on Vercel **preview**
  environment only. **Never set on production.**
- The probe is intentionally light (no tables exist yet); phase 3
  upgrades it to touch `auth.users` once the first migration
  ships.

## Section C — Auth (magic-link, phase 3)

Path: Project → Authentication → Providers

- [ ] Enable Email provider
- [ ] Magic Link enabled; password sign-in disabled
- [ ] Email confirmations: **required** for new accounts
- [ ] Site URL: `https://let-us-discuss.vercel.app`
      (Vercel project is `let-us-discuss`; preview URLs follow
      `let-us-discuss-*.vercel.app`. If you later rename the
      Vercel project to `boardroom-breakdown`, update this
      Site URL and the redirect URLs below in the Supabase
      dashboard to match.)
- [ ] Redirect URLs (add all three):
      ```
      http://localhost:3000/auth/callback
      https://let-us-discuss.vercel.app/auth/callback
      https://*-tj-braindump.vercel.app/auth/callback
      ```
      The wildcard covers preview-deploy hostnames Vercel
      generates per push under the `tj-braindump` team.

Path: Authentication → Email Templates

- [ ] Magic Link template — voice baseline applied (terse,
      no marketing fluff). Copy lands in this section once
      phase 3 brief specifies it.

## Section D — Schema (lands incrementally per phase)

Migrations live in `db/migrations/*.sql`, versioned by
filename prefix. Phase 2 ships an empty `db/migrations/`
directory + a `pnpm db:migrate` script. Each later phase
appends one or more `.sql` files:

- Phase 3 — `users` extension (Supabase's `auth.users` is
  primary; product-level user prefs go in `public.profiles`).
- Phase 4 — `personas` + `templates` tables only if we move
  authoring into the product (we don't in v1; this row stays
  empty).
- Phase 7a — `sessions`, `turns`, `artifacts` (with RLS).
  See `db/migrations/20260516_phase_7_sessions.sql`.
- Phase 8 — `flag_audit` (with RLS). See
  `db/migrations/20260516_phase_8_flag_audit.sql`.
- Phase 9 — `daily_quotas`, `ip_rate_limits`.
- Phase 16 — `token_usage`.

RLS policies ship in the same migration as the table they
gate.

### Applying the phase 7 migration (operator action)

The phase 7a code ships against the schema described in
`db/migrations/20260516_phase_7_sessions.sql`. Apply it to
the project DB before the route is exercised:

```bash
# Option A — psql with the project's connection string
psql "$SUPABASE_DB_URL" -f db/migrations/20260516_phase_7_sessions.sql

# Option B — paste the file's contents into the Supabase SQL editor
#   https://supabase.com/dashboard/project/<ref>/sql
```

After the migration lands, regenerate the typed client:

```bash
pnpm db:types
```

The shipped `lib/supabase/database.types.ts` is a hand-written
placeholder that mirrors the migration so typecheck passes;
`pnpm db:types` overwrites it with the canonical output. Commit
the regen as a separate change (subject: `data: db types regen
post phase 7a`) so the operator step is visible in history.

## Section E — Cookie for `/critique`'s reader

- [ ] Sign in as a critique-bot user via magic-link
- [ ] Capture the session cookie value from the browser
- [ ] Drop into `.env` as `CRITIQUE_SESSION_COOKIE`
- [ ] Refresh out-of-band when the loop reports auth-failed

---

## Verification (run before unattended)

- [ ] `psql` against the Postgres URL returns `select 1` =>
      `1`.
- [ ] Magic-link delivery: trigger a sign-in; email arrives
      within 60s.
- [ ] `pnpm db:migrate` is idempotent against an already-up-
      to-date DB.
