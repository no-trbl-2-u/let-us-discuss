# Phase 21 — Secretary persona + Mode 1 (in-session)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

1. **The secretary joins every session.** A new persona file
   ships at `personas/secretary.md` (copied verbatim from
   `src-ai-skills/personas/secretary.md`). Server-side, every
   session's cast is auto-augmented with the secretary if the
   client didn't include it — the user never has to pick the
   secretary; the framework enforces "exactly one secretary
   per session" as a cast invariant.
2. **The orchestrator yields the floor to the secretary at
   every phase boundary** (after clarify, after confer, after
   the exec-summary checkpoint resolves, after specialists).
   The secretary emits a structured four-taxonomy log entry
   per the prompt in its persona file (`Critiques / Audits /
   Out-of-scope / Decisions`). At the artifact phase, the
   secretary runs once more to compile the running log into a
   fourth artifact — `secretary-log.md` — that lands alongside
   `spec.md`, the executive summary, and the call-outs.
3. **The transcript + session pages render secretary turns
   and the new artifact.** Live-transcript distinguishes
   secretary turns with an author label ("Secretary"); the
   artifact-preview grid grows from three tiles to four.

## Prerequisite

Phases 1–18 + 20 shipped. Phase 20 set up the framework
schemas at `src-ai-skills/schemas/`; `PersonaRoleSchema` already
accepts `'secretary'`, `TurnAuthor` already accepts
`'secretary'`. The orchestrator at `lib/anthropic/conferring.ts`
walks the five core phases via `phaseById` — phase 21 adds
the secretary side-channel without changing the phase walk
order. The boardroom `personas/` directory currently mirrors
`src-ai-skills/personas/` minus the secretary; the diff is
literally one file plus an auto-injection helper.

## Dependencies (operator action required for runtime)

- **Apply the new migration** in Supabase (or via `pnpm
  db:migrate`). Widens `turns.author` constraint to allow
  `'secretary'` and adds a `secretary_log text not null
  default ''` column to `public.artifacts`. Additive only;
  existing rows get the empty-string default.
- **No new env vars.** Authed e2e for the secretary walk runs
  only when `MAGIC_LINK_INBOX_PROVIDER` + the matching inbox
  env are populated (existing operator row in
  `plan/AUDIT.md`); spec test-skips otherwise — same contract
  as `e2e/auth-flow.spec.ts`.

## Routes / endpoints (locked from bearings)

**No URL contract changes.** The new artifact renders on the
existing surfaces (`/app/sessions/[id]` artifact grid +
`/app/sessions/[id]/transcript`).

`POST /api/sessions` keeps its existing shape; the cast guard
runs after `loadPersonas()` resolution and **mutates the
seated cast in place** (auto-injects the secretary if absent).
Clients that already include the secretary slug in
`personaSlugs` are accepted unchanged; clients that omit it
have it appended server-side. No 4xx error code is added —
the server fixes the cast silently.

## Library / helpers (new code)

**Created:**

- `personas/secretary.md` — copy of
  `src-ai-skills/personas/secretary.md` (175-line persona
  file with frontmatter `role: secretary, lead: false` and
  the body that defines the four taxonomies, the
  phase-boundary turn shape, and the artifact-phase compile
  instruction). Identical content; the file's purpose is to
  make the deployed boardroom cast a superset of the
  framework reference cast in the way that matters: the
  secretary is now part of the curated library and
  `loadPersonas()` returns it.
- `lib/personas/cast-guard.ts` — `ensureSecretary(seated:
  Persona[], all: Persona[]): Persona[]` returns the seated
  cast unchanged if it already contains exactly one
  secretary; otherwise it appends the secretary from `all`.
  Throws `CastGuardError` with a clear message if `all` has
  zero or more than one secretary (a `personas/` content
  bug, not a runtime cast bug). Pure function; no Supabase
  or fs.
- `lib/personas/__tests__/cast-guard.test.ts` — covers:
  cast already has the secretary → unchanged; cast missing
  the secretary → appended; cast has multiple non-secretaries
  → secretary still appended exactly once; library has zero
  secretaries → throws; library has two secretaries →
  throws.
- `db/migrations/20260519_phase_21_secretary.sql` — two
  changes in one transaction:
  - `alter table public.turns drop constraint turns_author_check`
    then `add constraint turns_author_check check (author in
    ('persona','user','moderator','secretary'))`.
  - `alter table public.artifacts add column secretary_log
    text not null default ''`.
  - Defensive: also widens `turns.phase_check` only if the
    grep shows future phases need it; phase 21's scope keeps
    secretary turns under existing phase tags (the secretary's
    phase value matches the phase whose boundary it logs —
    `'clarify'` for the after-clarify turn, `'confer'` after
    confer, etc.). So `turns.phase` constraint stays as-is.

**Edited:**

- `lib/anthropic/conferring.ts` — the central change. Adds
  a `runSecretaryTurn(phase, runningLog): AsyncGenerator<...,
  RecordedTurn>` helper. Mirrors `runPersonaTurn` but with
  `author: 'secretary'`, a fixed `personaSlug = 'secretary'`,
  and the directive
  `"Phase boundary: <phase>. Emit your structured log
  entry per your persona's Mode 1 instructions. Output ONLY
  the structured block."` Calls go between the existing
  phase blocks: after clarify-user-answer, after confer loop,
  after exec-summary resolves, after specialists. At the
  artifact phase, the secretary runs one more time with the
  directive `"Compile your running log into the final
  secretary-log.md artifact. Output ONLY the compiled
  markdown."` — the orchestrator captures the result, persists
  it via `hooks.persistArtifact({ ..., secretaryLog })`, and
  yields `artifact.ready` with the new `secretaryLog` field.
  The orchestrator maintains the running log as a local
  string accumulator (each per-phase secretary turn body is
  appended to it; the final compile turn receives the running
  log via its messages array).
- `src-ai-skills/schemas/events.ts` — `artifact.ready` event
  payload gains `secretaryLog: string`. Existing consumers
  that don't read the field continue to work (TS structural
  typing); consumers that want the new artifact read it
  explicitly.
- `lib/sessions/repo.ts` — `FinalizeArtifactInput` adds
  `secretaryLog: string`. `finalizeArtifact` inserts the
  value into the new column. `DbTurnAuthor` narrow type
  widens to include `'secretary'` (the cast at the supabase
  insert site no longer rejects it). Phase 20 left the cast
  + the comment pointing here; this phase removes that
  comment.
- `lib/sessions/queries.ts` — `loadSession` selects the new
  `secretary_log` column and returns it as `secretaryLog`.
- `app/api/sessions/route.ts` — after `loadPersonas()` and
  `seatedPersonas` resolution, call `ensureSecretary(seated,
  all)` and pass the augmented array to `runConferring`. The
  zod `personaSlugs` schema's max (`MAX_PERSONAS_SEATED = 6`)
  stays unchanged — the user-facing cap is on the user-picked
  cast, not the runtime cast; the auto-injected secretary
  doesn't count against the limit.
- `components/boardroom/board-client.tsx` — when the
  boardroom shelf renders, also render a small non-draggable
  "secretary tile" beneath the seat strip with the copy
  "Plus the Secretary — logs the conversation." This tells
  the user the secretary is present without exposing the
  drag affordance. Pure presentational change.
- `components/boardroom/types.ts` — extend the seat /
  persona-display types if needed for the new tile (likely
  not; the secretary tile reads its persona directly from
  `loadPersonas()` server-side, not from the user-picked
  state).
- `components/sessions/transcript-view.tsx` — when rendering
  a turn whose `author === 'secretary'`, render the
  "Secretary" author label (mono caps eyebrow, matching
  design tokens) and keep the body in the same monospace
  block the persona uses. No separate side panel for v1 —
  the in-line render keeps the diff small and the reading
  experience honest.
- `components/boardroom/live-transcript.tsx` — same author-
  label treatment for the live secretary turns as they
  stream in.
- `components/boardroom/artifact-preview-grid.tsx` — grows
  from a three-tile grid to a four-tile grid. The fourth
  tile is "Secretary log" with a small monospace preview of
  the compiled secretary-log content. Mobile reflow: four
  tiles stack on 375px (already the case via the existing
  `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-...` shape;
  bump the lg column count from 3 to 4 if it currently sits
  at 3).
- `app/app/sessions/[id]/page.tsx` — render the secretary
  log alongside the existing artifacts (server-rendered
  read from the new column).
- `app/app/sessions/[id]/transcript/page.tsx` — no code
  change required; the transcript view already renders all
  turns and the new author-label handling in
  `transcript-view.tsx` does the work.

**Tests:**

- `lib/anthropic/__tests__/conferring.test.ts` — extend the
  happy-path test to:
  - Script three extra stub replies (one per non-artifact
    phase boundary: post-clarify, post-confer, post-
    specialists) plus one for the artifact-phase compile.
  - Note: the exec-summary phase emits its own moderator
    summary turn already; the secretary runs *after* the
    user accepts, before specialists begin.
  - Assert at least four `turn.begin` events with `author:
    'secretary'`.
  - Assert `artifact.ready` event carries a non-empty
    `secretaryLog` string.
- `lib/sessions/__tests__/repo.test.ts` — extend the
  appendTurn test to cover `author: 'secretary'`; extend
  the finalizeArtifact test to cover the new `secretaryLog`
  field.
- `app/api/sessions/__tests__/route.test.ts` — add a test
  that posts `personaSlugs: ['product-lead', 'growth-voice']`
  (no secretary) and asserts the route still succeeds; the
  injected secretary persona is reflected in the cast that
  `runConferring` receives (mock the orchestrator entry to
  capture the personas array).
- `src-ai-skills/__tests__/orchestrator-stub.test.ts` —
  extend the existing happy-path assertion to verify
  secretary turns emit at each phase boundary against the
  reference cast (which includes the secretary).
- `e2e/secretary-turn.spec.ts` — **new authed e2e.**
  Conditional on `MAGIC_LINK_INBOX_PROVIDER` env (same
  pattern as `auth-flow.spec.ts`). Walks: sign in →
  staff a minimal cast on `/app` → submit pitch → wait for
  `session.done` → open `/app/sessions/[id]` → assert the
  "Secretary log" artifact tile renders non-empty content,
  and the transcript shows at least one turn labeled
  "Secretary." Test-skips with a single-line log when the
  inbox env is unset.

## DB schema

`db/migrations/20260519_phase_21_secretary.sql`:

```sql
begin;

-- Widen turns.author to include 'secretary'. Drops + re-adds
-- the check constraint (Supabase Postgres requires this
-- pattern to amend an inline CHECK).
alter table public.turns drop constraint if exists turns_author_check;
alter table public.turns add constraint turns_author_check
  check (author in ('persona', 'user', 'moderator', 'secretary'));

-- The fourth artifact column. Default empty string so legacy
-- rows (sessions that ran before the secretary shipped)
-- render as "—" via the existing sentinel pattern in the
-- artifact-preview grid.
alter table public.artifacts add column if not exists secretary_log text
  not null default '';

commit;
```

The migration is additive; no data loss; rolls forward via
`pnpm db:migrate`.

## Constants

No new constants. `MAX_PERSONAS_SEATED` (6) and
`MIN_PERSONAS_SEATED` (2) stay as the user-facing seat cap;
the server-injected secretary doesn't count.

## Session events + reducer

`src-ai-skills/schemas/events.ts`:

```ts
| {
    type: 'artifact.ready'
    specMd: string
    execSummary: string
    callouts: string
    secretaryLog: string   // NEW
  }
```

No new event variants — secretary turns ride the existing
`turn.begin` / `turn.delta` / `turn.end` events with
`author: 'secretary'` (the TurnAuthor enum was widened in
phase 20). `phase.entered` doesn't fire for the secretary
side-channel (the secretary runs *between* phases, not as a
phase of its own); the secretary turn's `phase` field
carries the value of the phase whose boundary it's logging
(e.g. `'clarify'` for the after-clarify log, `'confer'` for
the after-confer log).

The reducer in `components/boardroom/use-session-state.ts`
needs no behavioral change — it already routes `turn.*`
events through the same per-author handling. The new author
value lands in `SessionTurn.author` as the widened
`TurnAuthor` (phase 20 work).

## Cross-links

**In** (verify still wired):
- Phase 20's framework tests + the orchestrator-stub spec.
- Phase 7b's full happy-path test (extended here).
- Phase 16's pricing + observability infrastructure
  (secretary turns consume budget like any persona turn;
  the existing `BudgetTracker.add(final.tokens)` call covers
  them).
- Phase 9's per-session token cap (still honored — the
  secretary's turn counts against the cap; if the budget is
  exhausted before the artifact-phase compile, the
  orchestrator should still wrap gracefully via the existing
  `budget.willOverflow(700)` check).

**Out** (ship):
- Phase 22 (Secretary Mode 2 + cross-session retros) —
  consumes the running log produced here as input to the
  retrospective entry.
- `/app/sessions/[id]/transcript` and `/app/sessions/[id]`
  surfaces — render the new artifact + the secretary turns.

**Retro-fit:**
- The boardroom shelf's "seat strip" gets the new "Plus the
  Secretary" copy; consider this an additive UI change, not
  a layout rewrite. The persona-card grid logic stays.

## SEO / metadata

N/A. Authed-only surfaces (noindex).

## Hero / body / sub-section composition

Two new visual elements:

1. **Boardroom shelf — "secretary at the table" tile.** Below
   the user-seated personas, a small monospace eyebrow:
   "Secretary at the table — logs every phase boundary."
   No avatar; no draggable affordance; pure copy. Uses the
   `--accent-2` slate per design's "reserved for <5% of
   surfaces" rule — the secretary is a fixed role and the
   accent treatment marks it as orchestrator-level, not
   user-picked.
2. **Artifact preview grid — fourth tile.** Existing three
   tiles (`spec.md`, exec summary, call-outs) stay in their
   current order; "Secretary log" is the fourth, last in
   reading order. The tile header reads "Secretary log"
   (Plex Sans label), the preview body is the first ~6 lines
   of the compiled log in monospace, and the "Download .md"
   affordance matches the existing pattern.

## Empty / loading / error states

- **Legacy sessions (`secretary_log = ''`):** render the
  artifact tile with the existing `—` sentinel and copy
  "(not tracked for this session)". The secretary persona
  shipped after the session — the empty value is honest.
- **Live transcript while a secretary turn is streaming:**
  show the "Secretary" eyebrow above the bubble, and a
  "Secretary is logging…" affordance (same pattern as
  `<persona> is thinking…` per bearings).
- **Cast guard library bug** (`personas/` has 0 or 2+
  secretaries): `ensureSecretary` throws `CastGuardError`.
  The route catches and returns `500 { code: 'cast-config' }`
  via the existing internal-error path. This shouldn't fire
  in practice (the library ships exactly one secretary).

## Decisions made upfront — DO NOT ASK

- **The secretary is auto-injected, not user-picked.** The
  cast invariant ("exactly one secretary") is framework-
  level, not a UX decision the user makes per session. The
  boardroom UI surfaces a "Plus the Secretary" tile so the
  user *knows* the secretary is present, but it's not
  draggable and not part of the seat picker.
- **Server-side fixes the cast silently on missing
  secretary.** No 4xx error to the client; no client-side
  guard either. The route is authoritative; the client
  sends what it sends; the server augments. This matches
  the route's existing posture toward stale-cached clients
  (filter, don't fail).
- **`personas/secretary.md` is a verbatim copy of
  `src-ai-skills/personas/secretary.md`.** Two canonical
  files, identical content, different roles in the repo:
  the `src-ai-skills` one is the framework reference; the
  `personas/` one is the deployed boardroom cast. Per
  bearings rule 10 ("every persona / template change is a
  PR"), the deployed cast lives in its own directory so
  changes ship via PR. Drift between the two is checked by
  the existing `pnpm data:validate` plus phase 20's
  reference-personas test (which checks src-ai-skills only —
  if boardroom's persona ever diverges in a meaningful way,
  that's a deliberate edit, not silent drift).
- **No new SessionEvent variants.** Secretary turns ride
  the existing `turn.*` envelope; the only schema change is
  the new `secretaryLog` field on `artifact.ready`. Adding
  a new variant would force every consumer (reducer,
  components, tests) to handle it; the additive field is
  cheaper and matches the framework spec
  (`ORCHESTRATOR.md`).
- **Secretary turns persist with `phase = '<the boundary's
  phase name>'`.** E.g. the post-clarify secretary turn has
  `phase = 'clarify'`. The alternative ("phase =
  'secretary'") would require widening the `turns.phase`
  check constraint and inventing a new pseudo-phase; that's
  not what `ORCHESTRATOR.md` describes. The existing
  constraint set already includes `'moderator'` for cross-
  phase tags; secretary uses the actual phase tag.
- **Secretary turn directive is a fixed string in the
  orchestrator, not configurable per phase.** The directive
  ("Phase boundary: <phase>. Emit your structured log entry
  …") is the framework's contract with the persona's prompt
  body. Phase-specific customization (e.g. "the artifact
  phase log compiles the running log") happens via a small
  conditional in `runSecretaryTurn`, not a per-phase config
  in the template.
- **Running log accumulates in memory inside the
  orchestrator, not in the DB between secretary turns.**
  The compiled `secretaryLog` is persisted exactly once at
  the artifact phase via the existing `persistArtifact`
  hook. Per-phase secretary turns ARE persisted as `turns`
  rows (so the transcript renders them); the compile step
  doesn't query them back from the DB — the orchestrator
  holds the accumulator in local state. Cheaper, no race
  conditions between hook-write and orchestrator-read.
- **The migration uses `if not exists` / `if exists`
  guards** so re-applying it on a partially-migrated env
  doesn't fail. Standard pattern in this project's
  migrations.
- **The four-tile artifact grid grows the existing
  responsive grid one column wider.** No bespoke layout
  shift; existing `md:grid-cols-2 lg:grid-cols-3` becomes
  `md:grid-cols-2 lg:grid-cols-4` (or `xl:grid-cols-4` if
  4-wide is too dense at lg). Pick the breakpoint by
  measuring against the deployed grid's actual width in the
  build step; document in the commit body.
- **The boardroom shelf's "Plus the Secretary" tile uses
  copy, not an avatar or persona card.** A persona card
  would imply pick-ability. The tile is a one-line eyebrow
  beneath the seat strip: "Secretary at the table — logs
  every phase boundary."
- **Secretary turns count against the per-session token
  budget (`MAX_SESSION_TOKENS = 60_000`).** No new budget
  carve-out. If the budget is exhausted before the
  artifact-phase compile, the existing wrap logic kicks in
  and `secretaryLog` may be empty or partial — the artifact
  grid renders the `—` sentinel honestly.
- **The authed e2e is conditional on
  `MAGIC_LINK_INBOX_PROVIDER`**, mirroring the existing
  `e2e/auth-flow.spec.ts` pattern. Until an operator wires
  Mailosaur (or alternative), the spec test-skips with a
  single-line log. This is the same `[operator]` blocker
  recorded in `plan/AUDIT.md`; phase 21 doesn't resolve
  it, but doesn't introduce new operator burden either.
- **Transcript renders secretary turns inline, not in a
  side panel.** A side panel is the eventual right answer
  (ORCHESTRATOR.md hints at it: "filter on `author ===
  'secretary'` and route those to a side panel"), but the
  cleanest v1 is inline with an author label. Side-panel
  treatment is filed as a follow-up.
- **No "skip secretary turns" client toggle.** The reading
  experience includes them. If user research surfaces a
  need to hide them, that's a follow-up.
- **`runSecretaryTurn` does NOT call `moderateOutput`.**
  The secretary's job is to transcribe what already
  happened — it can't produce content the moderation gate
  would catch that wasn't already caught upstream. Skipping
  the moderation call shaves one OpenAI call per phase
  boundary (×4 phases = 4 calls saved per session) without
  weakening the safety posture.
- **The orchestrator skips secretary turns entirely if the
  cast doesn't include a secretary.** The cast guard at the
  route makes this unreachable in production, but the
  guard is defensive: `const secretary = personas.find(p =>
  p.role === 'secretary')`; if absent, the orchestrator
  proceeds without secretary turns and emits an empty
  `secretaryLog`. This keeps the orchestrator runnable from
  the framework test harness (which can choose to omit the
  secretary for narrow tests) without throwing.

## Mobile reflow / responsive

- **Boardroom shelf:** the new "Secretary at the table"
  eyebrow sits below the seat strip; on 375px it occupies
  one line of plain text. No layout pressure.
- **Artifact grid:** four tiles stack vertically on 375px
  (single column at the existing sm breakpoint); on md two-
  per-row; on lg/xl four-per-row. The existing tile width
  inside each cell already handles the smaller share.
- **Transcript:** secretary turn bubbles share the same
  width constraints as persona bubbles. The "Secretary"
  eyebrow is shorter than the longest persona name so no
  reflow risk.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `personas/secretary.md` | `pnpm data:validate` parses the file | — |
| `lib/personas/cast-guard.ts` | append on missing; idempotent on present; throw on 0 or 2+ in library | — |
| `lib/anthropic/conferring.ts` (extended) | ≥4 secretary turn.begin events per happy-path run; artifact.ready carries non-empty secretaryLog | — |
| `lib/sessions/repo.ts` (extended) | appendTurn accepts author='secretary'; finalizeArtifact writes secretary_log | — |
| `app/api/sessions/route.ts` (extended) | secretary auto-injected when omitted from personaSlugs | — |
| `components/sessions/transcript-view.tsx` (extended) | secretary turns render with "Secretary" eyebrow | — |
| `components/boardroom/artifact-preview-grid.tsx` (extended) | four tiles render; legacy empty secretary_log renders the `—` sentinel | — |
| `components/boardroom/board-client.tsx` (extended) | "Plus the Secretary" tile renders below the seat strip | — |
| `src-ai-skills/__tests__/orchestrator-stub.test.ts` (extended) | secretary turns emit at each phase boundary against the reference cast | — |
| `e2e/secretary-turn.spec.ts` (new, conditional) | full authed walk: secretary log artifact renders + transcript shows ≥1 Secretary-labeled turn; test-skips when inbox env unset | conditional |

## Hermetic e2e registration

`e2e/secretary-turn.spec.ts` is authed-only. The hermetic e2e
harness uses placeholder Supabase env, so it can't exercise
this spec; the spec self-skips per the existing
`MAGIC_LINK_INBOX_PROVIDER` contract. No new hermetic e2e
file lands.

## Verify gate

```bash
pnpm verify
```

Runs the full sequence:
- `pnpm typecheck` — catches the SessionEvent payload widening
  + AppendTurnInput / FinalizeArtifactInput type updates.
- `pnpm test:run` — runs ~16 phase-20 tests + the new
  cast-guard + orchestrator secretary tests + the framework
  stub extension.
- `pnpm data:validate` — validates the new `personas/
  secretary.md`.
- `pnpm build` — Next.js build catches any consumer missed
  by typecheck.
- `pnpm e2e` — Playwright against the built app on the alt
  port. The new authed spec test-skips silently in CI until
  the inbox env is wired.

**Each leg is a hard gate.**

## Commit body template

```
feat: secretary persona + Mode 1 (in-session) — phase 21

- personas/secretary.md: deployed cast adds the secretary
  (verbatim copy of src-ai-skills/personas/secretary.md;
  role: secretary, lead: false).
- lib/personas/cast-guard.ts: ensureSecretary helper +
  CastGuardError. Idempotent.
- db/migrations/20260519_phase_21_secretary.sql: widens
  turns.author check to include 'secretary'; adds
  artifacts.secretary_log text default ''.
- lib/anthropic/conferring.ts: runSecretaryTurn helper +
  side-channel invocations at every phase boundary; running-
  log accumulator; artifact-phase compile turn; artifact.ready
  now yields secretaryLog.
- src-ai-skills/schemas/events.ts: artifact.ready payload
  gains secretaryLog: string.
- lib/sessions/repo.ts: FinalizeArtifactInput + finalizeArtifact
  thread the new column; DbTurnAuthor narrow type widens to
  include 'secretary' (the phase-20 comment that pointed
  here is removed).
- lib/sessions/queries.ts: loadSession returns secretaryLog.
- app/api/sessions/route.ts: ensureSecretary(seated, all)
  runs after persona resolution; cast is augmented silently.
- components/boardroom/board-client.tsx: "Plus the Secretary"
  eyebrow below the seat strip.
- components/sessions/transcript-view.tsx +
  components/boardroom/live-transcript.tsx: render the
  "Secretary" eyebrow for author='secretary' turns.
- components/boardroom/artifact-preview-grid.tsx: four-tile
  grid; "Secretary log" tile with monospace preview +
  download.
- app/app/sessions/[id]/page.tsx: render the new artifact.
- e2e/secretary-turn.spec.ts: new authed walk; conditional
  on MAGIC_LINK_INBOX_PROVIDER per the existing operator
  contract.
- Tests:
  - lib/personas/__tests__/cast-guard.test.ts
  - lib/anthropic/__tests__/conferring.test.ts (extended)
  - lib/sessions/__tests__/repo.test.ts (extended)
  - app/api/sessions/__tests__/route.test.ts (extended)
  - src-ai-skills/__tests__/orchestrator-stub.test.ts (extended)

Decisions:
- Secretary auto-injected server-side; not user-picked.
- No new SessionEvent variants; secretary turns ride
  turn.* with author='secretary'; only artifact.ready
  payload widens.
- Secretary turns persist with phase = boundary's phase
  name; no new phase constraint value.
- Secretary skipped by moderateOutput (transcription-only;
  no novel content).
- Two canonical persona files (src-ai-skills/personas/
  secretary.md, personas/secretary.md) — identical content;
  the framework reference cast and the deployed boardroom
  cast each own their copy per bearings rule 10.
- Running log accumulator is local to runConferring; the
  per-phase secretary turns persist individually; the
  compiled secretary_log persists once at the artifact phase.
- Transcript renders secretary turns inline (no side panel
  in v1).
- Cast guard is defensive in the orchestrator (skip
  secretary turns if cast lacks a secretary) so the
  framework test harness can exercise the engine without
  the secretary.

Operator action: `pnpm db:migrate` (or apply the SQL file
in Supabase) to widen turns.author and add
artifacts.secretary_log. Until applied, the orchestrator's
appendTurn for author='secretary' will fail at the DB
boundary; the migration is required before this phase's
deploy is functional.

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 21's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

Filed in `plan/AUDIT.md` as `[operator]` row: "Apply phase 21
migration in Supabase." Auto-tagged so /iterate skips per
its own contract.

## Follow-ups (out of scope this phase)

- **Side-panel secretary turn rendering.** Inline is the
  v1; a dedicated side panel (with the four taxonomies
  surfaced as distinct sections in real-time) is the
  eventual right answer. File post-22 if user research asks.
- **"Hide secretary turns" client toggle.** Only worth
  building if a reader explicitly asks.
- **Per-persona model picker integration** (phase 24
  follow-on) — the secretary could use a cheaper model than
  the leads; needs the model picker to land first.
- **Cast-guard exposure on `/about/personas`** — currently
  the page lists all four user-pickable personas; secretary
  rendering on that page is a small follow-up so the public
  library is honest about the full cast. Out of phase 21's
  scope; file as a /iterate finding after this ships.
- **Secretary log validation** — the persona's four-taxonomy
  format is enforced by the prompt, not by parsing. A
  parser that verifies the compiled artifact matches the
  shape is worth building if users push back on log
  quality.
- **Phase 22 work** (Mode 2 + cross-session retros).
