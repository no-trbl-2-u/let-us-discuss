# Supabase setup — boardroom

> **READY.** All build-plan phases that touch Supabase have
> shipped (phases 2, 3, 7a, 7b, 8, 9, 16, 18). Typed clients,
> magic-link auth, four-table schema with RLS, the moderation-
> audit table, the IP rate-limit counter, and account-deletion
> via the service-role admin client are all live. One operator-
> action follows: apply the phase-16 token-usage migration in
> Supabase (tracked in `plan/AUDIT.md`).
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

## Section C — Auth (magic-link, phase 3 — shipped at `eb5e302`)

Path: Project → Authentication → Providers

- [ ] Enable Email provider
- [ ] Magic Link enabled; password sign-in disabled
- [ ] Email confirmations: **required** for new accounts
- [ ] Site URL: `https://let-us-discuss-ai.vercel.app`
      (Vercel project is `let-us-discuss`; the bare
      `let-us-discuss.vercel.app` host was already taken,
      so the canonical alias is `let-us-discuss-ai.vercel.app`
      — see `plan/bearings.md` L27. Preview URLs follow
      `let-us-discuss-*-tj-braindump.vercel.app`.)
- [ ] Redirect URLs (add all three):
      ```
      http://localhost:3000/auth/callback
      https://let-us-discuss-ai.vercel.app/auth/callback
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

- Phase 3 — relies on Supabase's `auth.users` directly; no
  separate `public.profiles` shipped (v1 doesn't need
  product-level user prefs).
- Phase 4 — personas + templates stay in repo as markdown +
  JSON (not in Postgres); no migration.
- Phase 7a — `sessions`, `turns`, `artifacts` (with RLS).
  See `db/migrations/20260516_phase_7_sessions.sql`.
- Phase 8 — `flag_audit` (with RLS). See
  `db/migrations/20260516_phase_8_flag_audit.sql`.
- Phase 9 — `ip_rate_limits` (RLS on; service-role only). See
  `db/migrations/20260516_phase_9_ip_rate_limits.sql`. (No
  separate `daily_quotas` table in v1 — per-account quota is
  derived by counting `sessions` over the last 24 hours.)
- Phase 16 — adds three columns to `public.sessions`
  (`prompt_tokens`, `completion_tokens`, `cost_cents`) —
  additive, defaults 0 so legacy rows render `—` in the
  session footer. See
  `db/migrations/20260518_phase_16_token_usage.sql`.
- Phase 18 — no migration. Account deletion cascades via
  the existing FK chain (`auth.users → sessions → turns /
  artifacts / flag_audit`) using the service-role admin
  client; no schema change needed.

RLS policies ship in the same migration as the table they
gate.

### Applying migrations (operator action per phase)

Each phase that adds a migration leaves the application code
cascade-safe — typed clients fall back when columns are
missing — so the app deploys green before the operator
applies the migration. Apply via:

```bash
# Option A — psql with the project's connection string
psql "$SUPABASE_DB_URL" -f db/migrations/<file>.sql

# Option B — paste the file's contents into the Supabase SQL editor
#   https://supabase.com/dashboard/project/<ref>/sql
```

Outstanding operator-action migrations are tracked in
`plan/AUDIT.md` (search for `[operator]` rows). As of
2026-05-18, **phase 16's token-usage migration is the only
unapplied row**.

After any migration lands, regenerate the typed client:

```bash
pnpm db:types
```

The shipped `lib/supabase/database.types.ts` is a hand-written
placeholder that mirrors the migrations so typecheck passes;
`pnpm db:types` overwrites it with the canonical Supabase
output. Commit the regen as a separate change (subject:
`data: db types regen post phase <N>`) so the operator step
is visible in history.

## Section E — Cookie for `/critique`'s reader

- [ ] Sign in as a critique-bot user via magic-link
- [ ] Capture the session cookie value from the browser
- [ ] Drop into `.env` as `SUPABASE_E2E_SESSION_COOKIE`
      (per `plan/bearings.md` L42 — the older name
      `CRITIQUE_SESSION_COOKIE` is documentation drift and
      no longer the variable the reader actually reads)
- [ ] Refresh out-of-band when the loop reports auth-failed

---

## Verification (run before unattended)

- [ ] `psql` against the Postgres URL returns `select 1` =>
      `1`.
- [ ] Magic-link delivery: trigger a sign-in; email arrives
      within 60s.
- [ ] `pnpm db:migrate` is idempotent against an already-up-
      to-date DB.
