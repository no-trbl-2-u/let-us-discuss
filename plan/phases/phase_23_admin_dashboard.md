# Phase 23 — Admin / dev dashboard

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

1. **A read-only `/admin` route lands** behind an env-pinned
   admin gate (`ADMIN_EMAILS` comma-separated list). Anonymous
   visitors get a redirect to `/signin?next=/admin`; authed
   visitors whose email is not in the list get a 404. Admins
   see a single-page tile grid.
2. **Five terse usage tiles** surface the data phase 16 + 8
   already collect — no new ingestion, only new queries:
   - **Sessions / day (last 7 days)** — count of `sessions`
     rows per UTC day.
   - **Tokens / day (last 7 days)** — sum of `total_tokens`
     per UTC day.
   - **Top-10 cost sessions** — the 10 highest-`cost_cents`
     sessions across all time, with session ID, user prefix,
     created date, cost, and token count.
   - **Flag rate (this week)** — count of `flag_audit` rows
     this week divided by sessions this week (one decimal).
   - **Error rate (this week)** — count of `sessions` with
     `status = 'aborted'` this week divided by total sessions
     this week (one decimal).
3. **No write actions in v1.** No "delete session," no
   "promote user," no "regenerate." Pure read surface. The
   admin role is operationally bounded to "look, don't
   touch."

## Prerequisite

Phases 1–22 shipped. The data the admin tiles read already
exists: phase 16 added `prompt_tokens / completion_tokens /
cost_cents` to `sessions`; phase 8 stood up `flag_audit`;
phase 9 added IP-rate-limit tracking. No new migrations.

## Dependencies (operator action required for runtime)

- **Set `ADMIN_EMAILS`** in `.env` (local) + Vercel Project
  Env. Comma-separated list of admin email addresses. Empty
  / unset → no admins; the page 404s for every authed user.
  An operator email lands as the bootstrap admin.
- **No migrations.** Phase 23 is pure query + render.

## Routes / endpoints (locked from bearings)

**Adds `/admin` to the URL contract.** The locked URL list in
`bearings.md` grows by one entry (documented in the same
commit). All other URLs unchanged.

| Route | Auth | Render |
|---|---|---|
| `GET /admin` | env-gated admin (authed; email ∈ ADMIN_EMAILS) | server-rendered tile grid |

Anonymous → redirect to `/signin?next=/admin`.
Authed-non-admin → 404 (via `notFound()` from `next/navigation`).
Authed-admin → render.

## Library / helpers (new code)

**Created:**

- `lib/auth/admin.ts` —
  - `isAdminEmail(email: string | null | undefined): boolean`:
    pure function that reads `ADMIN_EMAILS` from
    `process.env`, splits on comma, trims, lower-cases, and
    checks membership.
  - `requireAdmin(): Promise<User>`: composes `requireUser()`
    (redirects anonymous) and then calls `notFound()` if the
    user's email isn't an admin. Returns the typed user on
    success. The double-gate (redirect for anon, 404 for
    non-admin authed) is intentional — admins don't want
    civilians to know the URL exists.
- `lib/auth/__tests__/admin.test.ts` — covers:
  - empty / unset `ADMIN_EMAILS` → no admin matches.
  - comma-list with whitespace → all entries match.
  - case-insensitive match.
  - mixed casing in the input email still matches.
  - empty / null / undefined input email → false.
- `lib/admin/queries.ts` —
  - `loadSessionsPerDay(supabase, days): Promise<DayBucket[]>`
    — returns the count of sessions per UTC day for the last
    N days, oldest first. Each bucket: `{ day: 'YYYY-MM-DD',
    sessions: number }`. Missing days backfilled to 0.
  - `loadTokensPerDay(supabase, days): Promise<TokenBucket[]>`
    — `{ day, tokens: number, costCents: number }` per UTC
    day. Missing days backfilled to 0/0.
  - `loadTopCostSessions(supabase, limit): Promise<TopCostRow[]>`
    — returns `{ sessionId, userIdPrefix, costCents,
    totalTokens, createdAt }` for the N highest-cost
    sessions across all time. `userIdPrefix` is the first 8
    chars of the user UUID — enough for an admin to spot
    "user X has 4 of the top 10" without exposing full IDs.
  - `loadFlagAndErrorRates(supabase): Promise<RateSummary>`
    — `{ sessionsThisWeek, flagsThisWeek, abortedThisWeek,
    flagRate: number, errorRate: number }`. Rates rounded to
    one decimal (e.g. 0.18 → "18%"). "This week" = trailing
    7 days, UTC.
- `lib/admin/__tests__/queries.test.ts` — exercises each
  loader against a mocked supabase client. Asserts SQL
  shape via builder spy.
- `app/admin/page.tsx` — server component. Calls
  `requireAdmin()`; loads the five aggregates in parallel;
  renders the tile grid.
- `app/admin/__tests__/page.test.tsx` — mocks
  `requireAdmin` to return an admin user + mocks the
  loaders; asserts the five tiles render with the expected
  numbers; asserts the page is `noindex` (metadata export).
- `components/admin/usage-tile.tsx` — small primitive:
  header (mono caps), big number (serif), optional
  secondary line. Each tile gets one. Colocated test.
- `components/admin/top-cost-table.tsx` — terse list of the
  top-10 cost sessions. Mono columns, no row hover. Test
  for the empty-state and the populated state.
- `components/admin/daily-bars.tsx` — accepts the 7-day
  array and renders a compact text-row of `day · count`
  pairs. No SVG chart in v1 (design decisions:
  "Token budget is a monospace counter on the corner of the
  table, not a bar that fills" — same register here). Test.

**Edited:**

- `bearings.md` URL contract: append `/admin` row.

**No new SQL.** The five queries hit existing tables only.

## Constants

`lib/admin/queries.ts` exports:
```ts
export const ADMIN_RECENT_DAYS = 7
export const ADMIN_TOP_COST_LIMIT = 10
```

Both pinned in the same file for easy adjustment via PR. No
duplication into `lib/limits.ts` — the admin dashboard is
operationally scoped, not a user-facing contract.

## Session events + reducer

N/A. The admin page is server-rendered; no live data.

## Cross-links

**In** (verify still wired):
- Phase 16's `prompt_tokens / completion_tokens / cost_cents`
  columns are the source for tokens and top-cost tiles.
- Phase 8's `flag_audit` rows feed the flag rate.
- Phase 7's `sessions.status` ("aborted") feeds the error
  rate.

**Out** (ship):
- A new public URL family (`/admin`) joins the locked URL
  set in bearings.

**Retro-fit:**
- None. The page reads existing data; no upstream surface
  changes.

## SEO / metadata

`generateMetadata` returns `{ robots: { index: false,
follow: false }, title: 'admin · boardroom' }`. The page
must not appear in search; the bot user shouldn't index it.

## Hero / body / sub-section composition

Single page, no hero. Title row at top, then tiles. Layout:

```
─────────────────────────────────────────────────────
  admin                                  signed in as
  ──────                                 X@Y.Z (admin)

  ┌─────────────────┬─────────────────┐
  │ Sessions / day  │ Tokens / day    │
  │ ════════════    │ ═══════════     │
  │  7d · 42        │  7d · 1,238k    │
  │  mon · 6        │  mon · 220k     │
  │  tue · 8        │  tue · 290k     │
  │  ...            │  ...            │
  └─────────────────┴─────────────────┘

  ┌─────────────────┬─────────────────┐
  │ Flag rate (wk)  │ Error rate (wk) │
  │ ════════════    │ ═════════════   │
  │ 1.2%            │ 3.8%            │
  │ 3 / 246         │ 9 / 246         │
  └─────────────────┴─────────────────┘

  ┌─────────────────────────────────────┐
  │ Top 10 cost sessions                │
  │ ═══════════════════                 │
  │ sid 8a4f… · user 9d2b…              │
  │   2026-05-19 · $0.42 · 19,134 tok   │
  │ sid 6c1e… · user 9d2b…              │
  │   2026-05-19 · $0.38 · 17,212 tok   │
  │ ... (8 more)                        │
  └─────────────────────────────────────┘
─────────────────────────────────────────────────────
```

Tokens, costs, percentages, IDs — all monospace
(`var(--font-mono)`). The page voice matches bearings:
"plainspoken, terse, no marketing fluff." No icons, no
charts, no flourishes.

## Empty / loading / error states

- **No sessions at all (empty DB):** Each tile renders its
  header + a `—` body and a single line "no data yet". No
  crash.
- **No flags this week:** flag rate tile renders "0.0% · 0
  / N" (or "0.0% · 0 / 0" if no sessions either — same `—`
  handling).
- **Top-cost table with 0 rows:** "no sessions tracked yet"
  in mono ink-muted; no header row.
- **Query failure:** the page is server-rendered;
  uncatchable errors hit `app/error.tsx` (phase 17). The
  tiles each catch their own loader errors and render the
  `—` sentinel so a single failing query doesn't blank the
  whole page.

## Decisions made upfront — DO NOT ASK

- **Email-gated admin, not a role table.** `ADMIN_EMAILS`
  env is the source of truth. Reasons:
  - One env var to manage in Vercel + `.env`.
  - No new DB columns, no role-grant flow.
  - Aligns with the spec's anti-abuse posture: "No CAPTCHA,
    no account-age gate" — the same minimalism for the
    operator surface.
  - Promotes to a roles table only when there's a third
    admin or a per-permission split (read vs. write). Not
    yet.
- **Non-admin authed users get 404, not 403.** Reason: the
  URL's existence shouldn't be discoverable by authed
  civilians. A 404 is honest ("this page doesn't exist for
  you"); 403 leaks the gate.
- **Anonymous redirect to `/signin?next=/admin`.** Matches
  the existing pattern from `requireUser()`; users who land
  on the URL via a stale link aren't dead-ended.
- **Tile grid is 2-column on md+, 1-column on sm.** No
  bespoke breakpoint; matches the existing artifact-grid
  shape from phase 10.
- **No SVG charts, no animations, no auto-refresh.** Pure
  server-rendered numbers. Reasons:
  - Design decisions: "Token budget is a monospace counter
    ... not a bar that fills." Same register applies to
    operator surfaces.
  - Real-time updates aren't part of "operationally bounded
    look-don't-touch."
- **7-day window for daily-counts; trailing 7d (not
  calendar week) for rates.** Trailing-N is easier to
  reason about than ISO-week boundaries; matches phase 9's
  rolling-24h-quota window.
- **`userIdPrefix` is 8 chars.** Enough to disambiguate
  users in a top-10 list without exposing full UUIDs to the
  admin (who shouldn't be looking at individuals anyway —
  pattern-spotting is the use case).
- **One query per tile, run in parallel via `Promise.all`.**
  No N+1; each loader is one round-trip. 5 round-trips on
  page render. Acceptable; admins don't need this page to
  be fast.
- **`ADMIN_RECENT_DAYS = 7`** as the standing window. If
  the dashboard grows a "last 30 days" toggle, that's a
  follow-up — v1 picks one window and sticks with it.
- **No login link or "sign out" affordance on `/admin`.**
  The header chrome already exposes auth state in the
  existing app shell — admins use the same shell.
- **`page.tsx` is a Server Component**, not a Client
  Component. Reasons:
  - No interactivity in v1 (no filters, no toggles).
  - Server-side data fetching is the cheaper path.
- **`requireAdmin()` returns the user object**, not just
  a boolean. The "signed in as X@Y.Z (admin)" line in the
  header consumes it; future per-admin telemetry can read
  it.
- **No new e2e spec.** The page is authed-only and the
  hermetic e2e gate uses placeholder Supabase env. The
  existing redirect specs (phase 13's smoke walker)
  already verify the page exists at the route — they need
  a one-line update to expect the redirect to `/signin`
  for the anonymous walk. The authed walk requires
  `SUPABASE_E2E_SESSION_COOKIE` + admin membership; same
  `[operator]` gate as the existing magic-link inbox.
- **`/admin` is NOT included in `sitemap.xml`** — the
  existing sitemap excludes authed/machine-only routes;
  `/admin` joins that exclusion list. Same for robots.txt
  Disallow.
- **The "signed in as X (admin)" affordance** sits in the
  page header itself, not in the global nav. Reason: the
  global nav stays minimal; admin context is page-scoped.
- **No timezone selector.** UTC throughout — admins
  reading from different timezones are responsible for
  mental conversion. Matches phase 9's UTC-day convention.

## Mobile reflow / responsive

The page is admin-only and an admin walking up on 375px is
the rare case. The tile grid collapses to one column on
small viewports; the top-cost table's mono rows wrap
gracefully. No bespoke mobile work beyond what the existing
grid pattern gives.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/auth/admin.ts` | isAdminEmail covers empty / commas / whitespace / case / null | — |
| `lib/admin/queries.ts` | each loader's query builder spy asserts SQL shape; daily series backfills missing days; top-cost returns ordered desc | — |
| `app/admin/page.tsx` | requireAdmin mocked; loaders mocked; five tiles render the expected numbers; metadata exports noindex | — |
| `components/admin/usage-tile.tsx` | renders header + body + null sentinel | — |
| `components/admin/top-cost-table.tsx` | renders rows; empty state | — |
| `components/admin/daily-bars.tsx` | renders 7-day series; handles 0s | — |
| existing redirect specs | confirm `/admin` redirects unauthed to /signin (single new expectation) | — |

## Hermetic e2e registration

No new hermetic e2e. The page is authed-only; the existing
redirect-for-anon spec gets a one-line expectation extension.

## Verify gate

```bash
pnpm verify
```

Runs the standard sequence: typecheck → test:run →
data:validate → build → e2e. **Each leg is a hard gate.**

## Commit body template

```
feat: admin / dev dashboard — phase 23

- lib/auth/admin.ts: isAdminEmail (pure) + requireAdmin
  (redirects anon to /signin?next=/admin; notFound() for
  non-admin authed). Tested.
- lib/admin/queries.ts: loadSessionsPerDay,
  loadTokensPerDay, loadTopCostSessions,
  loadFlagAndErrorRates. ADMIN_RECENT_DAYS = 7,
  ADMIN_TOP_COST_LIMIT = 10.
- app/admin/page.tsx: server component; gates via
  requireAdmin; loads the five aggregates in parallel via
  Promise.all; renders the tile grid. Metadata noindex.
- components/admin/{usage-tile,top-cost-table,daily-bars}.tsx:
  three small primitives (mono headers, serif numbers,
  no charts).
- bearings.md: URL contract grows by one row (/admin —
  env-gated admin; read-only).
- existing redirect e2e: /admin → /signin for anon.

Decisions:
- Email-gated admin (ADMIN_EMAILS env), not a role table.
- 404 (notFound) for non-admin authed; 302 to /signin for
  anon. The URL's existence isn't discoverable.
- 7-day trailing window; UTC throughout.
- No charts, no auto-refresh, no write actions.
- userIdPrefix is 8 chars in the top-cost table —
  enough to spot patterns without exposing full UUIDs.
- One query per tile; Promise.all on the page.
- Page is a Server Component (no interactivity in v1).
- /admin excluded from sitemap.xml + robots Disallow.

Operator action: set ADMIN_EMAILS in .env (local) +
Vercel Project Env. Until set, /admin 404s for every
authed user.

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 23's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

Filed in `plan/AUDIT.md` as `[operator]` row: "Set
ADMIN_EMAILS in env." Auto-tagged so /iterate skips per
its own contract.

## Follow-ups (out of scope this phase)

- **30-day window toggle** — pick-a-window UI is the cleanest
  next step if admins ask. Out of v1.
- **Per-user drill-down** — clicking a top-cost row to see
  that user's sessions. Requires deciding the per-user view
  shape; out of v1.
- **Cost-per-persona attribution** — phase 16's filed
  follow-up; depends on a `turn_usage` table that doesn't
  exist yet.
- **CSV export** of any tile. Operator-facing; not user-
  facing. Worth it if the dashboard becomes a recurring
  read.
- **Real-time/live tile updates** via Supabase realtime.
  Pure operator polish; nothing depends on it.
- **Audit-of-admin-actions** when v1 grows write actions
  (currently none, so nothing to audit).
- **`/admin/sessions/[id]`** drill-down — out of v1; the
  top-cost table is the entry point if/when it ships.
