# Site audit

> Latest findings from `/iterate audit`. Rewritten on each audit
> pass. Manual entries are allowed; `/iterate audit` should
> preserve rows whose source is `[oversight]` or `[user]`.

## Pending

### [operator] Wire magic-link inbox credentials for e2e walk

- **Source:** oversight 2026-05-16 (round 3 — follows resolution
  of [needs-e2e] below)
- **Score:** 3.0 (medium — without credentials the walk skips,
  so a regression in `signInWithOtp` / `/auth/callback` /
  Supabase Site-URL config can still ship green; with them the
  e2e guards the whole magic-link path).
- **Category:** config (operator action)
- **Summary:** `e2e/auth-flow.spec.ts` ships behind
  `MAGIC_LINK_INBOX_PROVIDER`; default `none` makes the spec
  test-skip. The Mailosaur path is wired in
  `e2e/helpers/magic-link-inbox.ts` (no SDK install needed —
  uses `fetch`). To light the spec up, populate the env block
  documented in `.env.example`.
- **What to do:** Pick one of the inbox options below; populate
  the matching env vars in local `.env` (so `pnpm e2e` walks the
  spec) and, if you want the walk in CI, in the GitHub Actions
  / Vercel preview env too.
- **Inbox options:**
  1. **Mailosaur** — purpose-built; per-test inbox + REST API.
     Paid (~$25/mo). Easiest API surface; already wired.
  2. **Gmail `+e2e@<account>`** — free; uses Gmail API +
     OAuth. More setup, but zero per-test cost. Not wired yet;
     `magicLinkInboxFromEnv` would need a `gmail-app-password`
     branch.
  3. **Resend test inbox / inbucket** — self-hosted/free
     options if you have the appetite. Not wired yet.
- **Owner:** user / operator.
- **/iterate skip:** this row is `[operator]` — `/iterate`
  should leave it pending and move on.

### [operator] Apply phase-16 token-usage migration in Supabase

- **Source:** /iterate audit 2026-05-18 (gap-filling pass —
  the action was called out in phase 16's commit body at
  `7171206` but never surfaced in this audit queue).
- **Score:** 3.0 (medium — without the migration, the
  `prompt_tokens` / `completion_tokens` / `cost_cents`
  columns don't exist on `public.sessions`. The Supabase
  writes from `accumulateSessionUsage` silently fail at the
  column level; the SessionUsageFooter renders `—` for
  every session forever. No user-visible error, just silent
  under-reporting until the migration runs).
- **Category:** config (operator action)
- **Summary:** `db/migrations/20260518_phase_16_token_usage.sql`
  is committed in the repo and adds three columns to
  `public.sessions` with `default 0`. The app code is
  cascade-safe and renders fallbacks for the missing data;
  shipping the migration just lights up the real numbers.
- **What to do:** Run `pnpm db:migrate` against the production
  Supabase project (or apply the SQL file directly in the
  Supabase SQL editor). Verify by opening any post-migration
  authed session at `/app/sessions/[id]` and confirming the
  footer shows non-`—` prompt/completion/cost values.
- **Owner:** user / operator.
- **/iterate skip:** this row is `[operator]` — `/iterate`
  should leave it pending and move on.

### [operator] Populate SUPABASE_E2E_SESSION_COOKIE for /critique

- **Source:** oversight 2026-05-16 (renamed from
  `CRITIQUE_SESSION_COOKIE` per oversight 2026-05-16 round 4 —
  `plan/bearings.md` L42 declares the env var the reader
  actually reads is `SUPABASE_E2E_SESSION_COOKIE`; the older
  name in `.env.example` is a documentation drift that 7a /
  the next operator pass should clean up).
- **Score:** 3.0 (was 2.5 — bumped because /critique pass 1
  already proved this is a real blocker; the authed reader
  pass exited immediately with auth-failed).
- **Category:** config (operator action)
- **Summary:** `/critique`'s reader plays back this cookie to
  walk the authed surface. With it empty, the next /critique
  tick will only see public pages — confirmed by pass 1's
  `auth-failed` finding in `plan/CRITIQUE.md`.
- **What to do:** Create a dedicated `critique-bot@…` account,
  sign in once via magic-link in browser, copy the resulting
  `sb-<project>-auth-token` cookie from devtools, paste into
  `.env` as `SUPABASE_E2E_SESSION_COOKIE`. Rotate out-of-band
  when reader reports auth-failed.
- **Documentation drift cleanup:** done 2026-05-18 (this
  audit pass) — `.env.example` and `setup/03_supabase.md` both
  now name `SUPABASE_E2E_SESSION_COOKIE` correctly.
- **Owner:** user / operator.
- **/iterate skip:** same as above.

## Resolved

### [needs-e2e] Magic-link sign-in walk — resolved 2026-05-16

- **Resolved by:** `4b42d68` (e2e spec + helper + env scaffold) +
  follow-up playwright config fix excluding the vitest helper
  test from spec discovery.
- **What shipped:** `e2e/auth-flow.spec.ts` walks `/signin →
  inbox → /app` when a provider is configured; pluggable
  inbox factory in `e2e/helpers/magic-link-inbox.ts` (Mailosaur
  REST, no SDK install); helper unit tests under
  `e2e/helpers/__tests__/`; `.env.example` documents the env
  block; `playwright.config.ts` propagates the vars to the
  webServer.
- **Skip-by-default:** with `MAGIC_LINK_INBOX_PROVIDER` unset
  the spec test-skips, keeping verify green until an operator
  lights it up. The follow-up to actually walk the link is
  captured above as `[operator] Wire magic-link inbox
  credentials`.
- **Phase-5 unblock:** the gate documented in oversight round
  2 (5516cde) is satisfied — phase 5 (boardroom canonical) is
  no longer blocked on this row.

### [operator] Mirror Supabase keys into NEXT_PUBLIC vars — resolved 2026-05-16

- **Resolved by:** operator confirmed via oversight 2026-05-16
  round 3. `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` populated in local `.env` and
  in the Vercel project env (Production + Preview).
- **Effect:** middleware no longer fails closed on authed
  traffic; magic-link sign-in can land on `/app`.

### [operator] Update Supabase dashboard to let-us-discuss-ai.vercel.app — resolved 2026-05-16

- **Resolved by:** operator confirmed via oversight 2026-05-16
  round 3. Site URL + redirect allow-list updated per
  `setup/03_supabase.md` Section C.
- **Effect:** magic-link clicks in production redirect to the
  current host, not the old one.
- **Note:** The original row title named `let-us-discuss.vercel.app`,
  which was the wrong host — the actual canonical alias is
  `let-us-discuss-ai.vercel.app` (the bare `.vercel.app` host was
  already taken). Corrected via oversight 2026-05-16 round 5; the
  operator's dashboard update presumably used the working host.
