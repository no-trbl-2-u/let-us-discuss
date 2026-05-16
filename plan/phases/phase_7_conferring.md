# Phase 7 — Multi-persona conferring loop (the product's core gameplay)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.
>
> Drafted via `/plan-a-phase` on 2026-05-16 against:
> - phase 5 brief (canonical sibling — `phase_5_boardroom_canonical.md`)
> - phase 6 brief (immediate sibling — `phase_6_anonymous_demo.md`)
> - design v1 (commit `76c9338`) — `TurnBubble` streaming variant
>   lights up here; `ArtifactTile` `downloadable=true` for the
>   first time
> - bearings.md L88–100 (Identity tiers), L107–112 (token cap),
>   L134–145 (AI usage map — Anthropic for persona reasoning,
>   model pinned per phase brief), L156–168 (`/api/sessions`
>   locked)
> - spec.md L54–80 (session lifecycle), L181–186 (Vercel
>   streaming primitives)
> - setup/04_anthropic.md (currently STUB — operator owns the
>   API-key + spend-limit setup; phase 7 ships against the
>   keyed path; runtime errors with a clear `[needs-user-call]`
>   surface if `ANTHROPIC_API_KEY` is missing)
>
> **Budget extra care: this is the product's core gameplay.**

## Outcome

Authed `/app` runs a real multi-persona conferring session
end-to-end:

1. User staffs 2–6 personas + writes a pitch (phase 5 UI).
2. Clicks "Start session"; the page transitions to `running`.
3. The **lead-ring clarifying round** plays out — each `role:
   lead` persona at the table asks one short clarifying question
   (max 4 across all leads per round). User answers each with a
   1-word / 1-sentence reply.
4. The **confer round** plays — leads + specialists exchange
   turns (turn budget: `pitch-to-spec` template's `confer.turn_budget = 8`).
5. The **executive-summary checkpoint** renders: the Boardroom
   moderator emits a single exec-summary card with two buttons:
   *Accept* and *Redirect* (1-sentence input). This is the
   single user-facing checkpoint inside the loop per spec.
6. The **specialist round** runs (turn budget 8). Personas only
   escalate back to the user if they genuinely cannot converge
   (a convergence-score < `escalation.convergence_min_agreement
   = 0.7` triggers a "Boardroom escalates" moderator turn — at
   most `escalation.user_redirect_max = 2` redirects total).
7. The **artifact round** emits the three artifacts: spec.md,
   exec summary, call-outs (turn budget 4).
8. Session settles into `done`; `ArtifactTile`s render with
   `downloadable=true` (phase 10 wires the actual file download
   — this phase ships the preview tiles in the same shell).

State is persisted to Postgres for authed users. The transcript
is server-rendered from the DB on subsequent loads of the same
`/app/sessions/[id]` URL (phase 11 lights up the list +
permalinks; phase 7 introduces the schema). Per-account quota
+ per-session token cap UX land in phase 9.

## Dependencies (operator action required before runtime works)

- **`ANTHROPIC_API_KEY` must be set** in `.env` (local) and the
  Vercel project env (Production + Preview). The route handler
  errors clearly if the key is missing — surfaces a single
  `[needs-user-call]` audit row rather than a vague 500.
  setup/04_anthropic.md Section A documents the key creation;
  flip its STUB header to OK once populated.
- **`ANTHROPIC_MODEL` defaults to `claude-opus-4-7`** (from
  .env.example). Per-persona overrides via persona frontmatter
  (`tools`-style optional field) are **out of scope** for this
  phase; every persona uses the env-pinned model.
- **No new external accounts**. Supabase tables created via
  the migration below; Anthropic is the only AI dependency.

## Routes / endpoints (locked in `bearings.md`)

- `POST /api/sessions` — server-streamed session orchestrator.
  Request body: `{ pitch: string, personaSlugs: string[],
  templateSlug: string }`. Response: a `text/event-stream` of
  typed events (see Streaming protocol below). Auth: cookie-
  bound (the route reads `getCurrentUser()`; anonymous requests
  401).
- `POST /api/sessions/[id]/answer` — submits a user reply to a
  clarifying question or an exec-summary redirect. Same auth.
  Response: the route resumes the stream by continuing the
  conferring loop.
- The `/app/sessions/[id]` route + the past-sessions list are
  **phase 11**; phase 7 ships the schema + write path so
  rows exist when phase 11 reads them.

No retro-fit on `/try` — phase 6's canned demo stays canned.
Per spec, the anonymous tier never reaches Anthropic.

## Database schema (first real migration)

`db/migrations/20260516_phase_7_sessions.sql`:

```sql
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pitch text not null,
  template_slug text not null,
  persona_slugs text[] not null,
  model text not null,
  status text not null check (status in (
    'clarify','confer','exec-summary','specialists','artifact','done','aborted'
  )),
  total_tokens int not null default 0,
  ip_hash text,                -- 30d retention, see spec.md L168
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  idx int not null,
  phase text not null check (phase in (
    'clarify','confer','exec-summary','specialists','artifact','moderator'
  )),
  persona_slug text,           -- null for moderator + user turns
  author text not null check (author in ('persona','user','moderator')),
  body text not null,
  replying_to text,            -- persona slug or 'the table'
  tokens int not null default 0,
  created_at timestamptz not null default now(),
  unique (session_id, idx)
);

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  spec_md text not null,
  exec_summary text not null,
  callouts text not null,
  tokens_used int not null,
  finished_at timestamptz not null default now()
);

-- RLS: a user can only see their own rows.
alter table public.sessions   enable row level security;
alter table public.turns      enable row level security;
alter table public.artifacts  enable row level security;

create policy sessions_self on public.sessions
  for all to authenticated using (user_id = auth.uid());
create policy turns_self on public.turns
  for all to authenticated using (
    exists (select 1 from public.sessions s where s.id = turns.session_id and s.user_id = auth.uid())
  );
create policy artifacts_self on public.artifacts
  for all to authenticated using (
    exists (select 1 from public.sessions s where s.id = artifacts.session_id and s.user_id = auth.uid())
  );
```

Run `pnpm db:types` after applying to regenerate
`lib/supabase/database.types.ts`. The migration is operator-run
in this phase (`setup/03_supabase.md` Section D adds a "psql
this file against your project" step); phase 9 / phase 13 can
ratify a real CLI runner if needed.

## Content / data reads

| Helper | Lookup | Use |
|---|---|---|
| `loadPersonas()` | `lib/personas/load.ts` | Server-side: hydrate the persona system prompts for each persona slug submitted with the session. Sort: leads first (already enforced by the loader). |
| `loadTemplate(slug)` | `lib/templates/load.ts` | Read phase definitions: clarify max-questions, confer turn-budget, exec-summary checkpoint flag, specialist turn-budget, artifact turn-budget, escalation thresholds. |
| `MAX_SESSION_TOKENS` | `lib/limits.ts` (extend; initial value 60_000) | Hard ceiling per session. Phase 9 surfaces the graceful-wrap UX; phase 7 enforces the hard cap (next turn after the cap is reached emits the moderator "wrap" and transitions to artifact). |
| `getCurrentUser()` / `requireUser()` | `lib/supabase/auth.ts` (phase 3) | Both API routes call `requireUser()`. |
| `createServerClient()` | `lib/supabase/server.ts` (phase 2) | All DB reads + writes. |

## Library / helpers (new code)

- `lib/anthropic/client.ts` — typed `@anthropic-ai/sdk` factory.
  Reads `ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL`. Throws a
  named error (`AnthropicConfigError`) if the key is unset so
  the route can surface a clear 503.
- `lib/anthropic/conferring.ts` — the orchestrator. Pure-ish
  TS that consumes the template phase definitions + persona
  system prompts and yields turns as an async iterator. Calls
  `client.messages.stream(...)` per turn; emits SSE-shaped
  events upstream.
- `lib/sessions/repo.ts` — DB read/write helpers
  (`createSession`, `appendTurn`, `finalizeArtifact`,
  `markStatus`). Each is a thin wrapper around Supabase calls;
  the orchestrator stays DB-agnostic.
- `lib/sessions/events.ts` — the SSE event-type discriminated
  union shared between server and client. See Streaming
  protocol below.
- `lib/sessions/budget.ts` — token-budget tracker. Phase 9
  reuses this for the per-session cap UX; phase 7 owns the
  hard wrap.

## Streaming protocol (server → client SSE events)

```ts
type SessionEvent =
  | { t: 'session.started'; sessionId: string }
  | { t: 'phase.entered'; phase: 'clarify'|'confer'|'exec-summary'|'specialists'|'artifact' }
  | { t: 'turn.begin'; turnId: string; idx: number; phase: SessionPhase; persona: PersonaRef | 'moderator' }
  | { t: 'turn.delta'; turnId: string; delta: string }
  | { t: 'turn.end'; turnId: string; tokens: number; replyingTo?: string }
  | { t: 'checkpoint.exec-summary'; turnId: string }    // pause; wait for /answer
  | { t: 'checkpoint.clarify'; turnId: string }         // pause per question
  | { t: 'budget.warn'; remaining: number }
  | { t: 'budget.wrap' }                                // hard cap hit
  | { t: 'artifact.ready'; spec: string; summary: string; callouts: string; tokens: number }
  | { t: 'session.done' }
  | { t: 'session.error'; code: 'config'|'auth'|'moderation'|'internal'; message: string }
```

Events serialize as JSON-Line `data: ...\n\n` chunks per the
SSE spec. Client uses native `EventSource` — no SDK install.

## Components / handlers (in `components/boardroom/`)

The phase-5 file family extends with the live-session
machinery. The existing `board-client.tsx` already routes the
state machine through `running`; phase 7 wires the
`onStartSession` event to actually call `/api/sessions` and
process the stream.

- `session-stream.ts` — `'use client'` hook that subscribes
  to `/api/sessions`, parses SSE events, dispatches into a
  new reducer (separate from the board reducer so the
  pre-session UI stays unchanged).
- `use-session-state.ts` — session-side reducer + tests. State
  shape:
  ```ts
  type SessionState = {
    sessionId: string | null
    phase: SessionPhase | 'pending' | 'done'
    turns: Turn[]
    currentCheckpoint: null | { kind: 'clarify'|'exec-summary'; turnId: string }
    artifact: { spec: string; summary: string; callouts: string; tokens: number } | null
    error: { code: string; message: string } | null
    budget: { used: number; remaining: number; wrapped: boolean }
  }
  ```
- `live-transcript.tsx` — wraps `TurnBubble` with the
  streaming variant. Renders the running turn with the
  blinking-caret affordance; settles when `turn.end` arrives.
- `clarify-prompt.tsx` — renders the in-flight clarifying
  question; user types a 1-sentence answer + submit. POSTs to
  `/api/sessions/[id]/answer`.
- `exec-summary-card.tsx` — renders the exec-summary
  moderator turn with two buttons: *Accept* and *Redirect*.
  Redirect opens an inline 1-sentence textarea; submit POSTs
  to `/api/sessions/[id]/answer`.
- `artifact-preview-grid.tsx` — three `ArtifactTile`s with
  `downloadable=true` and an `onDownload` that calls the phase
  10 stub (returns a "Download UI ships in phase 10" toast for
  this phase; the wire is in place).
- `boardroom-empty-hint.tsx` (phase 5) is unchanged.
- `transcript-placeholder.tsx` (phase 5) is **removed** —
  `live-transcript.tsx` replaces it. Delete the file in this
  phase and update `board-client.tsx`'s import.

Tests colocate in `components/boardroom/__tests__/`.

## API handlers (in `app/api/sessions/`)

- `app/api/sessions/route.ts` (`POST`) — opens the stream.
  Validates the request body (Zod), calls `requireUser()`,
  inserts a row in `public.sessions` with `status='clarify'`,
  returns a `Response` whose body is a `ReadableStream` of SSE
  events. The orchestrator runs inside the stream's
  `start(controller)` callback.
- `app/api/sessions/[id]/answer/route.ts` (`POST`) — accepts
  the user's reply to a checkpoint. Writes a `user` turn,
  resumes the orchestrator (in-memory map keyed by sessionId
  — phase 9 may need a Redis equivalent if we ever go
  multi-instance; for v1 single-Vercel-instance is fine).

Both handlers run on the **Node.js runtime** (not Edge) — the
Anthropic SDK uses Node primitives that don't fully work on
Edge yet, and v1 isn't latency-bound.

## Cross-links

**In** (already shipped — verify still wired):
- Phase 3 auth gates `/app` + `/api/sessions` (the API route
  calls `requireUser`; middleware unchanged).
- Phase 4 `loadPersonas()` + `loadTemplate()` continue to be
  canonical readers.
- Phase 5 `components/boardroom/board-client.tsx` keeps its
  reducer; `onStartSession` is the seam phase 7 wires into.
- Phase 6's `lib/demo/canned-session.ts` is unchanged
  (demo stays canned).

**Out** (this phase ships these):
- The shape of `lib/sessions/repo.ts` — phase 11 reads it for
  list + permalink.
- The artifact previews — phase 10 lights up the actual
  download UI (file save, MIME, copy-to-clipboard).

**Retro-fit**:
- `app/app/page.tsx`: header eyebrow flips between
  `pre-session` / `running` / `done` micro-copy; the existing
  H1 (`Staff a table.`) becomes dynamic.
- `components/boardroom/start-session-button.tsx`: keep the
  visual; the click handler now starts the real stream
  instead of being purely client-state.

## SEO / metadata

`/app` is `noindex` (unchanged from phase 5). No `/api/sessions`
metadata. Past-session permalinks (`/app/sessions/[id]`) ship in
phase 11; that's where the canonical-tag + private-cache
headers land.

## Hero / body / sub-section composition

Within the `/app/page.tsx` shell phase 5 established, the
right-column section becomes state-driven:

```
<section className="flex flex-col">
  <BoardroomSurface ... />                # phase 5; renders running rail when active
  <PitchInput
    disabled={sessionPhase !== 'pending'} ... />   # locked once /api/sessions opens
  <StartSessionButton
    disabled={... || sessionPhase !== 'pending'}
    onStart={beginSession} />
  {sessionPhase !== 'pending' && (
    <>
      <LiveTranscript turns={session.turns} />
      {session.currentCheckpoint?.kind === 'clarify' && (
        <ClarifyPrompt onAnswer={...} />
      )}
      {session.currentCheckpoint?.kind === 'exec-summary' && (
        <ExecSummaryCard onAccept={...} onRedirect={...} />
      )}
      {session.budget.wrapped && (
        <p className="… text-warning">Token budget hit — wrapping with what we have.</p>
      )}
      {session.error && <SessionError error={session.error} />}
      {session.phase === 'done' && session.artifact && (
        <ArtifactPreviewGrid artifact={session.artifact} />
      )}
    </>
  )}
</section>
```

## Empty / loading / error states

- **Pre-session (pitch input + start button):** unchanged from
  phase 5.
- **Stream opening (waiting on first event):** a single
  `TurnBubble thinking` with name "Boardroom" and the
  moderator register, so the user immediately sees "thinking".
- **Turn streaming:** each in-flight turn renders the blinking
  caret; `turn.end` settles the caret away.
- **Clarify checkpoint:** the prompt component is the next
  block below the transcript; auto-focused.
- **Exec-summary checkpoint:** card with two buttons; *Accept*
  is the recommended affordance (primary), *Redirect* is the
  secondary path with an inline single-line textarea.
- **Budget warn:** a small inline banner under the transcript
  ("token budget low — about 12% remaining"); does not
  interrupt the flow.
- **Budget wrap:** moderator turn announces wrap; the
  artifact round runs on whatever turns exist; phase 9
  improves the UX.
- **Error (`session.error`):** the session halts; show a
  single `Card` with the code-specific message:
  - `config` (e.g. ANTHROPIC_API_KEY missing): "This deploy
    isn't configured for real sessions yet — see plan/AUDIT.md
    [operator] Anthropic key." Show a "Sign out" button only.
  - `auth`: redirect to `/signin?next=/app`.
  - `moderation`: phase 8 owns the polite-refuse copy; phase
    7 surfaces a placeholder.
  - `internal`: "Something broke. Refresh to try again. If it
    keeps happening, the boardroom's loop is probably wedged
    — sorry."

## Decisions made upfront — DO NOT ASK

- **Model pin (v1):** `ANTHROPIC_MODEL` env var, default
  `claude-opus-4-7`. No per-persona overrides in this phase.
- **SDK:** `@anthropic-ai/sdk` (official). Vercel AI SDK is
  *not* used in this phase — the streaming protocol is
  bespoke SSE so we own the wire format. Adopting the Vercel
  AI SDK is a `/iterate` candidate post-v1 if surface area
  grows.
- **Runtime:** Node.js, not Edge (Anthropic SDK).
- **Per-persona prompt building:** each persona turn sends a
  `system` prompt = persona.systemPrompt + a small template-
  derived directive (1–4 lines describing the current phase).
  Messages history = all prior turns since session start
  (assistant role for persona / moderator turns; user role
  for the original pitch + user answers).
- **Convergence signal:** the orchestrator counts how often
  personas agree on the spec's top-3 bullets. Below 0.7, the
  moderator emits a "escalate" turn that surfaces as a
  `checkpoint.clarify` event. Hard cap on redirects = 2.
- **Token budget enforcement:** before each persona turn, sum
  the running total of `tokens_in + tokens_out`. If
  `total + estimated_next > MAX_SESSION_TOKENS`, emit
  `budget.wrap` and transition to `artifact`.
- **Turn ordering within a phase:** round-robin over the
  persona list as ordered by `loadPersonas()` (leads first).
  The moderator emits its own turns between phase
  transitions; not in the round-robin.
- **Persistence:** every event that produces a turn writes
  one row to `public.turns` before the SSE event is flushed.
  The artifact round writes one row to `public.artifacts` and
  flips `sessions.status='done'`. RLS already restricts to
  the session's owner.
- **Anonymous demo:** unchanged — `/try` does not talk to
  `/api/sessions` (per phase 6 brief and spec L130–142).
- **Re-entrance:** if a user reloads `/app` while a session
  is mid-run, **the session aborts**. The route writes
  `sessions.status='aborted'`. The next session starts fresh.
  Phase 11 surfaces aborted rows in the past-sessions list
  with an "aborted mid-flight" badge.
- **No retry on Anthropic 5xx in v1.** Surface the error; let
  the user start a new session. Phase 17 (polish) may add
  retry-with-backoff.
- **Moderation NOT in this phase.** Phase 8 inserts the
  input-pre-filter at the start of `/api/sessions` and the
  output-pre-filter on each persona turn. Phase 7's
  `session.error` shape reserves the `moderation` code for
  phase 8's use.
- **Component file naming:** `kebab-case.tsx`. Tests
  colocated. Pure helpers under `lib/sessions/` get their
  own `__tests__/` siblings.

A brief that leaves Open Qs is a brief that fails its job.

## Mobile reflow / responsive

- Below `md`: the live transcript stacks below the surface +
  pitch (the right-column flow stays vertical).
- `LiveTranscript` uses the same TurnBubble layout — already
  fluid.
- Exec-summary card is full-width below `md`; two buttons
  stack vertically with the redirect textarea below.
- 375px reflow: no horizontal scroll
  (`scrollWidth - innerWidth ≤ 1`).

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/anthropic/conferring.ts` | clarify-round emits at most 4 prompts; confer-round respects turn budget; exec-summary checkpoint surfaces as event; specialists round respects turn budget; convergence < 0.7 emits escalate; redirect cap honored; budget enforcement triggers wrap; artifact round emits exactly 3 artifacts | — |
| `lib/sessions/budget.ts` | sum tokens correctly; pre-turn check returns wrap when over cap | — |
| `lib/sessions/repo.ts` | mocked Supabase client: createSession returns id; appendTurn increments idx; finalizeArtifact writes one row; markStatus respects status enum | — |
| `app/api/sessions/route.ts` | unauthed → 401; missing ANTHROPIC_API_KEY → 503 with `session.error code=config`; happy-path emits expected SSE event sequence (mocked Anthropic stream) | — |
| `app/api/sessions/[id]/answer/route.ts` | rejects answers to non-owned sessions (RLS proxy in test); user-turn write + orchestrator-resume contract | — |
| `components/boardroom/use-session-state.ts` | reducer transitions on each event type; checkpoint state surfaces correctly; error halts | — |
| `components/boardroom/live-transcript.tsx` | renders TurnBubble per turn; streaming caret only on in-flight turn | — |
| `components/boardroom/exec-summary-card.tsx` | accept + redirect buttons; redirect surface opens textarea; submit calls onRedirect with text | — |
| `components/boardroom/clarify-prompt.tsx` | submit calls onAnswer; empty submit blocked; 1-sentence soft limit hinted | — |
| `components/boardroom/artifact-preview-grid.tsx` | three tiles render with downloadable=true; onDownload fires (stub toast) | — |
| `/app` running flow (authed) | — | **GATED on magic-link e2e wiring** (per plan/AUDIT.md). When the e2e walks the authed surface, add an e2e that types a pitch, starts a session against a **mocked** /api/sessions (set ANTHROPIC_API_KEY='test' + a route-mode env that swaps to fixture responses), and asserts the exec-summary card renders. Until then, the matrix above is the contract. |

## Hermetic e2e registration

Phase 7 does **not** ship a new authed e2e walking the live
session (still gated on the magic-link inbox wiring per AUDIT
row). It DOES ship:

- `e2e/api-sessions.spec.ts`: hits `/api/sessions` anonymously,
  asserts 401. Asserts the route does not 404 (the route
  exists).

## Verify gate

```bash
pnpm verify
```

All checks pass before commit. Note: the verify gate runs
`pnpm build` which type-checks the Anthropic SDK import. If
the SDK is missing, install via `pnpm add @anthropic-ai/sdk`
as the first commit of the phase (separate from the feature
commit).

## Commit body template

```
feat: multi-persona conferring loop — phase 7

- POST /api/sessions opens an SSE-streamed Anthropic-backed
  session: clarify → confer → exec-summary checkpoint →
  specialists → artifact rounds, per the pitch-to-spec
  template's phase definitions
- POST /api/sessions/[id]/answer resumes the stream after a
  clarify or exec-summary checkpoint
- Supabase schema: sessions / turns / artifacts tables with
  RLS limiting visibility to the session owner
- @anthropic-ai/sdk installed; lib/anthropic/{client,conferring}
  + lib/sessions/{repo,events,budget} compose the orchestrator
- /app right-column flow extends: LiveTranscript replaces the
  phase-5 transcript placeholder; ClarifyPrompt + ExecSummaryCard
  surface the single user-facing checkpoint inside the loop;
  ArtifactPreviewGrid renders ArtifactTile previews
  (downloadable=true; download UI lands in phase 10)
- Token budget enforced in lib/sessions/budget.ts against
  MAX_SESSION_TOKENS=60_000; wrap-to-artifact path tested
- Anonymous /try is unchanged; the demo stays canned

Decisions:
- @anthropic-ai/sdk over Vercel AI SDK (bespoke SSE; we own
  the wire)
- Node runtime for both routes
- Same env-pinned model for every persona in v1 (no
  per-persona overrides yet)
- Re-entrance aborts the in-flight session; phase 11 surfaces
  aborted rows
- Moderation is intentionally NOT in this phase; phase 8
  inserts pre/post-filters at the orchestrator boundaries
- Per-account quota + per-IP throttle + graceful-wrap UX are
  phase 9; phase 7 ships the hard cap only

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 7's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash, add to "Phase log". Also: file an
`[operator]` row in `plan/AUDIT.md` if the runtime check
finds `ANTHROPIC_API_KEY` unset against the deployed env —
phase 7's UI handles the missing-key path gracefully but the
user needs to actually populate the key before real sessions
run. (Skip the AUDIT row if the key is already populated and
a smoke session ran end-to-end as part of the shipping
verification.)

## Follow-ups (out of scope this phase)

- Moderation gates (phase 8).
- Anti-abuse limits + graceful-wrap UX (phase 9).
- Artifact download UI (phase 10).
- Past-session list + permalink (phase 11).
- Per-persona model overrides (post-v1).
- Vercel AI SDK adoption assessment (post-v1).
- Retry-with-backoff on Anthropic 5xx (phase 17 polish).
- Multi-instance session state (Redis or KV) — single-instance
  in v1 is fine.
- A11y verification of the streaming caret + thinking dots
  with assistive tech (phase 14).
