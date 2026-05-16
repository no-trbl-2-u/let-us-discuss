# Phase 7a — Sessions API scaffold + DB schema (no LLM yet)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.
>
> Split from the original phase 7 via `/oversight` on
> 2026-05-16. The original brief
> (`phase_7_conferring.md`, commit 4bd7ed9) was thorough but
> too large for one ship tick — `/oversight` round 4 split it
> in two:
>
> - **7a (this brief):** scaffold the API + DB + shared
>   helpers + wire the boardroom Start button to call the
>   route. The route returns a single `session.error code=not-implemented`
>   event end-to-end. No Anthropic calls.
> - **7b (next brief):** light up the Anthropic orchestrator,
>   the live transcript, the clarify + exec-summary
>   checkpoints, the artifact previews. See
>   `phase_7b_conferring.md`.

## Outcome

Authed `/app` Start button POSTs to a real `/api/sessions`
route that:
1. Validates the request body (Zod) and `requireUser()`s.
2. Creates a row in `public.sessions` (status =
   `'aborted'` since 7a doesn't actually run the loop).
3. Returns a one-shot `text/event-stream` with two events:
   `session.started` (carrying the new session id), then
   `session.error code=not-implemented message="phase 7b lights
   this up"`.
4. The boardroom right-column flow shows an inline "Coming
   in phase 7b" honesty card next to the transcript area;
   the user can press a new "Reset" affordance to return the
   board reducer to `empty` without a page reload.

This phase lands everything that doesn't depend on the
Anthropic API:
- The DB schema (sessions / turns / artifacts with RLS).
- The shared SSE event-type union (`lib/sessions/events.ts`).
- The DB-write helper module (`lib/sessions/repo.ts`).
- The token-budget tracker (`lib/sessions/budget.ts`) — pure
  TS, no I/O, fully tested.
- The Anthropic config-error type
  (`lib/anthropic/client.ts`) — exposed but the factory
  itself is a no-op stub in 7a; 7b implements it.
- The session-side reducer + hook
  (`components/boardroom/use-session-state.ts` +
  `session-stream.ts`) — same event surface 7b uses,
  exercised in 7a against the `not-implemented` path.
- Tests for everything above.

What 7a does **NOT** ship: `LiveTranscript`, `ClarifyPrompt`,
`ExecSummaryCard`, `ArtifactPreviewGrid`, any Anthropic call,
turn writes, artifact writes, budget enforcement in the route.
All those land in 7b.

## Dependencies (operator action expected)

- **Run the migration** (`db/migrations/20260516_phase_7_sessions.sql`)
  against the Supabase project. `setup/03_supabase.md` Section D
  is amended in this phase with a "psql against the project DB"
  step.
- **Regenerate types** with `pnpm db:types` once the migration
  is applied. The shipped `lib/supabase/database.types.ts` may
  still be the v1 placeholder when the brief lands — that's OK;
  7a's tests mock the Supabase client and don't read the
  generated types directly.
- **`ANTHROPIC_API_KEY` is NOT required for 7a.** The phase
  ships against the "not-implemented" path; phase 7b adds the
  real dependency.

## Routes / endpoints (locked in `bearings.md`)

- `POST /api/sessions` — auth gate + body validation +
  `sessions` row insert + SSE response with two events
  (`session.started`, `session.error code=not-implemented`).
- `POST /api/sessions/[id]/answer` — route exists, validates
  the body, returns 501 with a JSON body
  `{ code: 'not-implemented', message: '...' }`. 7b replaces
  the body validation with the resume contract.

Both routes run on the **Node.js runtime** (matching 7b's
need for the Anthropic SDK).

## Database schema (the migration this phase ships)

`db/migrations/20260516_phase_7_sessions.sql` — text taken
verbatim from the original phase 7 brief, reproduced here for
locality:

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
  ip_hash text,
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
  persona_slug text,
  author text not null check (author in ('persona','user','moderator')),
  body text not null,
  replying_to text,
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

## Library / helpers (new code — most of the orchestrator's
shape lands here even though it's only partially wired in
7a)

- `lib/sessions/events.ts` — the SSE event-type
  discriminated union. **Final shape; 7b extends nothing
  here.** Reproduced from the original phase 7 brief:
  `session.started`, `phase.entered`, `turn.begin`,
  `turn.delta`, `turn.end`, `checkpoint.clarify`,
  `checkpoint.exec-summary`, `budget.warn`, `budget.wrap`,
  `artifact.ready`, `session.done`, `session.error`.
- `lib/sessions/repo.ts` — DB helpers: `createSession`,
  `appendTurn`, `finalizeArtifact`, `markStatus`. 7a uses
  only `createSession` + `markStatus('aborted')`; 7b uses
  the rest. All four ship + tested against a mocked
  Supabase client.
- `lib/sessions/budget.ts` — pure token-tracker:
  `BudgetTracker.create(cap)`, `tracker.add(used)`,
  `tracker.willOverflow(estimated)`. Tests cover the wrap
  trigger. 7b consumes this from the orchestrator.
- `lib/anthropic/client.ts` — exports `AnthropicConfigError`
  + a typed factory `getAnthropicClient()` that **throws
  AnthropicConfigError if `ANTHROPIC_API_KEY` is unset**.
  In 7a the factory is the canonical detection; the route
  doesn't actually need to call it (the 7a route always
  returns `not-implemented`), but the factory + tests ship
  so 7b's `import` works.
- `lib/sessions/sse.ts` — small SSE-encoding helper:
  `encodeSseEvent(name, payload)` → `data: {...}\n\n`.
  Tested. 7b reuses it; 7a uses it in the route to emit the
  two events.

## API handlers (in `app/api/sessions/`)

- `app/api/sessions/route.ts` (`POST`):
  1. Body Zod schema:
     `{ pitch: string ≥ 1 word ≤ MAX_PITCH_WORDS, personaSlugs: string[]
     min(MIN_PERSONAS_SEATED).max(MAX_PERSONAS_SEATED), templateSlug:
     string }`. 400 on parse failure.
  2. `requireUser()` (route handler version — see
     `lib/supabase/auth.ts` for the existing helper). 401 on
     anon.
  3. `createSession(...)` with `status='aborted'`,
     `model=process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-7'`.
  4. Return a `Response` whose body is a `ReadableStream`
     emitting two SSE events
     (`session.started{ sessionId }`,
     `session.error{ code: 'not-implemented' }`) and then
     closing. `Content-Type: text/event-stream`,
     `Cache-Control: no-store`.
- `app/api/sessions/[id]/answer/route.ts` (`POST`):
  - 401 on anon. Validates `sessionId` UUID + `body: string`.
  - Returns `501 { code: 'not-implemented' }`. 7b lights up
    the resume contract.

## Components / handlers (in `components/boardroom/`)

- `use-session-state.ts` — session-side reducer. State
  shape per the original phase 7 brief. Handles all events
  including `session.error`; 7a only exercises the
  `not-implemented` path but the reducer is final-shape so
  7b plugs in without changes.
- `session-stream.ts` — `'use client'` hook that opens the
  POST against `/api/sessions`, parses SSE events from the
  response body (fetch + `ReadableStream` → `TextDecoder`;
  do NOT use `EventSource` — it can't POST), dispatches
  events into the session reducer.
- `not-implemented-card.tsx` — small `Card` shown in the
  right-column flow when `session.error.code === 'not-implemented'`:
  *"Real sessions ship in phase 7b. Until then this button
  walks the wire end-to-end against the new /api/sessions
  route."* Plus a "Reset" button that returns the board
  reducer to `empty`.
- `transcript-placeholder.tsx` (phase 5) is **superseded**
  by the empty session-flow render. Delete it in this phase
  and update `board-client.tsx`'s import.

Tests:
- `components/boardroom/__tests__/use-session-state.test.ts`
- `components/boardroom/__tests__/session-stream.test.ts` —
  mock `fetch` returning an SSE-shaped stream; assert that
  the reducer receives the events in order.
- `components/boardroom/__tests__/not-implemented-card.test.tsx`

## Wiring (in `components/boardroom/board-client.tsx`)

Replace the existing `onStart={() => dispatch({ type: 'START'
})}` handler with a function that:

1. Dispatches `{ type: 'START' }` to the **board reducer**
   (visual transition: `ready → running`).
2. Calls the new `startSession({ pitch, personaSlugs,
   templateSlug: 'pitch-to-spec' })` from
   `session-stream.ts`. The stream's events drive the
   session reducer.

Render the session-side state below the board reducer's
existing `TranscriptPlaceholder` slot:

```tsx
{state.tag === 'running' && session.error?.code === 'not-implemented' && (
  <NotImplementedCard onReset={() => dispatch({ type: 'RESET' })} />
)}
```

`TranscriptPlaceholder` is removed; the `NotImplementedCard`
takes its place. Phase 7b replaces NotImplementedCard with
the live transcript family.

## Cross-links

**In** (already shipped — verify still wired):
- Phase 3 auth + middleware.
- Phase 4 `loadTemplate('pitch-to-spec')` is read here only
  to confirm the template exists (validation pass at route
  build); the orchestrator that consumes phase definitions
  lands in 7b.
- Phase 5 board reducer + Start button.

**Out** (this phase ships these):
- `lib/sessions/*` modules — 7b imports them.
- `use-session-state.ts` — 7b extends the events it handles
  (it already handles all 7b events; 7b just produces them).

**Retro-fit**: none in this phase.

## SEO / metadata

No new public routes. `/api/sessions` carries no metadata.

## Empty / loading / error states

- **Pre-session:** unchanged from phase 5.
- **`session.error code=not-implemented`:** the
  `NotImplementedCard` renders. The user can press Reset to
  return to pre-session.
- **`session.error code=auth`:** redirect to
  `/signin?next=/app`.
- **`session.error code=config`:** unused in 7a (no
  Anthropic call); 7b owns this.
- **`session.error code=internal`:** generic "Something
  broke — refresh to try again." copy. Surfaces if the DB
  insert fails or the stream throws.

## Decisions made upfront — DO NOT ASK

- **Status enum:** the migration uses the full v1 enum
  (`clarify | confer | exec-summary | specialists | artifact
  | done | aborted`) even though 7a only uses `aborted`. 7b
  adopts the rest without a schema change.
- **`createSession` writes `status='aborted'` in 7a.** A
  session that never ran the orchestrator is by definition
  aborted. 7b changes the route to insert `status='clarify'`
  before the orchestrator starts.
- **Route is Node.js runtime now.** No edge attempt; 7b
  needs Node anyway and we don't want to flip-flop.
- **Body validation in the route handler, not middleware.**
  Per Next.js app-router idiom + keeps the route's contract
  visible.
- **Migration is operator-run.** `setup/03_supabase.md`
  Section D is updated in this phase with a "psql against
  the project DB" step.
- **Tests mock Supabase.** No db-against-real-Supabase
  integration tests in this phase — that infra arrives in
  phase 13 (smoke-walker integration).
- **`session-stream.ts` uses `fetch` + `ReadableStream`,
  not `EventSource`.** `EventSource` cannot POST; we need
  POST for the body. The cost is hand-rolled SSE parsing —
  tested.
- **No retry on stream open failure in 7a.** Phase 17
  polish may add it; 7b doesn't add it either (matches the
  original phase 7 brief's decision).
- **No `pnpm db:types` regeneration shipped in 7a.** The
  generated types file is operator-regenerated after the
  migration runs. 7a's tests don't depend on the regenerated
  types. (The file is added in 7b's commit body checklist if
  it changes — see phase_7b_conferring.md.)
- **Reset is exposed in 7a.** Once 7b lights up the live
  flow, Reset stays but its semantics get tighter (still
  client-side reducer reset — server session is `aborted`
  regardless).

A brief that leaves Open Qs is a brief that fails its job.

## Mobile reflow / responsive

- The `NotImplementedCard` is a single full-width card on
  mobile. No new mobile-specific layout in this phase.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/sessions/events.ts` | (type-only; covered by `sse.ts` + reducer tests) | — |
| `lib/sessions/sse.ts` | encodes name + payload; multiline-safe; trailing `\n\n` | — |
| `lib/sessions/budget.ts` | start, add accumulates, willOverflow returns expected boolean at threshold, no negative remaining | — |
| `lib/sessions/repo.ts` | createSession returns id; markStatus accepts enum values + rejects others; appendTurn writes one row; finalizeArtifact writes one row | — |
| `lib/anthropic/client.ts` | throws AnthropicConfigError when ANTHROPIC_API_KEY missing; returns a typed client object otherwise (don't actually call the SDK in 7a — just smoke the env-read path) | — |
| `app/api/sessions/route.ts` | 400 on bad body; 401 on anon; happy path emits exactly two events (session.started, session.error not-implemented); content-type is text/event-stream | — |
| `app/api/sessions/[id]/answer/route.ts` | 401 on anon; 501 on authed with not-implemented body | — |
| `components/boardroom/use-session-state.ts` | initial state; HYDRATE; session.error → error state; session.started → sets sessionId; turn.begin/delta/end sequence updates turns array; checkpoint.clarify + exec-summary set currentCheckpoint | — |
| `components/boardroom/session-stream.ts` | mocked fetch returns the two-event stream; reducer ends with `session.error code=not-implemented` | — |
| `components/boardroom/not-implemented-card.tsx` | renders the copy; Reset button calls onReset | — |
| `/app` running (anon → /api/sessions 401) | — | hits `/api/sessions` unauthenticated → 401 |

## Hermetic e2e registration

`e2e/api-sessions.spec.ts` (new):

- `POST /api/sessions` unauthenticated → 401.
- The route does not 404 (the file exists in the build).
- The response has `Content-Type` carrying `text/event-stream`
  only when the request is authed; 7a's anonymous test does
  not need to check that.

No new authed e2e (gated on magic-link e2e wiring per AUDIT).

## Verify gate

```bash
pnpm verify
```

All checks pass before commit.

## Commit body template

```
feat: sessions API scaffold + DB schema — phase 7a

- POST /api/sessions: auth gate, Zod body validation, writes
  one sessions row (status=aborted), returns SSE stream with
  session.started + session.error code=not-implemented
- POST /api/sessions/[id]/answer: 401 on anon, 501 on
  authed with not-implemented body
- Supabase migration: sessions / turns / artifacts tables
  with RLS limiting visibility to the session owner. Operator
  runs the SQL against the project; setup/03_supabase.md
  Section D updated with the step
- lib/sessions/{events,sse,repo,budget} land final-shape;
  7b consumes without changes
- lib/anthropic/client.ts exports AnthropicConfigError +
  getAnthropicClient (factory; throws on missing
  ANTHROPIC_API_KEY). No actual SDK calls in 7a
- components/boardroom: use-session-state reducer +
  session-stream hook + NotImplementedCard light up. Start
  button POSTs to /api/sessions; the not-implemented event
  renders the honesty card; Reset returns the board reducer
  to empty
- transcript-placeholder.tsx (phase 5) deleted; superseded

Decisions:
- session-stream uses fetch + ReadableStream (not
  EventSource — EventSource cannot POST and we need the body)
- All four lib/sessions/repo helpers ship + tested; 7a
  only exercises createSession + markStatus('aborted')
- Migration is operator-run; pnpm db:types regen is
  operator-followed-up after the migration lands
- Status enum carries every v1 phase value even though
  only 'aborted' is used in 7a — 7b adopts without a schema
  change
- AnthropicConfigError ships in 7a so 7b's import chain
  works on day-one of 7b development

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 7a's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash, add to
"Phase log".

## Follow-ups (out of scope this phase)

- Phase 7b: Anthropic orchestrator + live conferring flow.
- Phase 8: moderation gates.
- Phase 9: anti-abuse + graceful-wrap UX.
- Phase 10: artifact download UI.
- Phase 11: past-session surface.
- `pnpm db:types` regen — operator follows up after running
  the migration; if the regenerated file differs materially
  from the placeholder, 7b's commit body lists it as a
  generated artifact.
