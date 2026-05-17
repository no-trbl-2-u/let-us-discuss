# Phase 9 — Anti-abuse limits (quota + per-IP demo + wrap UX)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

Three new gates land plus the graceful-wrap UX:

1. **Per-account session quota.** `MAX_SESSIONS_PER_DAY = 10`.
   `POST /api/sessions` short-circuits with a single SSE event
   `session.error code=quota` when the authed user already has
   ≥10 sessions in the trailing 24h.
2. **Per-IP demo rate-limit.** Anonymous `/try` calls a new
   `POST /api/demo/begin` before the canned demo turns roll.
   Server salts the request IP, hashes it, counts attempts
   today, and returns `200 { ok: true }` or
   `429 { code: 'demo-quota', limit, used }` per
   `MAX_DEMO_SESSIONS_PER_IP_PER_DAY = 3`.
3. **Per-session token cap (already shipped in 7b).** The
   orchestrator's `budget.wrap` event already triggers a clean
   wrap into the artifact round. Phase 9 adds the **UX honesty
   layer** on top: the results grid surfaces an "ended early"
   eyebrow + a single-line explanation when
   `session.budget.wrapped === true`. No new orchestrator
   wiring required.

Plus the IP-hash plumbing on the sessions write path (the
`sessions.ip_hash` column exists since 7a) and a fresh
`ip_rate_limits` table for the demo counter.

## Prerequisite

Phase 7a + 7b + 8 shipped. The DB migrations from phase 7 +
phase 8 applied. `lib/sessions/repo.ts` already accepts
`ipHash` on `createSession` (passes through to the row).

## Dependencies (operator action required for runtime)

- **`IP_HASH_SALT`** in `.env` (local) + Vercel Project Env. A
  random ≥32-char string. Used to salt the IP before hashing
  so the audit trail can't be back-traced to plaintext IPs
  without the salt. When unset the helper falls back to
  hashing without a salt (still hashed; just weaker) and emits
  one `console.warn`. Production should set it.
- **Run the migration**
  (`db/migrations/20260516_phase_9_ip_rate_limits.sql`) against
  the Supabase project. `setup/03_supabase.md` Section D
  amended.

## Routes / endpoints

- `POST /api/sessions` — adds the quota gate before the
  pitch-moderation gate (cheaper to count + reject than to
  call OpenAI). On quota-exceeded: emit a single SSE
  `session.error code=quota` event with `{ limit, used,
  windowHours: 24 }`. The session row is NOT inserted.
- `POST /api/demo/begin` — **new.** Public (no auth). Body:
  `{}` (no payload — the IP is the input). Hashes the
  request IP with `IP_HASH_SALT` (SHA-256, first 32 hex
  chars), upserts/increments the row in `public.ip_rate_limits`
  for today, and returns:
  - `200 { ok: true, used, limit }` when allowed.
  - `429 { code: 'demo-quota', used, limit }` when over the cap.
  The endpoint also returns 200 when the helper can't read the
  request IP (proxy misconfig); fail-open is the right default
  here because the demo is bounded by `DemoAlreadyUsed`
  sessionStorage state anyway.
- `/try` — calls `/api/demo/begin` from
  `components/demo/use-demo-start.ts` before kicking the canned
  demo. On 429: render a new `DemoRateLimitedCard` instead of
  the demo board.

## Library / helpers (new code)

- `lib/anti-abuse/ip-hash.ts` — `hashIp(req: Request | Headers): string`.
  Reads the IP from `x-forwarded-for` (first comma-sep value),
  falling back to `x-real-ip`. SHA-256 with `IP_HASH_SALT`
  prepended; returns the first 32 hex characters. When the IP
  is unresolvable returns the literal `'unresolved'` so the
  audit row exists but doesn't carry a fake hash.
- `lib/anti-abuse/quota.ts` — `countSessionsLast24h(supabase,
  userId)` queries `sessions` filtered by
  `user_id = $userId AND created_at > now() - interval '24 hours'`
  and returns a count. Pure SQL through the typed client.
- `lib/anti-abuse/demo-rate-limit.ts` —
  `checkAndBumpDemoLimit(supabase, ipHash)` upserts
  `(ip_hash, day_utc)` keyed on
  `(ip_hash, date_trunc('day', now() at time zone 'UTC'))`.
  Returns `{ allowed: boolean; used: number; limit: number }`.
- Tests for each, with mocked Supabase client.

## DB schema (new migration)

`db/migrations/20260516_phase_9_ip_rate_limits.sql`:

```sql
create table public.ip_rate_limits (
  ip_hash text not null,
  day_utc date not null,
  surface text not null check (surface in ('demo')),
  count int not null default 1,
  primary key (ip_hash, day_utc, surface)
);

alter table public.ip_rate_limits enable row level security;

-- Reads/writes go through the service-role client (the demo
-- route runs server-side without a Supabase session). No RLS
-- policy for `authenticated` since this table never serves a
-- user-facing query.
```

The route handler uses `createServiceClient()` from
`lib/supabase/server.ts` for `/api/demo/begin` because the
caller is anonymous and the table is not RLS-readable from
`authenticated`. The handler validates the upsert+increment
atomically via an `on conflict do update set count = count + 1`
clause.

## Constants

`lib/limits.ts` adds:

```ts
export const MAX_SESSIONS_PER_DAY = 10
export const MAX_DEMO_SESSIONS_PER_IP_PER_DAY = 3
export const IP_HASH_RETENTION_DAYS = 30 // documented; cleanup is phase 16
```

## Session events + reducer

`lib/sessions/events.ts` extends `SessionErrorCode`:

```ts
export type SessionErrorCode =
  | 'not-implemented'
  | 'auth'
  | 'config'
  | 'internal'
  | 'budget'
  | 'moderation'
  | 'quota'            // NEW
```

`SessionErrorCard.bodyFor('quota')` adds:

> "You've hit today's session limit (10 per 24 hours). Try
> again tomorrow, or hit Reset to free up the workspace."

The `'budget'` case already has copy from phase 7b that
matches the wrap UX; no changes needed.

## Components / handlers

- `components/demo/demo-rate-limited-card.tsx` — new. Renders
  a `Card` with copy:
  > "The demo has been used three times from this network
  > today. Sign in to run a full session — no IP cap when
  > you're authed."
- `components/boardroom/artifact-preview-grid.tsx` — adds an
  optional `wrapped?: boolean` prop. When true: prepend a
  small eyebrow above the grid:
  > "ended early · token budget reached"
- `board-client.tsx` — passes `wrapped={session.budget.wrapped}`
  to `ArtifactPreviewGrid`.

No new files beyond `DemoRateLimitedCard`.

## Cross-links

**In** (verify still wired):
- 7b's orchestrator (budget.wrap path).
- 7a's `sessions.ip_hash` column.
- 6's `/try` demo + `DemoAlreadyUsed` state.

**Out** (this phase ships these):
- `MAX_SESSIONS_PER_DAY` constant — phase 10 download UI
  surfaces it in a "you have N sessions remaining today"
  affordance (out of scope this phase).
- `ip_rate_limits` table — phase 16 ops job runs the 30d
  cleanup.

**Retro-fit**: `app/api/sessions/route.ts` adds the quota
gate + records `ipHash` on `createSession`. `/try` calls
`/api/demo/begin` before kicking the canned demo.

## SEO / metadata

No new public routes worth indexing.

## Empty / loading / error states

- **Per-account quota exceeded:** single
  `session.error code=quota` SSE event, no DB write. Client
  renders SessionErrorCard's quota body.
- **Per-IP demo limit:** `/try` swaps the demo board for
  `DemoRateLimitedCard` (no demo turns run; nothing in
  sessionStorage is touched).
- **Wrap early:** ArtifactPreviewGrid eyebrow flips.
- **IP unresolvable:** demo allowed (fail-open); the row
  still records with `ip_hash='unresolved'`.

## Decisions made upfront — DO NOT ASK

- **Quota window is rolling 24h**, not calendar day. Simpler
  to reason about per-user; calendar-day is gameable around
  midnight.
- **Demo window is calendar UTC day.** Anonymous traffic
  doesn't care about TZ, and primary key
  `(ip_hash, day_utc, surface)` is dirt-cheap.
- **IP_HASH_SALT unset → hash without salt + warn.** Local
  dev friendly; production must set it. Documented in
  `setup/02_vercel.md` env mirror checklist (separately).
- **Demo route uses `createServiceClient()`.** RLS off for
  this table (no user owns these rows).
- **Fail-open on unresolvable IP.** The sessionStorage cap
  already bounds abuse from a single browser; bouncing every
  demo because we can't read the IP would hurt legitimate
  users behind weird proxies.
- **No retry / exponential backoff in 7b for Anthropic.**
  Out of scope; phase 17 polish.
- **No CAPTCHA.** Bearings: never in v1.
- **No client-side guard against the quota.** The route is
  authoritative; the client shows the error when it returns.
- **No demo-begin call on the canned-skip path.** When the user
  hits "Skip" without typing, no IP increment.
- **`session.error code=quota` is a new code.** Reusing
  `budget` would conflate two different limits.
- **Budget-wrap UX is just an eyebrow.** No banner blocking
  the grid; the artifacts are still useful.

A brief that leaves Open Qs is a brief that fails its job.

## Mobile reflow / responsive

`DemoRateLimitedCard` is the same shape as
`DemoAlreadyUsedCard` (phase 6); same mobile constraints. The
ArtifactPreviewGrid eyebrow is text-only.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/anti-abuse/ip-hash.ts` | salt-present + ip → expected prefix; ip in x-real-ip fallback; unresolved → 'unresolved'; warn-once on unset salt | — |
| `lib/anti-abuse/quota.ts` | count returns Supabase numeric; SQL filter shape | — |
| `lib/anti-abuse/demo-rate-limit.ts` | first call returns used=1; over-limit returns allowed:false; primary-key conflict increments | — |
| `app/api/sessions/route.ts` | (extended) ≥ MAX → single session.error code=quota event, no createSession | — |
| `app/api/demo/begin/route.ts` | new: 200 under limit; 429 over limit; 200 + ip_hash=unresolved on missing headers | — |
| `components/demo/demo-rate-limited-card.tsx` | renders copy + links | — |
| `components/boardroom/artifact-preview-grid.tsx` | wrapped=true renders the eyebrow; wrapped=false hides it | — |
| `e2e/api-demo-begin.spec.ts` | anonymous POST returns 200 or 429 with the documented body shape | — |

## Hermetic e2e registration

Add `e2e/api-demo-begin.spec.ts`. No authed e2e until the
inbox/cookie wiring lands.

## Verify gate

```bash
pnpm verify
```

No new dep installs.

## Commit body template

```
feat: anti-abuse limits — phase 9

- lib/limits.ts: MAX_SESSIONS_PER_DAY=10,
  MAX_DEMO_SESSIONS_PER_IP_PER_DAY=3, IP_HASH_RETENTION_DAYS=30
- lib/anti-abuse/{ip-hash,quota,demo-rate-limit}.ts: hash helper,
  per-account quota counter, atomic per-IP-per-day upsert
- db/migrations/20260516_phase_9_ip_rate_limits.sql: new table
  keyed on (ip_hash, day_utc, surface)
- /api/sessions: quota gate before moderation; on >= MAX, single
  session.error code=quota SSE event, no row insert; sessions.ip_hash
  populated on every insert
- /api/demo/begin: new public POST. Hashes IP, increments today's
  counter, returns 200 or 429
- /try: calls /api/demo/begin before the canned demo; on 429
  renders DemoRateLimitedCard
- ArtifactPreviewGrid: wrapped=true → "ended early" eyebrow
- session.error code=quota added to the event union + SessionErrorCard

Decisions:
- Rolling 24h window for per-account; calendar UTC day for per-IP
- Demo route uses service-role client (RLS off for ip_rate_limits)
- Fail-open on unresolvable IP (sessionStorage cap still bounds abuse)
- IP_HASH_SALT unset → warn-once + hash without salt (local-dev friendly)
- No CAPTCHA, no client-side quota guard
- Wrap UX is an eyebrow, not a banner

Operator follow-up:
- Apply db/migrations/20260516_phase_9_ip_rate_limits.sql
- Set IP_HASH_SALT in .env + Vercel Project Env

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 9's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

## Follow-ups (out of scope this phase)

- Phase 10 download UI — surfaces the per-account quota in a
  "N sessions remaining today" affordance.
- Phase 16 ops — 30-day cleanup of `ip_rate_limits` + the
  `sessions.ip_hash` column.
- Phase 17 polish — a friendlier "wrapped early" treatment if
  user research suggests one.
