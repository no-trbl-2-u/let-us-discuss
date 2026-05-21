# Site audit

> Latest findings from `/iterate audit`. Rewritten on each audit
> pass. Manual entries are allowed; `/iterate audit` should
> preserve rows whose source is `[oversight]` or `[user]`.

> **Bias: voice + comprehension** (set via oversight 2026-05-20
> round 15). The cast-count drift findings on `/about/personas`
> + the landing copy (rooted in phase 21 making Secretary
> public) are still pending across pass 10 + 11; `/iterate`
> should weight voice + comprehension findings 1.5x next tick
> so the trio drains in 1–3 ticks instead of lagging behind the
> phase-ship cadence.

> **Operator migration batch (oversight 2026-05-20, round 15):**
> Four `[operator]` rows below queue: three Supabase migrations
> (phase 16 token usage, phase 21 secretary, phase 22 retros)
> plus the phase 23 `ADMIN_EMAILS` env. Phases 23/24/25 have all
> shipped, so the round-13 "batch after phase 23 ships" trigger
> is met. An ELI5 walkthrough for applying all four lives at
> `setup/operator-batch.md` (filed this round at the user's
> request). Until applied: SessionUsageFooter renders `—` for
> every session, phase 21's secretary turns silently drop at
> the DB, phase 22's retro loop is a no-op, and `/admin` 404s
> for every user. `/iterate` continues to skip these rows per
> the `[operator]` contract until the operator confirms they're
> applied.

## Pending

### [operator] Enable BYOK — set `BYOK_MASTER_KEY` + apply phase-26 migration

- **Source:** phase 26 ship (commit pending)
- **Score:** 3.0 (medium — without both ops, the settings panel
  renders "BYOK is not enabled" and `/api/byok/*` returns 503;
  the rest of the app is unaffected. Once both ops are applied,
  users can paste / rotate / revoke their Anthropic API key
  from `/app/settings/api-key`. Phase 27 reads the encrypted
  key from the orchestrator).
- **Category:** config (operator action)
- **Summary:** Phase 26 ships the BYOK foundation. Two ops are
  required to light it up:
  1. **Env:** `BYOK_MASTER_KEY` — a 32-byte random value
     base64-encoded. Generate via
     `openssl rand -base64 32`. The app decodes this and uses
     it as the AES-256-GCM master for every encrypt / decrypt
     on the user-key column. **Once set, do not rotate
     without a follow-up re-encryption migration** — every
     row stored under the old key becomes unreadable when
     the env value changes. Set in local `.env` + Vercel
     Project Env (Production + Preview).
  2. **Migration:** `db/migrations/20260520_phase_26_byok.sql`
     creates `public.user_api_keys` + `public.user_api_key_audit`
     with RLS pinned to `auth.uid()`. Run `pnpm db:migrate`
     against the production Supabase project, or paste the
     SQL into the Supabase SQL editor.
- **What to do:** Both ops. Verify by signing in as any user,
  visiting `/app/settings/api-key`, pasting a key, confirming
  the masked summary renders + the audit log shows an `add`
  event. Revoke + re-add to confirm the `rotate` / `revoke`
  paths both write to the audit log.
- **Owner:** user / operator.
- **/iterate skip:** this row is `[operator]` — `/iterate`
  should leave it pending and move on.

### [operator] Set `ADMIN_EMAILS` for the /admin dashboard

- **Walkthrough:** `setup/operator-batch.md` Step 4.
- **Source:** phase 23 ship (commit pending)
- **Score:** 3.0 (medium — without `ADMIN_EMAILS`, the
  `/admin` route 404s for every authed user. The page is
  the operator surface for usage / cost / flag-rate visibility;
  no UX regression for end-users, but operators can't see
  the dashboard until this env is set).
- **Category:** config (operator action)
- **Summary:** Phase 23 ships an env-gated admin dashboard.
  `lib/auth/admin.ts` reads `ADMIN_EMAILS` (comma-separated)
  and renders `/admin` only for matching email addresses;
  every other authed user gets a 404. With the env unset,
  no one is admin and the route is functionally a 404 to
  everyone.
- **What to do:** Set `ADMIN_EMAILS` in `.env` (local) and
  in the Vercel Project Env (Production + Preview).
  Comma-separated list of admin emails — typically the
  operator's own email as the bootstrap. Example:
  `ADMIN_EMAILS=ops@example.com,alice@example.com`.
- **Owner:** user / operator.
- **/iterate skip:** this row is `[operator]` — `/iterate`
  should leave it pending and move on.

### [needs-user-call] Three framework-spec questions raised by the distilled nexus-porting analysis

- **Source:** oversight 2026-05-20 round 14 (deferred from the
  "Open questions" section of the now-distilled
  `ideas-for-the-skills.md` — content captured as 7 candidate
  rows in `plan/PHASE_CANDIDATES.md` (Ideas 1–7) before the
  source doc was deleted).
- **Score:** 3.5 (medium — none of the three answers block an
  in-flight phase, but each becomes load-bearing the moment
  the relevant candidate is promoted. Holding the questions
  here prevents drift while the related candidates wait).
- **Category:** spec
- **The three questions (verbatim from the source doc):**
  1. Does `bearings.md` belong in `src-ai-skills/` (portable
     spec) or in boardroom's product config (implementation
     choice)? Argument for spec: it's the durable companion
     to `retros.md`, which is already in the spec. Argument
     for product: not every fork wants standing decisions.
     **Gates:** Idea 2 candidate (topic-level `bearings.md`).
  2. Should the orchestrator hard-enforce
     `CLARIFY-QUESTION-FORMAT.md` (reject + retry) or
     soft-enforce (document and trust personas)? Hard-enforce
     is robust but adds latency on malformed retry;
     soft-enforce is fast but lets bad questions through.
     **Gates:** Idea 1 candidate (`CLARIFY-QUESTION-FORMAT.md`).
  3. Is the autonomy spectrum (Idea 7) a framework concept or
     a product concept? Affects whether it lives in
     `src-ai-skills/` or in `plan/`.
     **Gates:** Idea 7 candidate (autonomy spectrum doc).
- **Disposition:** Defer all three until the relevant
  candidate is promoted; answer each in that phase's brief
  where the scope context is fresh. Re-asking in the
  abstract before promotion risks a stale call by the time
  the phase actually ships.
- **What to do:** When `/oversight` (or `/expand`) promotes
  Idea 1, 2, or 7, lift the matching question into the
  phase brief's Open Questions section and resolve it there.
- **Owner:** user.
- **/iterate skip:** this row is `[needs-user-call]` —
  `/iterate` should leave it pending and move on.

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
- **oversight 2026-05-18 round 7:** explicitly deferred —
  operator not planning to wire Mailosaur soon. Row stays
  pending; loop continues to skip per `[operator]` contract.
- **/iterate skip:** this row is `[operator]` — `/iterate`
  should leave it pending and move on.

### [operator] Apply phase-16 token-usage migration in Supabase

- **Walkthrough:** `setup/operator-batch.md` Step 1.
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
- **oversight 2026-05-18 round 7:** explicitly deferred —
  operator not planning to apply the migration soon. The
  SessionUsageFooter renders `—` for all sessions until then;
  no functional regression. Row stays pending.
- **/iterate skip:** this row is `[operator]` — `/iterate`
  should leave it pending and move on.

### [operator] Apply phase-21 secretary migration in Supabase

- **Walkthrough:** `setup/operator-batch.md` Step 2.
- **Source:** oversight 2026-05-19 round 12 (backfill — phase 21's
  commit body at `fada1d9` promised this row but the shipping
  never filed it).
- **Score:** 4.0 (medium-high — phase 21's secretary turns can't
  persist until the migration runs. The orchestrator catches the
  DB error via the existing `appendTurn` try/catch and logs to
  the structured drain, then proceeds — sessions complete the
  five core phases, but the secretary's structured-log turns are
  silently dropped at the DB boundary and `artifacts.secretary_log`
  is unwritable, so the fourth artifact tile renders the `—`
  sentinel forever).
- **Category:** config (operator action)
- **Summary:** `db/migrations/20260519_phase_21_secretary.sql`
  widens the `turns.author` check constraint to allow
  `'secretary'` and adds an `artifacts.secretary_log text not
  null default ''` column. Additive only; existing rows get the
  empty-string default.
- **What to do:** Run `pnpm db:migrate` against the production
  Supabase project (or paste the SQL into the Supabase SQL
  editor). Verify by walking one full authed session and
  confirming the boardroom shelf shows the "Plus the Secretary"
  eyebrow + the artifact grid surfaces a non-empty
  "secretary-log.md" tile.
- **Owner:** user / operator.
- **/iterate skip:** this row is `[operator]` — `/iterate`
  should leave it pending and move on.

### [operator] Apply phase-22 retros migration in Supabase

- **Walkthrough:** `setup/operator-batch.md` Step 3.
- **Source:** oversight 2026-05-19 round 12 (backfill — phase 22's
  commit body at `3465e5c` promised this row but the shipping
  never filed it).
- **Score:** 4.0 (medium-high — phase 22's wrapper phases write
  to the `retros` table + extended `turns.phase` / `sessions.status`
  values. Without the migration: the retro-review prompt is
  silently skipped because `loadRetros` returns `[]` on the
  failed query; the retrospective turn fires but `appendRetro`
  fails at the DB boundary and the orchestrator logs + proceeds
  to `session.done`. The cross-session learning loop is
  effectively a no-op in prod until the SQL lands).
- **Category:** config (operator action)
- **Summary:** `db/migrations/20260519_phase_22_retros.sql`
  creates `public.retros` with RLS + a user-scoped index, and
  widens the `turns.phase` + `sessions.status` check constraints
  to accept `'retro-review'` and `'retrospective'`.
- **What to do:** Run `pnpm db:migrate` against the production
  Supabase project (or paste the SQL into the Supabase SQL
  editor). This migration depends on no prior phase-21 SQL —
  the two are independent. Verify by walking two consecutive
  authed sessions and confirming the second session opens with
  a "Recent retros" checkpoint listing items from the first.
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
- **oversight 2026-05-18 round 7:** explicitly deferred —
  operator not planning to mint the bot cookie soon. Authed
  `/critique` passes remain blocked; `/app/*` surfaces stay
  observed-only via unit tests + the URL-contract walker's
  redirect check. Row stays pending.
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
