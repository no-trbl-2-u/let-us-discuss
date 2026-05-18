# Phase 16 — Observability

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

1. **Token usage is split into prompt + completion + cost.**
   The `sessions` table gains `prompt_tokens`, `completion_tokens`,
   `cost_cents` columns (alongside the existing `total_tokens`
   which stays as the rolling sum). The orchestrator stops
   collapsing `input_tokens + output_tokens` into one number
   and threads the split values + an estimated cost back to
   the repo on every persisted turn.
2. **Per-session footer.** `/app/sessions/[id]` and
   `/app/sessions/[id]/transcript` render a small, terse
   `<SessionUsageFooter>` block: model, prompt + completion
   counts, total tokens, estimated cost in USD. No charts,
   no bars (per design decisions: "Token budget is a
   monospace counter on the corner of the table, not a
   bar that fills.").
3. **Standardized error logging.** A `logError(scope, err,
   context?)` helper writes a single structured JSON line
   to stdout for Vercel's log drain to ingest. Used at the
   LLM-call boundary, the moderation boundary, and the
   server-action error path. No third-party APM.

## Prerequisite

Phases 1–15 shipped. The `sessions` table exists with
`total_tokens` + `model`; the orchestrator surfaces
`message.usage.input_tokens` + `message.usage.output_tokens`
already (currently collapses them). Phase 11 ships the
`/app/sessions/[id]` page that gets the new footer.

## Dependencies (operator action required for runtime)

- **Apply the new migration** in Supabase (or via `pnpm
  db:migrate`). The migration is additive and backwards-
  compatible: existing rows get `prompt_tokens = 0`,
  `completion_tokens = 0`, `cost_cents = 0` defaults so
  past sessions show `—` in the footer instead of a misleading
  zero.

## Routes / endpoints (locked from bearings)

No URL contract additions. New file under `app/api/`:

- **No new endpoints.** The footer reads from the existing
  `loadSession` query path.

## Library / helpers (new code)

- `db/migrations/20260518_phase_16_token_usage.sql` — adds
  three columns to `public.sessions`. Indexed nowhere
  (low cardinality + per-session aggregation only).
- `lib/observability/pricing.ts` — `MODEL_RATES` map from
  Anthropic model id → cents-per-million-tokens for prompt
  and completion. `estimateCostCents(model, prompt,
  completion)` returns an integer cent estimate. Models we
  don't recognize fall back to a flat `null` (footer
  renders `—`).
- `lib/observability/pricing.test.ts` — known model rates;
  unknown model returns null; arithmetic edge cases (0
  tokens, very large counts).
- `lib/observability/log.ts` — `logError(scope, err,
  context?)` writes one JSON line to stdout with
  `{ level: 'error', scope, message, stack?, context, ts }`.
  Reads `NODE_ENV` so test runs can quiet the helper.
- `lib/observability/log.test.ts` — captures stdout;
  verifies the line shape; verifies it stays one line.

## Components / handlers (new + edited)

**New:**

- `components/sessions/session-usage-footer.tsx` — reads
  `{ model, promptTokens, completionTokens, totalTokens,
  costCents }` and renders a single-row monospace block:
  `model · 12,345 in / 6,789 out · 19,134 tokens · ~$0.42`.
  Falls back to `—` for null fields (legacy rows). Test
  colocated.

**Edited:**

- `lib/anthropic/conferring.ts` — `final` payload now
  returns `{ text, promptTokens, completionTokens, tokens }`
  instead of `{ text, tokens }`. The combined `tokens`
  field stays for budget-tracker back-compat.
- `lib/sessions/repo.ts` — `recordTurn` (or equivalent
  accumulator) accepts the split values and updates
  `prompt_tokens += p`, `completion_tokens += c`,
  `cost_cents += estimateCostCents(model, p, c)`.
- `lib/sessions/queries.ts` — `loadSession` selects the
  three new columns and threads them through to the page.
- `app/app/sessions/[id]/page.tsx` — renders
  `<SessionUsageFooter />` below the existing artifact grid.
- `app/app/sessions/[id]/transcript/page.tsx` — renders
  the same footer at the bottom of the transcript.
- LLM-call sites (`lib/anthropic/conferring.ts`,
  `lib/moderation/audit.ts` if it surfaces errors) — wrap
  catches in `logError('orchestrator', err, { sessionId })`.

## Cross-links

**In (verify):**

- Existing `loadSession` tests adjusted to assert the new
  fields appear in the returned shape.

**Out (ship):**

- Footer adds no outbound links (it's pure data).

**Retro-fit:**

- None. The footer is additive on existing pages.

## SEO / metadata

N/A. Authed pages (noindex).

## Hero / body / sub-section composition

The footer is the only new visual:

```
─────────────────────────────────────────────────────
  claude-sonnet-4-6  ·  12,345 in / 6,789 out
  19,134 tokens  ·  ~$0.42
─────────────────────────────────────────────────────
```

Monospace; ink-muted; one rule above; sits inside the same
`mx-auto max-w-...` shell as the page content. On 375px the
two lines stack naturally without wrap.

## Empty / loading / error states

- **Missing values (legacy rows):** render `—` for each
  field that's null/zero on legacy rows. The footer label
  stays so users know the surface exists; the dashes
  signal "we didn't track this back then."
- **Cost unknown (model not in MODEL_RATES):** render
  `(cost: —)` so the missing data point doesn't disappear.
- **No loading state** — the page is server-rendered;
  data is present when the footer mounts.

## Decisions made upfront — DO NOT ASK

- **`cost_cents` not `cost_micros`.** Reason: USD cent
  precision is enough for v1 (single sessions in the
  sub-dollar range; user-facing display rounds to cents
  anyway). Micros would force JS number → bigint
  conversions for negligible accuracy gain.
- **Pricing table is hand-pinned in `pricing.ts`,
  not fetched.** Anthropic's pricing page is stable enough
  for v1; refetching at runtime adds an external call to
  every session. Reviewed-at date is pinned in the file's
  top comment so an /iterate pass knows when to refresh.
- **Pricing values use the v4.x family** (Sonnet 4.6,
  Haiku 4.5, Opus 4.7) per the env's knowledge cutoff;
  unrecognized models return null cost. Operator can
  update the table without a schema change.
- **`prompt_tokens` + `completion_tokens` + `cost_cents`
  default to 0 in migration.** Legacy rows render `—` via
  a sentinel pattern in the footer (treat 0 as
  "not tracked" only when total_tokens > 0 — a real
  zero-token session would already have a 0 total).
  Documented in the brief; tests assert the behavior.
- **One migration file, not two.** All three columns add
  in the same DDL. Reason: they're conceptually one
  capability and the migration tooling we have is simple
  enough to keep atomic.
- **No new index on the columns.** Aggregation happens
  per-session via the existing primary-key fetch; no
  query needs to scan or sort on the new columns.
- **Footer lives in `components/sessions/`**, not in
  `components/observability/`. Reason: the surface that
  consumes it is the session pages; observability is its
  source-of-data not its surface.
- **`logError` writes to stdout, not stderr.** Vercel's
  log drain ingests both, and using stdout keeps the
  output stream consistent so any downstream JSON
  consumer reads one source.
- **JSON log line format is locked here**: `{ level,
  scope, message, stack?, context?, ts }`. `scope` is a
  string like `orchestrator`, `moderation`, `auth`,
  `session-route`. `ts` is ISO-8601. No nested objects
  beyond `context` (keeps line size reasonable in the
  drain UI).
- **No CSP / OTel / Sentry / posthog this phase.** The
  build-plan row is explicit: "no third-party APM at v1."
  If those become useful, file as an [operator] AUDIT row.
- **Test helper for stdout capture uses
  `vi.spyOn(process.stdout, 'write')`.** Standard vitest
  pattern; no new dev dep.
- **`session-usage-footer.tsx` uses monospace family
  only.** Per design decisions: technical bits earn the
  monospace; this is the textbook case.
- **No `transcript` page footer placement variant** —
  same component on both pages; the page wrapper handles
  margin. Less surface area, same data.
- **Total tokens in the footer is `total_tokens` from
  the DB**, not `prompt + completion`. Reason: `total_tokens`
  is the budget tracker's number (what `MAX_SESSION_TOKENS`
  compares against); showing the budget-tracker number
  keeps "you used X of N" math honest. The split numbers
  are additional detail.

## Mobile reflow / responsive

The footer's two lines stack vertically by default; on
md+ they sit side-by-side with a center dot separator.
No data overflow even with 6-digit token counts (the
monospace + the `~$X.XX` format are width-bounded).

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/observability/pricing.ts` | known model returns positive int; unknown returns null; 0+0 returns 0; large counts (1M+1M) return the expected cents | — |
| `lib/observability/log.ts` | writes a single line; line parses as JSON; required keys present; quiet in `NODE_ENV=test` unless flag set | — |
| `db/migrations/20260518_phase_16_token_usage.sql` | (data:validate is unaffected; migration is additive; runs forward via existing tooling) | — |
| `components/sessions/session-usage-footer.tsx` | renders model + counts when all present; renders `—` for null fields; collapses cost cell when pricing returns null | — |
| `lib/anthropic/conferring.ts` | (extended test) final payload contains promptTokens + completionTokens separately | — |
| `lib/sessions/repo.ts` (test) | recordTurn increments all three new aggregates | — |
| `lib/sessions/queries.ts` (test) | loadSession returns the new fields, including 0/null cases | — |

## Hermetic e2e registration

None new. The footer is authed-only (`/app/sessions/[id]`),
which the hermetic e2e cannot reach. Existing redirect
specs already verify the page exists; manual / Mailosaur-
gated walks verify the footer rendering.

## Verify gate

```bash
pnpm verify
```

Note: a Supabase migration adds three columns. The hermetic
e2e gate uses placeholder Supabase env, so it doesn't
exercise the migration. The migration ships in the same
commit; the operator runs `pnpm db:migrate` against the
real project after merge.

## Commit body template

```
feat: observability — phase 16

- db/migrations/20260518_phase_16_token_usage.sql: add
  prompt_tokens, completion_tokens, cost_cents to
  public.sessions (additive, defaults 0)
- lib/observability/pricing.ts: MODEL_RATES table
  (cents/MTOK) for Claude 4.x family; estimateCostCents
  helper returns null for unrecognized models
- lib/observability/log.ts: logError(scope, err, context?)
  writes a single JSON line to stdout for Vercel's log
  drain
- lib/anthropic/conferring.ts: final payload now returns
  { text, tokens, promptTokens, completionTokens } —
  split usage that the repo can persist; combined tokens
  remains for budget-tracker back-compat
- lib/sessions/repo.ts: recordTurn updates all three new
  aggregates atomically with the combined total_tokens
- lib/sessions/queries.ts: loadSession returns the new
  fields
- components/sessions/session-usage-footer.tsx: terse
  monospace block — model · prompt/completion · total ·
  estimated cost. Legacy/missing fields render `—` per
  the locked sentinel rule.
- app/app/sessions/[id]/page.tsx + .../transcript/page.tsx:
  render <SessionUsageFooter /> below the existing surface.

Decisions:
- cost_cents (not micros) — USD cent precision is enough
  for v1
- Pricing table hand-pinned + reviewed-at date in file
  header (refresh via /iterate if rates move)
- Legacy rows render `—` so the footer never lies about
  un-tracked sessions
- logError uses stdout + single-line JSON; locked shape
  documented in lib/observability/log.ts
- No third-party APM this phase (spec-driven)
- No transcript-page footer variant — same component on
  both pages
- Authed-only surface — no new hermetic e2e (existing
  redirect specs already cover the route's auth gate)

Operator action: `pnpm db:migrate` (or apply the SQL
file in Supabase) to add the three columns to the real
project. Until applied, the repo writes silently skip
the new fields and the footer renders `—` for them.

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 16's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

Filed in `plan/AUDIT.md` as `[operator]` row: "Apply
phase 16 migration in Supabase." Auto-tagged so /iterate
skips per its own contract.

## Follow-ups (out of scope this phase)

- **APM / OTel** — operator-gated; not v1.
- **Per-account aggregate dashboard** ("you used X tokens
  this week") — separate phase if user demand surfaces.
- **Cost-per-persona attribution** — would need a
  `turn_usage` table; not v1.
- **Live budget exceedance alerts** — outside spec.
