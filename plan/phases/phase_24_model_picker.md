# Phase 24 — Model picker for the boardroom session

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

1. **The authed boardroom shelf gains a model picker.** A
   small `<ModelPicker>` control beside the existing pitch
   input lets the user pick from a pinned allowlist of
   Anthropic models before pressing Start. The picked model
   travels in the `model` field of the `POST /api/sessions`
   create request, is stored on the session row, and is the
   one model every persona in that session runs against.
2. **`/api/sessions` validates `model` against the
   allowlist** and falls back to a stable default
   (`AVAILABLE_MODELS[0]`) on missing-or-unknown input. The
   create handler stops reading `process.env.ANTHROPIC_MODEL`
   at session-create time and reads from the validated body
   instead; the `defaultModel()` env-fallback stays for any
   code that runs outside a session (operator scripts,
   tests).
3. **Anonymous demo unchanged.** `/try` keeps its hard-coded
   default (the demo is canned, no API calls). Per-persona
   model selection stays a deliberate follow-on.

## Prerequisite

Phases 1–23 shipped. Phase 7a stood up `/api/sessions` +
the `sessions` table including a `model text not null`
column; phase 16 added the `prompt_tokens /
completion_tokens / cost_cents` triple that consumes the
model id via `lib/observability/pricing.ts`'s `MODEL_RATES`
table. Phase 23 just shipped the `/admin` aggregate
dashboard that reads those columns — no behavioral change
needed for tile shape; the daily-totals tiles aggregate
across all models.

## Dependencies (operator action required for runtime)

None new. Every model in the v1 allowlist is already
priced in `lib/observability/pricing.ts`. The operator
should still have a working `ANTHROPIC_API_KEY` (existing
[operator] row covers it).

## Routes / endpoints (locked from bearings)

No URL contract changes. `POST /api/sessions` is unchanged
in path + method; only the request body grows by one
optional field. The locked URL list in `bearings.md` stays
identical.

| Route | Auth | Render / behavior |
|---|---|---|
| `POST /api/sessions` | authed | request body now accepts optional `model: string`; server validates against `AVAILABLE_MODELS` allowlist; on absent/unknown → uses `AVAILABLE_MODELS[0]` |

## Library / helpers (new code)

**Created:**

- `lib/anthropic/models.ts` —
  - `AVAILABLE_MODELS: readonly string[]` — pinned allowlist
    in **default-first** order. v1:
    `['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001']`.
    Comments explain why each lives in the list (default,
    balanced, cheap-and-fast). Adding/removing rows ships
    via PR.
  - `MODEL_LABELS: Readonly<Record<string, string>>` —
    user-facing display labels, e.g.
    `'claude-opus-4-7': 'Opus 4.7 (default)'`. Falls back
    to the model id when missing.
  - `MODEL_BLURBS: Readonly<Record<string, string>>` — one
    short line per model the picker renders as helper
    text: "Default. Best reasoning, highest cost." /
    "Balanced. ~5× cheaper than Opus." / "Cheapest. Fastest;
    weakest on long-context arguments." Same fallback shape.
  - `DEFAULT_MODEL: string` — `AVAILABLE_MODELS[0]`.
  - `isAllowedModel(model: string | null | undefined): boolean`
    — pure membership check.
  - `resolveModel(input: string | null | undefined): string`
    — returns `input` if in the allowlist, else
    `DEFAULT_MODEL`.

- `lib/anthropic/__tests__/models.test.ts` — covers:
  - `AVAILABLE_MODELS[0]` matches `DEFAULT_MODEL` (single
    source of truth).
  - every entry in `AVAILABLE_MODELS` has a price row in
    `MODEL_RATES` (so the SessionUsageFooter never renders
    `—` for an allowlisted model).
  - every entry has a `MODEL_LABELS` and `MODEL_BLURBS`
    entry (no silent unknown-id leaks in the picker).
  - `isAllowedModel` true for each allowlist entry; false
    for `null`, `undefined`, `''`, `'   '`, and arbitrary
    unknown strings (`'gpt-4'`, `'claude-opus-3'`).
  - `resolveModel` returns `input` when allowed; returns
    `DEFAULT_MODEL` for unknown / empty / null.

- `components/boardroom/model-picker.tsx` — client component.
  - Props: `value: string`, `onChange: (next: string) => void`,
    `disabled?: boolean`.
  - Renders a native `<select>` (no custom listbox in v1; the
    existing PersonaShelf and PitchInput use plain
    primitives and this matches their register).
  - Options labeled with `MODEL_LABELS[id]`; one blurb line
    rendered below the select using
    `MODEL_BLURBS[value]`.
  - Accessibility: `<label>` wrapping the select; the eyebrow
    reads `MODEL` in tracked caps mirroring shelf siblings.
- `components/boardroom/__tests__/model-picker.test.tsx` —
  renders, asserts every allowlist option present, asserts
  the blurb updates when the value changes, asserts the
  control respects `disabled`.

**Edited:**

- `app/api/sessions/route.ts` —
  - `BodySchema` grows by `model: z.string().min(1).optional()`.
  - After parse, compute `const selectedModel =
    resolveModel(body.model ?? null)`.
  - Replace the existing
    `const model = process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-7'`
    line with `const model = selectedModel`.
  - No other behavior change; the SSE stream and
    orchestrator already consume `model` via the session
    row.
- `app/api/sessions/__tests__/route.test.ts` (or wherever
  the create-flow happy-path test lives) — add cases:
  - body with valid `model` is honored.
  - body without `model` defaults to `DEFAULT_MODEL`.
  - body with unknown `model` defaults to `DEFAULT_MODEL`
    (allowlist fallback, not a 400 — graceful).
- `components/boardroom/board-client.tsx` (or the parent
  shelf orchestrator that already owns pitch + persona
  state) — wire a `model` state slot, default
  `DEFAULT_MODEL`; pass it down to `<ModelPicker>`; include
  it in the `POST /api/sessions` request body alongside
  the existing fields.
- `components/boardroom/__tests__/board-client.test.tsx`
  (or sibling shelf test) — assert the request body now
  includes `model: DEFAULT_MODEL` by default; assert it
  switches when the picker changes.
- `e2e/url-contract.ts` — the `/api/sessions` POST body
  used by the smoke walker stays compatible because
  `model` is optional with allowlist fallback. No edit
  needed unless the walker fails locally, in which case
  add `model: DEFAULT_MODEL` to the canned body.

**No new SQL.** `sessions.model text not null` already
exists (phase 7a); we just stop overriding it with the
env var.

## Constants

`lib/anthropic/models.ts` exports:
```ts
export const AVAILABLE_MODELS = [
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
] as const

export const DEFAULT_MODEL: AvailableModel = AVAILABLE_MODELS[0]
```

The `as const` makes the array a literal tuple so callers
can derive a string-union type
(`AvailableModel = typeof AVAILABLE_MODELS[number]`) without
a separate enum.

## Session events + reducer

No new SSE event types. The `model` is captured on the
session row at create time; existing events (`turn.begin`,
`turn.delta`, `turn.end`, `clarify.prompt`, `exec-summary`,
`artifact`, `session.done`) carry no model field and don't
need one — the SessionUsageFooter on
`/app/sessions/[id]` already reads `model` off the
persisted session row to look up `MODEL_RATES`.

## Cross-links

**In** (verify still wired):
- `lib/observability/pricing.ts` MODEL_RATES — every
  allowlist model has a price row; the test in
  `models.test.ts` enforces this.
- Phase 16's SessionUsageFooter — renders the model name
  next to cost; benefits automatically when sessions span
  multiple models.

**Out** (ship):
- Surface change in the authed boardroom shelf
  (new picker).
- Wider `POST /api/sessions` schema (additive,
  backward-compatible).

**Retro-fit:**
- None. The picker is additive to the shelf; existing
  layouts continue to work. The `/try` demo is unchanged
  (no API call, fixed canned data).

## SEO / metadata

N/A. `/app` is already `noindex` (authed route).

## Hero / body / sub-section composition

The boardroom shelf currently stacks PersonaShelf →
PitchInput → StartSessionButton vertically. The picker
slots between PitchInput and StartSessionButton as a
small mono-eyebrow row:

```
MODEL
[ Opus 4.7 (default) ▾ ]
  Default. Best reasoning, highest cost.
```

Mobile collapses to the same one-column stack as today.
No bespoke layout work.

## Empty / loading / error states

- **Picker default state:** renders `DEFAULT_MODEL`
  selected; blurb visible; no spinner.
- **API: unknown model:** request body validates as
  optional, then `resolveModel` falls back to
  `DEFAULT_MODEL`. No 400 — graceful by design (the
  allowlist may shrink between client cache and server
  deploy; falling back beats failing closed).
- **API: model omitted:** same fallback path; no error.
- **Picker disabled:** when `StartSessionButton` enters the
  in-flight state, the picker also disables so the user
  can't switch mid-stream.

## Decisions made upfront — DO NOT ASK

- **Native `<select>`, not a custom listbox.** Matches the
  existing PitchInput / StartSessionButton register
  (plain, terse, no flourishes). Accessibility is free
  with native primitives; the boardroom shelf doesn't
  need a designer-grade picker yet.
- **Allowlist of three models in v1.** Opus 4.7 (default),
  Sonnet 4.6 (balanced), Haiku 4.5 (cheap+fast). One
  representative per tier; lets a user trade cost ↔
  capability without choice paralysis. Adding models is a
  PR away.
- **`AVAILABLE_MODELS[0]` is the default.** Single source
  of truth — `DEFAULT_MODEL` derives from the array, not
  a separate constant that could drift.
- **Server-side fallback on unknown model**, not a 400.
  Reasons: (a) clients may cache an old allowlist; (b) the
  allowlist may shrink between PR and deploy; (c) graceful
  beats failing closed on a non-malicious mismatch.
  Validation still rejects non-strings (Zod), so the
  surface area is bounded.
- **One model per session**, not per-persona. Reasons: (a)
  per-persona is a much bigger UX surface and a per-persona
  cost-attribution schema is a phase 16 follow-up that
  doesn't exist; (b) the spec's "boardroom" metaphor
  treats personas as collaborators sharing one table — one
  conversation, one model engine. Per-persona is filed as
  Follow-up.
- **`process.env.ANTHROPIC_MODEL` stays as the fallback for
  out-of-session code paths** (tests, scripts, operator
  diagnostics). The session-create handler stops reading
  it; everything else keeps the existing precedence. This
  is intentionally narrow — no behavioral change for the
  conferring orchestrator's `defaultModel()`.
- **Demo path unchanged.** `/try` is canned; no
  ANTHROPIC_API_KEY needed. The picker is authed-only.
- **Picker disables during in-flight session.** Switching
  mid-stream is meaningless (the session row's `model` is
  already chosen) and would mislead the user into thinking
  the live transcript was about to switch engines.
- **Blurbs are one short line each.** Long blurbs would
  push the StartSessionButton below the fold on common
  shelf widths; the picker's job is fast cost ↔
  capability triage, not a model spec sheet.
- **No "rates" tile on the picker itself.** Cost numbers
  live in SessionUsageFooter post-session and in the
  /admin top-cost table. The picker shows qualitative
  trade-off ("highest cost" / "balanced" / "cheap"), not
  per-MTOK numbers — those drift faster than UI deploys
  and the source of truth is `MODEL_RATES`.
- **Auth boundary bounds cost runaway.** Per-model caps
  are deferred; the existing phase-9 per-account quota
  (10 sessions/day) + the per-session 60k-token cap keep
  the worst case bounded regardless of model choice.
  Per-model caps land if usage analytics ever justify
  them.
- **Picker label is `MODEL` (uppercase, mono).** Matches
  the shelf's existing eyebrows for PersonaShelf / Pitch.
- **No tooltip / popover** for model details. Adding a
  popover surface is bigger than the value it adds at v1;
  the blurb line is enough. Users wanting depth click
  through to a future docs page or the Anthropic console.

## Mobile reflow / responsive

The picker fits the shelf's existing one-column mobile
stack. The native `<select>` opens the OS-native picker
on mobile — free affordance, no work. No 375px-specific
edits.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/anthropic/models.ts` | AVAILABLE_MODELS[0] = DEFAULT_MODEL; every model has MODEL_RATES + label + blurb; isAllowedModel covers each entry + null/empty/unknown; resolveModel falls back on null/unknown | — |
| `components/boardroom/model-picker.tsx` | renders every allowlist option; blurb updates on change; respects disabled | — |
| `app/api/sessions/route.ts` | body with valid `model` honored; body without `model` defaults; body with unknown `model` defaults to DEFAULT_MODEL (allowlist fallback, not 400) | — |
| boardroom shelf (board-client) | model state defaults to DEFAULT_MODEL; POST body includes model; picker change updates posted model | — |

No new e2e spec. The smoke walker's existing
`POST /api/sessions` exercise continues to pass because
`model` is optional with fallback. If the walker happens
to assert the response shape (it doesn't currently), no
edit is needed — `model` is on the session row, not in
the SSE stream.

## Hermetic e2e registration

No new hermetic e2e. The shelf-side change is covered by
unit tests against the client component + the API route
handler. The /api/sessions POST integration test (if it
exists) gets the three new cases above.

## Verify gate

```bash
pnpm verify
```

Runs typecheck → test:run → data:validate → build → e2e.
**Each leg is a hard gate.**

## Commit body template

```
feat: model picker — phase 24

- lib/anthropic/models.ts: AVAILABLE_MODELS allowlist (3
  models: Opus 4.7 default, Sonnet 4.6, Haiku 4.5) with
  MODEL_LABELS + MODEL_BLURBS; DEFAULT_MODEL derives from
  AVAILABLE_MODELS[0]; isAllowedModel + resolveModel for
  membership + safe fallback. Tested — every allowlist
  model has a MODEL_RATES + label + blurb entry.
- components/boardroom/model-picker.tsx: native <select>
  with mono "MODEL" eyebrow + one-line blurb; disabled
  during in-flight session.
- components/boardroom/board-client.tsx (or shelf parent):
  model state slot, default DEFAULT_MODEL, posts in body.
- app/api/sessions/route.ts: BodySchema grows by optional
  model field; resolveModel falls back to DEFAULT_MODEL
  for unknown/missing; create handler stops reading
  ANTHROPIC_MODEL env at session create time.

Decisions:
- Native <select>; matches the shelf's plain register.
- 3-model v1 allowlist (one per tier); PR to add more.
- Server-side fallback on unknown model (not 400) so
  client/server allowlist drift is graceful.
- One model per session (not per-persona); per-persona
  filed as Follow-up.
- ANTHROPIC_MODEL env stays as fallback for non-session
  code paths.
- Picker disables during in-flight session.
- Qualitative blurbs ("highest cost" / "balanced" /
  "cheap"); no per-MTOK numbers on the picker.

No new migrations. sessions.model already exists.

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 24's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash.

No new `[operator]` AUDIT row — the only operator action
is the existing ANTHROPIC_API_KEY which is already a
shipping requirement.

## Follow-ups (out of scope this phase)

- **Per-persona model selection** — each persona picks its
  own model; cost attribution per persona becomes a
  separate axis. Requires a phase 16 follow-up
  `turn_usage` table (currently filed) to keep
  per-persona cost honest.
- **Per-model token caps** — if usage analytics show
  Haiku sessions chewing through far more tokens than
  Opus (or vice versa), pin tighter caps in
  `lib/limits.ts`. Out of v1 — the existing per-session
  60k-token cap suffices.
- **Model details popover / docs page** — link the picker
  blurb to a longer page describing each model. Out of
  v1; the blurb line is enough.
- **Cost preview tile** — phase 25 candidate already
  covers a pre-session forecast based on the picked
  model. Don't duplicate here.
- **Persisted preference** — remember a user's last model
  choice across sessions. Out of v1; defaults are fine.
- **Beta-tier toggle** — when a new model lands in beta
  (claude-opus-5-x?), surface a "beta" tag. Out of v1.
