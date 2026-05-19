# Phase 20 — Framework engine refactor + standalone test harness

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

1. **Schemas have one home.** `lib/schemas/persona.ts`,
   `lib/schemas/template.ts`, and `lib/sessions/events.ts` move
   to `src-ai-skills/schemas/{persona,template,events}.ts` as
   the single source of truth. The boardroom app (`lib/`,
   `app/`, `components/`) imports those schemas from
   `src-ai-skills`, not the other way around — `src-ai-skills`
   becomes the portable, dependency-free framework directory
   the README already claims it is.
2. **Standalone test harness.** A new vitest suite at
   `src-ai-skills/__tests__/` validates the framework against
   its own reference cast + template + orchestrator behavior
   using a stub LLM client. The harness runs without the
   Anthropic SDK, without Supabase, without the network — it's
   the contract test that catches drift between
   `ORCHESTRATOR.md` (spec) and `lib/anthropic/conferring.ts`
   (reference impl) before phases 21–22 ship secretary work
   that extends both.
3. **Secretary preflight.** `PersonaRoleSchema` extends from
   `z.enum(['lead', 'specialist'])` to `z.enum(['lead',
   'specialist', 'secretary'])`. `TurnAuthor` extends to
   include `'secretary'`. `SessionPhase` extends to include
   `'retro-review'` and `'retrospective'`. These are
   **schema-only** additions — no orchestrator logic changes
   in this phase. Phase 21 wires the secretary persona into
   the boardroom cast + cast guard ("exactly one secretary");
   phase 22 wires the wrapper phases. Pre-landing the enum
   values now means phase 21 has no schema churn to manage.

## Prerequisite

Phases 1–18 shipped. The orchestrator
(`lib/anthropic/conferring.ts`, 612 lines) is the canonical
boardroom impl. `src-ai-skills/` already exists as a portable
directory with `personas/`, `templates/`, `ORCHESTRATOR.md`,
`PERSONA-FORMAT.md`, `TEMPLATE-FORMAT.md`. The directory has
**no** `schemas/` subdir yet and **no** `__tests__/` subdir
yet — both land in this phase.

## Dependencies (operator action required for runtime)

**None.** This is a refactor + test harness phase. No new
env vars, no new external services, no migrations.

## Routes / endpoints (locked from bearings)

**No URL contract changes.** Refactor only.

## Library / helpers (new code)

**Created:**

- `src-ai-skills/schemas/persona.ts` — verbatim move of
  `lib/schemas/persona.ts` with `PersonaRoleSchema` extended
  to include `'secretary'`. Exports `PersonaRoleSchema`,
  `PersonaFrontmatterSchema`, `PersonaSchema`, and the
  inferred types `PersonaRole`, `PersonaFrontmatter`,
  `Persona`.
- `src-ai-skills/schemas/template.ts` — verbatim move of
  `lib/schemas/template.ts`. Exports `TemplatePhaseSchema`,
  `TemplateEscalationSchema`, `TemplateSchema`, and types
  `TemplatePhase`, `TemplateEscalation`, `Template`.
- `src-ai-skills/schemas/events.ts` — verbatim move of
  `lib/sessions/events.ts` with three additions:
  `SessionPhase` includes `'retro-review' | 'retrospective'`;
  `TurnAuthor` includes `'secretary'`; the existing
  `SessionEvent` union stays unchanged (no new event variants
  yet — phase 21 adds them).
- `src-ai-skills/schemas/index.ts` — barrel re-export of
  `./persona`, `./template`, `./events`. Single entry point
  for consumers that want to grab everything.
- `src-ai-skills/schemas/__tests__/persona.test.ts` — moved
  from `lib/schemas/__tests__/persona.test.ts` with the
  added test case "secretary role parses as valid."
- `src-ai-skills/schemas/__tests__/template.test.ts` — moved
  from `lib/schemas/__tests__/template.test.ts` verbatim.
- `src-ai-skills/__tests__/stub-llm-client.ts` — extracted
  and generalized from the existing pattern in
  `lib/anthropic/__tests__/conferring.test.ts:12-34`. Exports
  `makeStubClient(replies: string[]): AnthropicStreamClient`
  with deterministic token accounting. **Not a test file**
  (no `.test.ts` suffix) so vitest doesn't try to run it.
- `src-ai-skills/__tests__/reference-personas.test.ts` —
  reads every `*.md` under `src-ai-skills/personas/`,
  splits frontmatter from body, validates against
  `PersonaSchema`. Asserts:
  - All 5 reference personas parse cleanly.
  - Exactly one persona has `role: 'secretary'`
    (preflight for phase 21's cast guard).
  - Every persona has a `systemPrompt` of ≥40 chars (per
    schema minimum).
  - Slugs are unique.
- `src-ai-skills/__tests__/reference-template.test.ts` —
  reads `src-ai-skills/templates/pitch-to-spec.json`,
  validates against `TemplateSchema`. Asserts the five core
  phases are present in order (`clarify`, `confer`,
  `exec-summary`, `specialists`, `artifact`); asserts at
  least one phase has `exec_summary_checkpoint: true`.
- `src-ai-skills/__tests__/orchestrator-stub.test.ts` —
  runs `runConferring` against the stub client with the
  reference personas + reference template + a deterministic
  `awaitAnswer` that returns canned clarify/exec-summary
  responses. Imports `runConferring` from
  `@/lib/anthropic/conferring`. Asserts:
  - `session.started` fires first.
  - The five core phases emit in order via
    `phase.entered` events.
  - At least one `turn.begin` / `turn.delta` / `turn.end`
    triple fires per phase.
  - `checkpoint.clarify` and `checkpoint.exec-summary`
    fire and the awaitAnswer resolves them.
  - `artifact.ready` fires before `session.done`.
  - No `session.error` is emitted on the happy path.

**Deleted:**

- `lib/schemas/persona.ts` → moved to
  `src-ai-skills/schemas/persona.ts`.
- `lib/schemas/template.ts` → moved to
  `src-ai-skills/schemas/template.ts`.
- `lib/schemas/__tests__/persona.test.ts` → moved.
- `lib/schemas/__tests__/template.test.ts` → moved.
- `lib/sessions/events.ts` → moved to
  `src-ai-skills/schemas/events.ts`.

**The `lib/schemas/` directory is removed entirely** after
the moves complete. `lib/sessions/events.ts` is removed; the
`lib/sessions/` directory keeps its other files (`budget.ts`,
`queries.ts`, `repo.ts`, etc.) — only `events.ts` moves.

**Edited (import re-points):**

The full set of files importing from the moved schemas (~30
files based on the codebase audit). Each gets its import path
swapped from the old location to the new one. The mechanical
re-write is:

```
'@/lib/schemas/persona'        → '@framework/schemas/persona'
'@/lib/schemas/template'       → '@framework/schemas/template'
'@/lib/sessions/events'        → '@framework/schemas/events'
```

Where the new `@framework/*` path alias is added to
`tsconfig.json` in the same phase (see Decisions below).

Known consumer files (from `grep -l` audit; verify in build
step):

- `lib/anthropic/conferring.ts`
- `lib/anthropic/__tests__/conferring.test.ts`
- `lib/personas/load.ts`
- `lib/templates/load.ts`
- `lib/sessions/repo.ts`
- `lib/sessions/budget.ts`
- `lib/sessions/queries.ts`
- `app/app/__tests__/page.test.tsx`
- `app/about/personas/__tests__/page.test.tsx`
- `components/demo/{demo-transcript,try-client,demo-surface}.tsx`
- `components/demo/__tests__/demo-components.test.tsx`
- `components/personas/persona-card.tsx`
- `components/sessions/transcript-view.tsx`
- `components/boardroom/{board-client,boardroom-surface,draggable-persona-card,live-transcript,persona-shelf,types,use-board-persistence,use-session-state}.tsx`
- `components/boardroom/__tests__/*.tsx` (multiple)
- Any further consumers surfaced by the build step's
  type-check pass.

If the build step surfaces a consumer not listed here, fix
it in the same commit; document the new entry in the commit
body so the next phase has the corrected map.

## DB schema

**No changes.** This phase touches no SQL.

## Cross-links

**In** (verify):
- Every existing schema-consumer test (~16 tests across
  `__tests__/` directories) still passes after the import
  re-point.
- `pnpm data:validate` (the zod validation script that reads
  `personas/` and `templates/`) still passes — it must now
  import schemas from the new location.

**Out** (ship):
- Phase 21 (Secretary persona + Mode 1) — consumes the
  extended `PersonaRoleSchema` directly; no schema churn at
  phase 21 boundary.
- Phase 22 (Secretary Mode 2 + cross-session retros) —
  consumes the `'retro-review' | 'retrospective'`
  `SessionPhase` values landed here.

**Retro-fit:**
- The `data:validate` script (`scripts/data-validate.mjs` or
  equivalent — confirm path during build) imports the schemas
  to validate the personas/ + templates/ directories. Its
  import paths must update in the same commit.

## SEO / metadata

**N/A.** Refactor; no surface changes.

## Hero / body / sub-section composition

**N/A.** No visual changes.

## Empty / loading / error states

**N/A.** No UI in this phase.

## Decisions made upfront — DO NOT ASK

- **Path alias is `@framework/*`, not `@src-ai-skills/*`.**
  Reason: the `src-ai-skills/` directory name is historical
  (sibling to `src-skills/` for the dev-side workflow). The
  alias names what it *means*: the runtime framework that
  drives boardroom-style conversations. The alias maps to
  `./src-ai-skills/*` in `tsconfig.json` paths; the directory
  doesn't rename.
- **`lib/schemas/` directory is deleted, not retained as a
  re-export shim.** Reason: per the project's "no
  backwards-compat hacks" rule (CLAUDE.md), a re-export shim
  creates a second source of truth and defeats the SSOT goal.
  The import re-point is mechanical and lands in the same
  commit.
- **`lib/sessions/events.ts` moves to
  `src-ai-skills/schemas/events.ts`** (not stays in
  `lib/sessions/`). Reason: the event union *is* the
  framework's streaming contract; the `ORCHESTRATOR.md` spec
  lists it as part of the framework. Hosts (boardroom and
  any future hosts) consume it; they don't define it.
- **`PersonaRoleSchema` extends to include `'secretary'` in
  this phase, but the cast guard ("exactly one secretary
  per session") lands in phase 21.** Reason: extending the
  enum is a 1-line schema change; the cast guard is
  orchestrator + persona-loader logic. Splitting them keeps
  phase 21's diff focused on secretary behavior, not schema
  housekeeping.
- **`TurnAuthor` extends to include `'secretary'`,
  `SessionPhase` extends to include `'retro-review' |
  'retrospective'` in this phase.** Same reason: enum
  housekeeping lands now so phases 21–22 don't have to.
  No new event variants are added — phase 21 adds those
  (e.g. `retro-review.prompt`, `retrospective.complete`)
  alongside the orchestrator wiring.
- **No new `SessionEvent` variants in this phase.** The
  union stays exactly as it is in
  `lib/sessions/events.ts` today. Phase 21 adds variants
  for the secretary turns; phase 22 adds the wrapper-phase
  variants.
- **The orchestrator implementation
  (`lib/anthropic/conferring.ts`) stays put.** Reason: the
  build plan row scopes this phase to "schemas" and "test
  harness," not to moving the orchestrator. The orchestrator
  is boardroom-specific in two ways (Anthropic SDK wiring,
  Supabase persistence hooks) that don't belong in a
  framework directory. The framework's *spec* lives at
  `src-ai-skills/ORCHESTRATOR.md`; the *reference impl* is
  the boardroom one. Drift between the two is exactly what
  the new test harness catches. If a future phase wants to
  extract a pure-framework orchestrator, that's a separate
  brief.
- **The stub LLM client lives at
  `src-ai-skills/__tests__/stub-llm-client.ts`, not under
  a `helpers/` subdir.** Reason: the test directory is
  small (3 spec files + 1 helper); a single flat layer is
  clearer than a nested one. If the helper count grows to
  3+ later, refactor then.
- **The reference-personas test reads from
  `src-ai-skills/personas/`, not `boardroom/personas/`.**
  Reason: `src-ai-skills/personas/` is the framework's
  reference cast (5 files, including secretary.md);
  `personas/` at the repo root is boardroom's deployed
  cast (4 files, no secretary yet — phase 21 adds it).
  The framework test must validate its own reference cast,
  not the host's deployment.
- **The orchestrator stub test uses the reference template
  and reference personas from `src-ai-skills/`, NOT a
  hand-built test fixture.** Reason: the whole point of
  the harness is to catch drift between the reference data
  and the engine. Using a hand-built fixture would only
  test the engine, not the contract.
- **`pnpm data:validate` import path updates in the same
  commit.** Reason: the script breaks immediately if its
  schema imports don't update with the move. No reason to
  split the change.
- **`secretary.md`'s `role: secretary` frontmatter is
  validated by this phase's tests** (the role enum
  extension makes the file parse cleanly). The
  *cast guard* ("exactly one secretary in any cast") is
  phase 21 work.
- **No vitest config changes.** The existing
  `vitest.config.ts` discovers `**/*.test.ts` and
  `**/*.test.tsx` everywhere; the new
  `src-ai-skills/__tests__/` directory is auto-included.
  If a path-aware exclusion is needed (e.g. to run only
  framework tests via `pnpm test:framework`), file as a
  follow-up — not in scope for this phase.
- **No `data/BACKLOG.md` impact.** This phase ships no
  data work.

## Mobile reflow / responsive

**N/A.**

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `src-ai-skills/schemas/persona.ts` | (moved) all existing cases + new "secretary role valid" case | — |
| `src-ai-skills/schemas/template.ts` | (moved) existing template-validation cases | — |
| `src-ai-skills/schemas/events.ts` | type-only; no runtime tests needed | — |
| `src-ai-skills/__tests__/stub-llm-client.ts` | (helper, not tested directly — exercised by `orchestrator-stub.test.ts`) | — |
| `src-ai-skills/__tests__/reference-personas.test.ts` | all 5 reference personas parse; exactly one secretary; system prompts ≥40 chars; unique slugs | — |
| `src-ai-skills/__tests__/reference-template.test.ts` | pitch-to-spec.json parses; five core phases in order; exec-summary checkpoint present | — |
| `src-ai-skills/__tests__/orchestrator-stub.test.ts` | session.started fires; phase.entered fires for all five core phases in order; turn.begin/delta/end triples emit per phase; checkpoint events resolve via awaitAnswer; artifact.ready precedes session.done; no session.error on happy path | — |
| All existing consumers (~30 files) | unchanged behavior; only import paths shift | — |
| `pnpm data:validate` | still passes after schema move | — |
| `lib/anthropic/__tests__/conferring.test.ts` | still passes after import re-point | — |

## Hermetic e2e registration

**No new e2e.** The framework test harness is unit-level
(pure functions + an async generator with no I/O). The
existing hermetic e2e gate continues to cover boardroom's
deployed surfaces; those are untouched by this refactor.

## Verify gate

```bash
pnpm verify
```

Runs the full sequence:
- `pnpm typecheck` — catches every missed import re-point.
  Critical step — the type errors *are* the audit trail.
- `pnpm test:run` — runs ~16 existing schema-consumer
  tests + the 3 new framework tests + the
  reference-personas / reference-template tests.
- `pnpm data:validate` — confirms the schema move didn't
  break persona/template validation in
  `scripts/data-validate.*`.
- `pnpm build` — Next.js build catches any consumer
  missed by typecheck (e.g. dynamic-import-only paths).
- `pnpm e2e` — Playwright against the built app on the
  alt port. No behavior change expected; this is the
  belt-and-suspenders confirmation.

**Each leg is a hard gate.**

## Commit body template

```
refactor: framework engine — phase 20

- src-ai-skills/schemas/{persona,template,events}.ts: new
  single source of truth for the runtime framework's
  schemas. Moved verbatim from lib/schemas/{persona,template}.ts
  and lib/sessions/events.ts; PersonaRoleSchema extended to
  include 'secretary'; TurnAuthor extended to include
  'secretary'; SessionPhase extended to include
  'retro-review' and 'retrospective'.
- src-ai-skills/schemas/index.ts: barrel re-export.
- src-ai-skills/schemas/__tests__/{persona,template}.test.ts:
  moved; persona test adds the "secretary role valid" case.
- src-ai-skills/__tests__/stub-llm-client.ts: extracted +
  generalized from lib/anthropic/__tests__/conferring.test.ts.
- src-ai-skills/__tests__/reference-personas.test.ts: all 5
  reference personas validate; exactly one secretary;
  unique slugs; system prompts ≥40 chars.
- src-ai-skills/__tests__/reference-template.test.ts:
  pitch-to-spec.json validates; five core phases in order.
- src-ai-skills/__tests__/orchestrator-stub.test.ts: runs
  runConferring against the stub + reference data; asserts
  session.started → phase.entered (×5) → turn triples →
  checkpoints resolve → artifact.ready → session.done.
- tsconfig.json: @framework/* path alias → ./src-ai-skills/*
- Old locations deleted: lib/schemas/{persona,template}.ts,
  lib/schemas/__tests__/*, lib/sessions/events.ts. The
  lib/schemas/ directory is removed; lib/sessions/ keeps
  its other files.
- ~30 consumer files re-pointed from '@/lib/schemas/*' and
  '@/lib/sessions/events' to '@framework/schemas/*'. Full
  list in the diff; pnpm typecheck is the audit trail.

Decisions:
- Path alias is @framework/* (names intent, not directory).
- lib/schemas/ deleted, not retained as re-export shim
  (SSOT goal + no-backwards-compat-hacks rule).
- Orchestrator implementation stays at lib/anthropic/ for
  v1 — the framework-vs-impl split is intentional; the
  stub test catches drift.
- Enum extensions land now (secretary role, secretary
  author, wrapper phases) but no new SessionEvent variants
  — those are phases 21–22 work.
- secretary.md validates as a valid persona file now
  (parses against extended enum); cast-guard work (exactly
  one secretary per session) is phase 21.
- Reference test uses src-ai-skills/personas/ + templates/
  (framework reference cast), not boardroom's deployed
  cast (which is missing secretary until phase 21).
```

## DoD

Flip Phase 20's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

## Follow-ups (out of scope this phase)

- **Extract a pure-framework orchestrator** to
  `src-ai-skills/orchestrator.ts` (lifting from
  `lib/anthropic/conferring.ts` with Anthropic-SDK +
  Supabase wiring split into a thin host shim). Real
  value, but a separate phase — file as an expand
  candidate after phase 22 ships if the secretary work
  surfaces actual reuse.
- **`pnpm test:framework` script** that runs only the
  `src-ai-skills/__tests__/` suite. Quality-of-life;
  not required for correctness.
- **Generated framework README section** documenting how
  to import the schemas from `@framework/schemas/*`. Add
  to `src-ai-skills/README.md` if user feedback asks.
- **Cast-guard logic** ("exactly one secretary per
  session") — phase 21.
- **New `SessionEvent` variants** for secretary turns
  (`retro-review.prompt`, `retrospective.complete`, etc.)
  — phases 21–22.
