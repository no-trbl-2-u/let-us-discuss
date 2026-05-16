# Site audit

> Latest findings from `/iterate audit`. Rewritten on each audit
> pass. Manual entries are allowed; `/iterate audit` should
> preserve rows whose source is `[oversight]` or `[user]`.

## Pending

### [needs-e2e] Magic-link sign-in walk — **BLOCKS phase 5**

- **Source:** oversight 2026-05-16 (phase 3 brief filed as
  follow-up; lifted here for visibility; upgraded to phase-5
  blocker per /oversight 2026-05-16 round 2)
- **Score:** 4.5 (was 4.0 — bumped because phase 5 is now
  gated on this row landing first; without it, the canonical-
  sibling deploy ships behind an unverified auth path).
- **Category:** test
- **Summary:** The phase 3 verify gate covers `/signin` render
  + `/app → /signin` redirect, but **does not** walk a real
  magic link end-to-end. A regression in `signInWithOtp`,
  `/auth/callback`, or Supabase Site-URL config can ship green.
- **What to ship:** A Playwright e2e that hits `/signin`,
  submits a real test-inbox email, pulls the link, follows it,
  asserts landing at `/app` as the test user. Helper mailbox
  pinned in `.env.example` so the loop can run it; suggested
  options below.
- **Inbox options to evaluate (pick one):**
  1. **Mailosaur** — purpose-built; per-test inbox + REST API.
     Paid (~$25/mo). Easiest API surface.
  2. **Gmail `+e2e@<account>`** — free; uses Gmail API +
     OAuth. More setup, but zero per-test cost.
  3. **Resend test inbox / inbucket** — self-hosted/free
     options if you have the appetite.
- **When:** **before phase 5 ships.** The next /march tick
  should dispatch /iterate (this row scores ≥ 3.0; iterate
  takes the top finding).
- **Owner:** `/iterate` next tick.

### [operator] Mirror Supabase keys into NEXT_PUBLIC vars

- **Source:** oversight 2026-05-16
- **Score:** 4.0 (high — middleware fails closed without this;
  even a successful magic-link sign-in won't land on /app).
- **Category:** config (operator action; can't be fixed by
  the loop)
- **Summary:** Local `.env` has `SUPABASE_URL` /
  `SUPABASE_ANON_KEY` populated but the public mirrors
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  are empty. The middleware at `middleware.ts` reads the
  public mirrors at request time; absent values trigger the
  fail-closed redirect, so even an authed user lands back at
  `/signin`.
- **What to do:** Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY`
  into the `NEXT_PUBLIC_*` slots in `.env`. Mirror the same
  pair into the Vercel project's environment variables
  (Production + Preview).
- **Owner:** user / operator.
- **/iterate skip:** this row is `[operator]` — `/iterate`
  should leave it pending and move to the next-highest
  scoring row.

### [operator] Update Supabase dashboard to let-us-discuss.vercel.app

- **Source:** oversight 2026-05-16
- **Score:** 3.5 (medium-high — magic-link clicks in
  production redirect to the dashboard's configured Site URL;
  if that's still the old hostname, sign-in lands on a 404).
- **Category:** config (operator action)
- **Summary:** `setup/03_supabase.md` Section C documents the
  required dashboard updates: Site URL =
  `https://let-us-discuss.vercel.app`; Redirect URLs include
  the production host + the `*-tj-braindump.vercel.app`
  preview wildcard. None of this is checked in code.
- **What to do:** Sign in to the Supabase dashboard, walk
  Section C in `setup/03_supabase.md`, save.
- **Owner:** user / operator.
- **/iterate skip:** same as above; leave pending.

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
