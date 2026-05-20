# Phase 25 — Loose usage estimator (pre-session forecast + cross-session aggregate)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

1. **Pre-session forecast tile in the boardroom shelf.** A
   small `<UsageEstimate>` panel reads phase 24's selected
   model + a hand-pinned "typical session" token range and
   renders `~X–Y tokens · ~$A–$B (rough estimate)` plus
   one locked disclaimer line. Updates reactively when the
   user changes model.
2. **Cross-session aggregate tile on `/app/settings`** —
   `<AccountUsageSummary>` reads the user's own session
   rows from Supabase via a new
   `getUserUsageSummary(supabase, userId, window)` query
   and renders three terse rows: `today`, `7d`, `30d`,
   each showing `N sessions · ~M tokens · ~$P`. Slots in
   `/app/settings` above the existing Account section so
   the user sees "what have I spent" before they reach
   "close my account."
3. **Out of scope by explicit declaration:** the
   per-session SessionUsageFooter already shipped by
   phase 16. This phase **does not** edit it. The brief
   calls that out below to prevent scope leak.

## Prerequisite

Phases 1–24 shipped. The data:
- `sessions.model` (phase 7a) holds the chosen model.
- `sessions.{prompt_tokens, completion_tokens,
  total_tokens, cost_cents}` (phase 16) hold post-session
  numbers.
- `lib/observability/pricing.ts` MODEL_RATES (phase 16)
  prices every allowlisted model.
- `lib/anthropic/models.ts` (phase 24) is the source of
  truth for `AVAILABLE_MODELS` + `DEFAULT_MODEL`.

No new migrations.

## Dependencies (operator action required for runtime)

None. The phase reads existing columns only.

## Routes / endpoints (locked from bearings)

No URL contract changes. `/app/settings` already exists
(phase 18); this phase adds one section to it. The
boardroom shelf at `/app` adds one tile inline. The
locked URL list in `bearings.md` stays identical.

| Route | Auth | Change |
|---|---|---|
| `GET /app/settings` | authed | renders new `<AccountUsageSummary>` above the existing Account section |
| `GET /app` (authed boardroom shelf) | authed | renders new `<UsageEstimate>` between PitchInput and ModelPicker (or below the picker; see Decisions) |

## Library / helpers (new code)

**Created:**

- `lib/usage/typical-session.ts` —
  - `TYPICAL_SESSION = { promptMin, promptMax,
    completionMin, completionMax }` — hand-pinned
    representative ranges per session-shape. Values: 4k–12k
    prompt, 2k–8k completion (covers a typical four-persona
    confer + checkpoint + artifact phase per current
    orchestrator behavior). Single object exported so the
    forecast helper is the only consumer; tunable via PR.
  - `estimateSessionUsage(model: string): { tokensMin,
    tokensMax, costCentsMin, costCentsMax }` — pure
    function. `tokens*` = sum of prompt + completion ranges.
    Cost computed via `lib/observability/pricing.ts`
    `estimateCostCents(model, ...)` against each
    {prompt, completion} pair. Returns `costCentsMin = null`
    if the model isn't priced (UI renders `—`); cost always
    rounded up (matches pricing.ts ceil convention).
- `lib/usage/__tests__/typical-session.test.ts` — covers:
  - estimateSessionUsage returns the expected token range
    for the default model.
  - cost numbers come back rounded-up and ordered (Min ≤ Max).
  - unknown model returns `tokensMin/Max` numbers but null
    cost.
  - changing model rescales cost predictably (Opus > Sonnet
    > Haiku at identical token shape — sanity guard,
    enforces the picker's value).
- `lib/usage/summary.ts` —
  - `UsageWindow = 'today' | '7d' | '30d'`.
  - `WindowSummary = { window, sessions, tokens,
    costCents }` (costCents = sum, integer).
  - `getUserUsageSummary(supabase, userId, now?): Promise<
    Record<UsageWindow, WindowSummary>>` — pulls the user's
    `sessions` rows in the last 30 days once
    (`total_tokens, cost_cents, created_at`); slices the
    result client-side into the three windows. One query,
    three aggregates — cheaper than three round-trips.
  - Uses UTC day boundaries; matches phase 23's
    convention.
- `lib/usage/__tests__/summary.test.ts` — covers:
  - empty result → all three windows return zeros.
  - rows in the 30d window correctly assigned to today /
    7d / 30d (a row 14 hours old appears in all three; a
    row 8 days old appears only in 30d).
  - throws when supabase errors.
  - tolerates null token/cost columns (treat as 0).
- `components/boardroom/usage-estimate.tsx` — client
  component. Props: `model: string`. Subscribes to changes
  of `model`, recomputes via `estimateSessionUsage`.
  Renders:
  ```
  ESTIMATE
  ~X–Y tokens · ~$A–$B
  Rough estimate. Actual usage varies; cap at 60k tokens.
  ```
  Mono throughout. If `costCents*` are null (unknown
  model), renders `~X–Y tokens · — (rough estimate)`.
- `components/boardroom/__tests__/usage-estimate.test.tsx`
  — renders for the default model; updates when model
  prop changes; renders the `—` fallback for an unknown
  model.
- `components/settings/account-usage-summary.tsx` —
  server component. Props: `summary:
  Record<UsageWindow, WindowSummary>`. Renders three rows
  (today, 7d, 30d), each with mono `N sessions · ~M
  tokens · ~$P`. Bottom line: terse "Counts come from
  your own sessions; reset at midnight UTC." (locked
  copy).
- `components/settings/__tests__/account-usage-summary.test.tsx`
  — renders each window; empty state ("no sessions yet")
  when all zeros.

**Edited:**

- `components/boardroom/board-client.tsx` — render
  `<UsageEstimate model={model} />` between
  `<ModelPicker>` and `<StartSessionButton>` (see
  Decisions for placement).
- `app/app/settings/page.tsx` — server component already;
  fetch the summary via `createServerClient` +
  `getUserUsageSummary`, render
  `<AccountUsageSummary summary={...} />` ABOVE the
  existing Account `<SettingsSection>`. Keep page shell.
- `app/app/settings/__tests__/page.test.tsx` (if exists;
  else add): mocks `requireUser` + `getUserUsageSummary`,
  asserts the summary rows render.

**No new SQL.** All data exists from prior phases.

## Constants

`lib/usage/typical-session.ts` exports:

```ts
export const TYPICAL_SESSION = {
  promptMin: 4_000,
  promptMax: 12_000,
  completionMin: 2_000,
  completionMax: 8_000,
} as const
```

Single object; comment explains derivation (orchestrator
default phase order × typical per-turn completion). Tune
via PR; the unit test pins the math.

## Session events + reducer

N/A. Estimate is purely client-derived; summary is
server-rendered.

## Cross-links

**In** (verify still wired):
- `lib/anthropic/models.ts` AVAILABLE_MODELS (phase 24) —
  the `<UsageEstimate>` is downstream; if a model is
  added/removed, the estimate handles it gracefully via
  `estimateCostCents`'s null-on-unknown contract.
- `lib/observability/pricing.ts` MODEL_RATES (phase 16) —
  source of truth for cost math.
- `sessions.{total_tokens, cost_cents, created_at}` —
  read by `getUserUsageSummary`; columns from phase 16.

**Out** (ship):
- Pre-session forecast on the authed boardroom shelf.
- Cross-session usage summary on `/app/settings`.

**Retro-fit:**
- None. Additive surfaces; nothing existing changes.

**Explicitly excluded** (scope-leak guard):
- `components/sessions/session-usage-footer.tsx` (phase 16)
  is the per-session post-mortem footer. This phase does
  NOT edit it. If you find yourself opening that file, you
  drifted; close it.

## SEO / metadata

N/A — both surfaces are authed (`noindex` already).

## Hero / body / sub-section composition

**On `/app` (boardroom shelf):**
```
PersonaShelf
PitchInput
ModelPicker
ESTIMATE
~5,000–18,000 tokens · ~$0.08–$0.34
Rough estimate. Actual usage varies; cap at 60k tokens.
StartSessionButton
```

**On `/app/settings`:**
```
boardroom · app / settings
Settings.

Usage
─────
today    0 sessions · ~0 tokens · ~$0.00
7d       4 sessions · ~32k tokens · ~$0.94
30d     12 sessions · ~98k tokens · ~$2.81
Counts come from your own sessions; reset at midnight UTC.

Account
[existing section unchanged]
```

## Empty / loading / error states

- **Estimate, default state:** renders the default model
  range; no spinner; updates instantly on model change
  (pure client math).
- **Estimate, unknown model:** falls back to
  `~X–Y tokens · — (rough estimate)`. The disclaimer
  line still renders.
- **Summary, no sessions yet:** renders "no sessions yet"
  in mono ink-muted instead of the three zero rows.
  Better signal than a wall of zeroes.
- **Summary, query failure:** caught at the page level
  via try/catch; renders one line "couldn't load usage —
  reload the page to retry" rather than blanking the
  whole settings page (mirror of phase 23's per-loader
  em-dash pattern, applied at page granularity here
  since there's only one query).

## Decisions made upfront — DO NOT ASK

- **Hand-pinned token range, not learned from the user's
  history.** Reasons: (a) learned ranges fall apart for
  new users who have no history; (b) a "rough estimate"
  with a wide range is what's actually useful — the
  precise number is the per-session footer's job; (c)
  the pinned numbers ship in a single file and are
  PR-tunable. If accuracy proves load-bearing, filing as
  Follow-up "per-template typical ranges" makes more
  sense than per-user.
- **One pinned range across all session shapes.** The
  brief picked 4k–12k prompt + 2k–8k completion as a
  representative band covering the existing orchestrator
  shapes. Per-template ranges land if/when a non-default
  template (e.g., a PRD template under the round-13
  candidate) shows materially different usage.
- **Placement of `<UsageEstimate>`: between ModelPicker
  and StartSessionButton.** Reasons: (a) reads top-down
  with the user's just-made model choice still in
  context; (b) right above the Start button is the
  "deciding moment"; (c) matches the shelf's existing
  one-column stack — no horizontal split.
- **`<AccountUsageSummary>` ABOVE the Account section on
  /app/settings.** "What have I spent" comes before
  "close my account" — natural ordering, and lets users
  who came to /app/settings just to check spending leave
  without ever scrolling to delete-account.
- **Three windows: today / 7d / 30d.** Standard SaaS
  cadences. Matches phase 23 admin dashboard's
  7-day-trailing convention (today + 7d) and adds 30d
  for monthly-shape mental models. No 90d; if the user
  cares about quarter-shape they're an admin and the
  /admin tile is the right surface.
- **One query, slice client-side.** 3 round-trips for 3
  windows is wasteful when the 30d window contains the
  others. Single `gte('created_at', 30d ago)` + an
  in-memory partition is cheaper.
- **Use the session's stored `cost_cents` column, not
  re-derive cost via MODEL_RATES at read time.** Reasons:
  (a) `cost_cents` was computed at session-end using the
  exact actual token counts + the model in use AT THAT
  TIME — re-deriving could disagree if MODEL_RATES
  changes; (b) the stored number is the audit-of-record;
  the rates table is for fresh estimates. Estimates use
  rates; summaries use stored costs.
- **`tokens` rolls up `total_tokens` not split tokens.**
  Cheaper read; the user-facing axis is "how much did I
  spend" not "split prompt/completion." Split lives in
  the per-session footer.
- **Pure-math estimates, not API-based.** Anthropic's
  token-count endpoint is for accurate single-message
  counts; the estimate is a sales-tag-style number, not a
  prediction. Calling the API on every model-picker
  change would be expensive and slow.
- **No animations, no loading skeletons** — the estimate
  is instant client math; the summary fetches at page
  render, no client refetch.
- **Default-model estimate at first render** (not "—
  until model is picked") because phase 24's picker
  defaults to `DEFAULT_MODEL` — there's always a
  selected model.
- **Disclaimer copy is locked** — "Rough estimate. Actual
  usage varies; cap at 60k tokens." Don't paraphrase per
  surface. Same line in the estimate tile across the
  shelf and (if reused) anywhere else. Cap reference
  echoes `MAX_SESSION_TOKENS` from `lib/limits.ts`; if
  the cap moves, this brief's commit body notes the copy
  needs updating too.
- **Estimate hides during in-flight session.** Once
  `state.tag === 'running'`, the estimate is irrelevant
  — the user is in the session. Matches the picker's
  `disabled` behavior; one less line below the live
  transcript.
- **No "model breakdown" on the summary tile.** "What did
  I spend on Opus vs Sonnet" is a per-user analytics
  feature; out of v1. Phase 23 admin already covers
  cross-user breakdowns.

## Mobile reflow / responsive

Both tiles fit one-column stacks; no bespoke breakpoint.
The summary's 3 windows render as 3 stacked rows on
mobile (no table-on-mobile issues).

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/usage/typical-session.ts` | estimateSessionUsage shape; unknown model returns null cost; Opus > Sonnet > Haiku at identical token shape | — |
| `lib/usage/summary.ts` | empty → zeros; bucket assignment for today/7d/30d; null-tolerance; rejection on supabase error | — |
| `components/boardroom/usage-estimate.tsx` | renders for default model; updates on model change; `—` fallback for unknown model | — |
| `components/settings/account-usage-summary.tsx` | renders each window; empty state copy | — |
| `app/app/settings/page.tsx` | summary tile renders above Account section | — |
| board-client | usage-estimate rendered between ModelPicker and StartSessionButton; hidden when `state.tag === 'running'` | — |

No new e2e spec. The settings page is authed-only; the
existing redirect-for-anon smoke walker continues to
cover the route's gate.

## Hermetic e2e registration

No new hermetic e2e. Unit + component tests cover the
new surfaces.

## Verify gate

```bash
pnpm verify
```

Runs typecheck → test:run → data:validate → build → e2e.
**Each leg is a hard gate.**

## Commit body template

```
feat: usage estimator + account usage summary — phase 25

- lib/usage/typical-session.ts: hand-pinned TYPICAL_SESSION
  ranges (4–12k prompt / 2–8k completion) + estimateSessionUsage
  pure function; null cost for unknown models. Tested — Opus >
  Sonnet > Haiku invariant pinned.
- lib/usage/summary.ts: getUserUsageSummary single-query
  + client-side partition into today / 7d / 30d windows,
  UTC boundaries.
- components/boardroom/usage-estimate.tsx: mono "ESTIMATE"
  panel; updates reactively on model change; hidden while
  in-flight; locked disclaimer copy.
- components/settings/account-usage-summary.tsx: three-row
  mono summary; "no sessions yet" empty state.
- components/boardroom/board-client.tsx: usage-estimate
  slotted between ModelPicker and StartSessionButton.
- app/app/settings/page.tsx: summary tile renders above
  the existing Account section; one query at page render,
  no client refetch.

Decisions:
- Hand-pinned typical range, not learned per-user — wide
  band is more honest than a precise-looking estimate.
- One range for all sessions in v1; per-template ranges
  is a follow-up.
- Stored cost_cents (not re-derived) for summaries —
  audit-of-record. Fresh estimates use MODEL_RATES.
- One query for 30d window, slice client-side into 3.
- Estimate slots between picker and Start button — the
  "deciding moment" surface.
- Summary tile ABOVE Account on /app/settings — "what
  I've spent" before "close my account."
- Locked disclaimer copy ("Rough estimate. Actual usage
  varies; cap at 60k tokens.") — cap mirrors
  MAX_SESSION_TOKENS; update both together if cap moves.
- Estimate hides during in-flight session.
- No per-model breakdown on the summary — admin
  dashboard's job (phase 23).

Out of scope by explicit declaration: the per-session
SessionUsageFooter (phase 16) is unchanged. Persisted-
preference for last model choice + per-template ranges
+ Anthropic token-count-endpoint integration all filed as
Follow-ups.

No new migrations. All data exists from phases 16 + 24.

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 25's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash.

No new `[operator]` AUDIT row.

## Follow-ups (out of scope this phase)

- **Per-template typical ranges** — when a non-default
  template (e.g., PRD / Roadmap from the round-13
  scope-driven-artifact candidate) lands, estimate
  ranges should diverge. Out of v1; landing in a
  per-template typical map keyed by template slug is the
  shape.
- **Persisted last-model preference** — remember a
  user's last picked model across sessions. Out of v1;
  defaults are fine. Likely lives in a
  `user_preferences` table.
- **Anthropic token-count endpoint integration** — for a
  pre-flight precise estimate of the user's actual pitch
  + persona system prompts. Higher accuracy at API cost;
  worth it only if "rough estimate" proves too rough in
  practice. Out of v1.
- **Per-model breakdown on the summary** — "you spent
  $1.20 on Opus, $0.40 on Sonnet this month." Useful for
  power users; phase 23 admin already covers it for
  operators.
- **90d / quarter window** — admins use /admin; users
  probably don't need it.
- **CSV export of the summary** — when the surface
  matures.
