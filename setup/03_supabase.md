# Supabase setup — boardroom

> **STUB.** Project not yet created. Phase 2 (Supabase wired)
> ships when the keys land in `.env`; phase 3 (auth) ships
> when magic-link is configured in the Auth section.
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

## Section B — Capture keys

Path: Project → Settings → API

- [ ] `SUPABASE_URL` ← Project URL
- [ ] `SUPABASE_ANON_KEY` ← anon public
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ← service_role (server-only)
- [ ] Mirror into Vercel env vars per `02_vercel.md` Section B
- [ ] Mirror into local `.env`

## Section C — Auth (magic-link, phase 3)

Path: Project → Authentication → Providers

- [ ] Enable Email provider
- [ ] Magic Link enabled; password sign-in disabled
- [ ] Email confirmations: **required** for new accounts
- [ ] Site URL: `https://boardroom-breakdown.vercel.app`
- [ ] Redirect URLs (add all three):
      ```
      http://localhost:3000/auth/callback
      https://boardroom-breakdown.vercel.app/auth/callback
      https://*.boardroom-breakdown.vercel.app/auth/callback
      ```

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
- Phase 6 — `sessions`, `messages`, `artifacts`.
- Phase 8 — `flag_audit`.
- Phase 9 — `daily_quotas`, `ip_rate_limits`.
- Phase 16 — `token_usage`.

RLS policies ship in the same migration as the table they
gate.

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
