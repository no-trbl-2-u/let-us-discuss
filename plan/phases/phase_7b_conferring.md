# Phase 7b — Anthropic orchestrator + live conferring flow

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.
>
> Split from the original phase 7 via `/oversight` on
> 2026-05-16. See `phase_7a_sessions_scaffold.md` for the
> first half (DB schema, API route shells, shared helpers,
> session-side reducer wired against the not-implemented
> path).
>
> **Budget extra care: this is the product's core gameplay.
> 7a built the wire; 7b lights up the loop.**

## Prerequisite

Phase 7a (`phase_7a_sessions_scaffold.md`) must have shipped
and the migration must have been applied to the Supabase
project. 7b assumes:

- `lib/sessions/{events,sse,repo,budget}` exist with the
  shapes 7a locked.
- `lib/anthropic/client.ts` exports `AnthropicConfigError` +
  `getAnthropicClient()`; the latter throws when the env var
  is unset (7b uses the typed client directly).
- `app/api/sessions/route.ts` exists and currently returns
  `session.started` + `session.error code=not-implemented`.
- `components/boardroom/use-session-state.ts` + the
  `session-stream.ts` hook are wired to the Start button.
- The DB tables (`sessions`, `turns`, `artifacts`) are
  present with RLS.

## Outcome

The `/app` running flow becomes the real product. The route
no longer emits `not-implemented`; it walks the full session
lifecycle per `pitch-to-spec`:

1. **Clarify round.** Each `role: lead` persona at the table
   asks one short clarifying question (≤4 total). The route
   emits `checkpoint.clarify` for each; the client surfaces a
   `ClarifyPrompt`; user answers via
   `POST /api/sessions/[id]/answer`; the orchestrator resumes.
2. **Confer round.** Leads + specialists exchange turns up to
   the template's `confer.turn_budget = 8`.
3. **Exec-summary checkpoint.** Moderator turn emits the
   exec-summary card; user *Accept*s or *Redirect*s
   (≤`escalation.user_redirect_max = 2`). The route emits
   `checkpoint.exec-summary`.
4. **Specialist round.** Specialists drill in (turn budget 8).
   Convergence below
   `escalation.convergence_min_agreement = 0.7` emits a
   moderator-escalate turn that surfaces as a
   `checkpoint.clarify` for the user.
5. **Artifact round** (budget 4). The route writes one row to
   `public.artifacts` and emits
   `artifact.ready{ spec, summary, callouts, tokens }`.
6. Route emits `session.done`; client flips to the artifact
   preview grid.

Token budget enforced against `MAX_SESSION_TOKENS=60_000`.
Hard cap → `budget.wrap` event → orchestrator transitions
straight to the artifact round on whatever turns exist.

## Dependencies (operator action required for runtime)

- **`ANTHROPIC_API_KEY` must be set** in `.env` (local) and
  the Vercel project env (Production + Preview). The route
  short-circuits with `session.error code=config` if missing —
  graceful, not vague — but no real session runs until the
  key lands. `setup/04_anthropic.md` flips STUB → OK once
  populated.
- `ANTHROPIC_MODEL` defaults to `claude-opus-4-7`. Per-persona
  overrides remain **out of scope** in v1.

## Routes / endpoints (locked)

- `POST /api/sessions` — replaces 7a's `not-implemented`
  return with the orchestrator. The status enum the route
  writes flips from `'aborted'` to `'clarify'` on insert; the
  status column is updated as phases transition; final state
  is `'done'` on success, `'aborted'` on stream cancel /
  re-entrance / fatal error.
- `POST /api/sessions/[id]/answer` — replaces 7a's 501 with
  the resume contract. Body:
  `{ kind: 'clarify' | 'exec-summary-accept' | 'exec-summary-redirect', body: string }`.
  401 for non-owner. Resumes the orchestrator that was paused
  on a checkpoint.

Re-entrance: if a `POST /api/sessions` arrives from a user
with a non-terminal session row, the existing session is
marked `aborted` and a fresh one starts.

## Components / handlers (in `components/boardroom/`)

Adds the live-flow UI on top of the 7a scaffold. The
`NotImplementedCard` is **deleted** in this phase.

- `live-transcript.tsx` — renders the session's turns
  through `TurnBubble`. The in-flight turn uses the
  streaming caret (TurnBubble's existing `streaming` prop);
  the moderator turn uses `register="moderator"`. Auto-scroll
  on new turn.
- `clarify-prompt.tsx` — `Card` + `Input` + submit button.
  Posts to `/api/sessions/[id]/answer` with
  `kind: 'clarify'`. Auto-focused.
- `exec-summary-card.tsx` — `Card` with the moderator's
  exec-summary body, two buttons: *Accept* (primary) and
  *Redirect* (secondary, opens an inline 1-sentence textarea).
  Submit posts `kind: 'exec-summary-accept'` or
  `kind: 'exec-summary-redirect'`.
- `artifact-preview-grid.tsx` — three `ArtifactTile`s with
  `downloadable=true` and an `onDownload` that calls a stub
  (alerts "Download UI ships in phase 10"). Tiles read from
  `session.artifact` in the reducer state.
- `session-error.tsx` — surface for `session.error` events
  by code: `config` → operator-action copy + Sign out;
  `auth` → redirect to /signin; `moderation` → placeholder
  for phase 8's polite-refuse copy; `internal` → generic
  retry copy.
- `budget-banner.tsx` — small inline banner under the
  transcript surfaced by `budget.warn`; never blocks the
  flow.

## Library (new code)

- `lib/anthropic/conferring.ts` — the orchestrator. Pure
  async-generator over the template phases. Per-turn
  responsibilities:
  - Build messages array from prior turns (assistant for
    persona / moderator; user for the pitch + answers).
  - Build system prompt: persona.systemPrompt + a 1–4-line
    template-derived directive (current phase + role in the
    round).
  - Call `client.messages.stream(...)`; pipe `text_delta`
    events to `turn.delta` SSE events.
  - On stream end, compute tokens, write a `turns` row,
    emit `turn.end`.
  - Round-robin within a phase by `loadPersonas()` order
    (leads first). Moderator turns are emitted between
    phases (not in the round-robin).
  - Track convergence within the specialist round (count
    how often personas agree on the top-3 spec bullets);
    below 0.7 → emit a moderator-escalate turn.
- `lib/anthropic/__tests__/conferring.test.ts` — full
  matrix from the original phase 7 brief (clarify limit,
  confer budget, exec-summary checkpoint, specialist
  budget, convergence escalation, redirect cap, budget
  wrap, artifact emission). Anthropic SDK is mocked.

## API handlers (in `app/api/sessions/`)

Both routes change:

- `app/api/sessions/route.ts`:
  - `createSession` writes `status='clarify'`.
  - Tries `getAnthropicClient()`; on `AnthropicConfigError`,
    emits `session.error code=config` + closes (one event,
    not the two-event `not-implemented` pattern).
  - Otherwise: runs the orchestrator inside the stream's
    `start(controller)`. On stream cancel (user navigates
    away), `markStatus('aborted')`.
- `app/api/sessions/[id]/answer/route.ts`:
  - Validates `sessionId` belongs to the authed user
    (Supabase RLS does the heavy lifting; the route reads
    one row to confirm).
  - Writes a `user` turn.
  - Pokes the in-memory orchestrator map (sessionId → resume
    callback) to continue. If the orchestrator isn't found
    (server restarted between checkpoint and answer), return
    `409 { code: 'session-resume-lost' }` and have the
    client show a friendly "session interrupted — start a
    new one" toast.

## DB writes (lit up in this phase)

- `createSession(...)`: writes initial row with
  `status='clarify'`.
- `appendTurn(...)`: called per turn (persona, moderator,
  user). `idx` increments monotonically.
- `finalizeArtifact(...)`: one row in `artifacts`.
- `markStatus(...)`: called on phase transition + abort + done.

## Cross-links

**In** (from 7a):
- `lib/sessions/*` modules.
- `use-session-state.ts` reducer + `session-stream.ts` hook.
- Migration is applied.

**Out** (this phase):
- The orchestrator's shape — phase 8 wraps inputs +
  per-turn outputs with the moderation pre-filter; the
  moderation insertion points are at the start of
  `runClarifyRound` (user input) and at each `turn.end`
  (persona output).
- The artifact body shape — phase 10 reads `spec_md`,
  `exec_summary`, `callouts` columns; this phase doesn't
  change them.

**Retro-fit**:
- Delete `not-implemented-card.tsx` (7a) and its import in
  `board-client.tsx`.
- `app/app/page.tsx` header eyebrow flips between
  `pre-session` / `running` / `done` micro-copy; H1
  (`Staff a table.`) becomes dynamic
  (`Boardroom in session.` / `Session complete.`).

## SEO / metadata

Unchanged from phase 5 + 7a.

## Empty / loading / error states

- **Pre-session:** unchanged.
- **Opening stream (waiting on first event):** a
  `TurnBubble thinking` with name "Boardroom" + moderator
  register, so the user immediately sees "thinking".
- **Turn streaming:** blinking caret on the in-flight turn;
  `turn.end` settles it.
- **Clarify checkpoint:** prompt below the transcript;
  auto-focused.
- **Exec-summary checkpoint:** card with two buttons;
  Accept primary, Redirect with inline textarea.
- **`budget.warn`:** inline banner under the transcript
  (non-blocking).
- **`budget.wrap`:** moderator turn announces wrap; artifact
  round runs on existing turns; phase 9 improves UX.
- **`session.error code=config`:** SessionErrorCard with
  the operator-action copy.
- **`session.error code=auth`:** redirect to
  `/signin?next=/app`.
- **`session.error code=moderation`:** placeholder
  copy — phase 8 owns this.
- **`session.error code=internal`:** generic retry copy.

## Decisions made upfront — DO NOT ASK

(Inherits from 7a; the additions specific to 7b:)

- **Model pin:** `ANTHROPIC_MODEL` env, default
  `claude-opus-4-7`. No per-persona override.
- **SDK:** `@anthropic-ai/sdk` (official); installed as the
  first commit of 7b (separate from the feature commit).
- **Runtime:** Node.js (matches 7a).
- **Streaming API:** Anthropic SDK's `messages.stream(...)`
  consumed as an async iterable; deltas piped through to
  the SSE `turn.delta` event verbatim. No batching.
- **System prompt composition:** persona.systemPrompt +
  template-phase directive (assembled from the template
  JSON's phase `description`). No retrieval, no tool use
  in v1 — straight `client.messages.stream`.
- **Convergence signal:** count of persona agreements on
  the spec's top-3 bullets from the prior turn's
  exec-summary card. Below 0.7 → escalate (moderator turn).
  Hard cap on user redirects = 2.
- **Token budget enforcement:** before each persona turn,
  `budget.willOverflow(estimatedNext)`. On overflow:
  `budget.wrap` event → transition to artifact.
- **Resume map is in-memory** (single Vercel instance for
  v1). On worker restart, in-flight sessions return
  `session-resume-lost` on the next answer POST.
- **No retry on Anthropic 5xx.** Surface; user starts a
  new session.
- **Moderation NOT in 7b.** Phase 8 wraps the input + the
  per-turn outputs.
- **`session.error code=moderation`** is emitted by phase
  8's wrappers, not by 7b's orchestrator. 7b just leaves the
  shape reserved.

A brief that leaves Open Qs is a brief that fails its job.

## Mobile reflow / responsive

- The live transcript + checkpoints stack below the
  surface + pitch in the right column.
- `ExecSummaryCard` is full-width below `md`; two buttons
  stack vertically.
- 375px reflow: no horizontal scroll
  (`scrollWidth - innerWidth ≤ 1`).

## Pages × tests matrix

(All new tests; the 7a tests for shared helpers stay green
unchanged.)

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/anthropic/conferring.ts` | clarify round caps at 4 prompts; confer round respects turn budget; exec-summary emits as event; specialist round respects budget; convergence < 0.7 emits escalate; redirect cap honored; budget wrap → artifact round; artifact emits exactly 3 artifacts (Anthropic SDK fully mocked) | — |
| `app/api/sessions/route.ts` | (extended) missing ANTHROPIC_API_KEY → single `session.error code=config` event; happy path with mocked Anthropic emits the expected SSE sequence | — |
| `app/api/sessions/[id]/answer/route.ts` | (extended) user-turn write contract; orchestrator-resume contract via the in-memory map; 409 when map entry missing; rejects answers to non-owned sessions | — |
| `live-transcript.tsx` | renders TurnBubble per turn; streaming caret only on the in-flight turn; moderator register for moderator turns | — |
| `clarify-prompt.tsx` | submit calls onAnswer with the body; empty submit blocked; max-length soft-hint | — |
| `exec-summary-card.tsx` | accept + redirect; redirect opens textarea; submit calls correct handler with text | — |
| `artifact-preview-grid.tsx` | three tiles, downloadable=true, onDownload fires (stub toast) | — |
| `session-error.tsx` | each code renders its case | — |
| `/app` running flow (authed) | — | **Gated** on magic-link e2e wiring per plan/AUDIT.md. When auth e2e walks the authed surface, add a test that types a pitch, starts a session against a route-mode env that swaps to fixture responses, asserts ClarifyPrompt → ExecSummaryCard → ArtifactPreviewGrid sequence. Until then, the matrix above is the contract. |

## Hermetic e2e registration

No new public-anon e2e (the 7a anon-401 spec stays). Authed
e2e remains gated on the inbox-credential operator row.

## Verify gate

```bash
pnpm verify
```

All checks pass before commit. Pre-step: `pnpm add
@anthropic-ai/sdk` is a separate commit landing first.

## Commit body template

```
feat: multi-persona conferring loop — phase 7b

- /api/sessions: orchestrator replaces 7a's not-implemented
  return. Anthropic-backed clarify → confer → exec-summary
  → specialists → artifact rounds per the pitch-to-spec
  template's phase definitions
- /api/sessions/[id]/answer: orchestrator resume on clarify
  + exec-summary checkpoints; 409 when the in-memory
  resume map is missing (server restart)
- @anthropic-ai/sdk installed (separate prior commit);
  lib/anthropic/conferring.ts owns the orchestration
- components/boardroom: LiveTranscript + ClarifyPrompt +
  ExecSummaryCard + ArtifactPreviewGrid + SessionErrorCard
  + BudgetBanner light up. 7a's NotImplementedCard is
  deleted along with its import in board-client.tsx
- Token budget enforced against MAX_SESSION_TOKENS=60_000;
  budget.wrap → straight to artifact round
- Anonymous /try unchanged; demo stays canned

Decisions:
- @anthropic-ai/sdk over Vercel AI SDK (bespoke SSE in 7a's
  events.ts; we own the wire)
- Single env-pinned model for every persona in v1
- Re-entrance aborts the in-flight session
- In-memory resume map (single Vercel instance is fine in
  v1); on worker restart the next answer POST gets 409
- Moderation NOT here; phase 8 wraps the orchestrator's
  input + per-turn output
- Per-account quota + per-IP throttle + graceful-wrap UX
  are phase 9

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 7b's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash, add to
"Phase log".

## Follow-ups (out of scope this phase)

(Same as the original phase 7 brief — phase 8 moderation,
phase 9 anti-abuse, phase 10 download UI, phase 11
past-session surface, post-v1 retry/backoff and
multi-instance resume.)
