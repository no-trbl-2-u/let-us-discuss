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

### [operator] Populate CRITIQUE_SESSION_COOKIE for /critique

- **Source:** oversight 2026-05-16
- **Score:** 2.5 (medium — only matters once /critique starts
  walking the authed surface, which gates on phase 5 ship +
  green deploy; the first /critique tick after phase 5 will
  fall back to anonymous-only without this).
- **Category:** config (operator action)
- **Summary:** `/critique`'s reader plays back this cookie to
  walk the authed surface. With it empty, the next /critique
  tick (after phase 5 ships) will only see public pages.
- **What to do:** Create a dedicated `critique-bot@…` account,
  sign in once via magic-link in browser, copy the Supabase
  session cookie from devtools, paste into `.env`. Rotate
  out-of-band when reader reports auth-failed.
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

### [operator] Update Supabase dashboard to let-us-discuss.vercel.app — resolved 2026-05-16

- **Resolved by:** operator confirmed via oversight 2026-05-16
  round 3. Site URL + redirect allow-list updated per
  `setup/03_supabase.md` Section C.
- **Effect:** magic-link clicks in production redirect to the
  current host, not the old one.
