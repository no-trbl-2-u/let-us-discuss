# Phase 22 — Secretary Mode 2 + cross-session retros

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

1. **The session learns from its predecessors.** A new
   project-level `retros` table holds one entry per concluded
   session — what went well, what didn't, what to carry forward.
   The orchestrator invokes the secretary one final time after
   the artifact phase ("Mode 2 — retrospective"), parses the
   three-bullet output, and appends a row.
2. **The next session reads the recent retros.** A new
   `retro-review` phase fires at the **start** of every session
   (before clarify). The orchestrator loads the most recent
   N retros' "for next time" bullets, emits a
   `retro-review.prompt` event, and waits for the user to pick
   zero / one / several items to address this session. The
   user's picks become a synthetic context message the leads
   read during clarify and confer. When the retros table is
   empty (first session for the project), the phase is
   silently skipped — no prompt, no event.
3. **The wrapper phases are now wired end-to-end.** Boardroom's
   `templates/pitch-to-spec.json` grows the two wrapper phases
   (`retro-review` at the start, `retrospective` at the end) so
   the deployed template matches the framework reference. The
   template schema gains `retro_review_recent_n` so phase
   metadata can control the surfaced count. A new
   `<RetroReviewCheckpoint>` component renders the picklist;
   the reducer holds the new checkpoint state.

## Prerequisite

Phases 1–21 shipped. Phase 20 set up the framework schemas at
`src-ai-skills/schemas/` and added `'retro-review' |
'retrospective'` to `SessionPhase`. Phase 21 wired the
secretary into the cast + Mode 1 (in-session phase-boundary
logging) and added `secretary_log` to the artifacts table.
The Mode 1 turn handling, `runSecretaryTurn` helper, and the
running-log accumulator are already in
`lib/anthropic/conferring.ts`; Mode 2 reuses the helper with
a different directive.

## Dependencies (operator action required for runtime)

- **Apply the new migration** in Supabase (or via `pnpm
  db:migrate`). Creates `public.retros`; widens
  `turns.phase` to allow `'retro-review'` and
  `'retrospective'`. Additive only.
- **No new env vars.** The retro-review checkpoint is
  user-facing inside the existing authed `/app` surface.

## Routes / endpoints (locked from bearings)

**No URL contract changes.** Existing `POST /api/sessions` +
`POST /api/sessions/[id]/answer` carry the new
`retro-review.prompt` checkpoint via the same SSE channel.
A new `{ kind: 'retro-review'; picked: string[] }` answer
shape rides the existing answer endpoint with no schema
change beyond the union extension.

## Library / helpers (new code)

**Created:**

- `lib/retros/repo.ts` — `loadRecentRetros(supabase, userId,
  limit): Promise<Retro[]>` returns the user's N most recent
  retros, ordered by created_at desc. `appendRetro(supabase,
  input)` inserts one row. `parseForNextTimeBullets(entryMd:
  string): string[]` extracts bullets from the "For next time"
  section of the secretary's compiled markdown (regex on the
  H3 + bulleted list shape locked in the persona file —
  resilient to leading whitespace, em-dashes, and the
  `(or: "(none)")` sentinel).
- `lib/retros/__tests__/repo.test.ts` — load-recent-retros
  query shape; appendRetro insert; parser hits the expected
  bullet shape; parser returns [] when "For next time" is
  absent or `(none)`; parser caps at 6 bullets defensively.
- `lib/retros/types.ts` — `Retro` type:
  ```ts
  type Retro = {
    id: string
    sessionId: string
    pitchExcerpt: string
    entryMd: string
    forNextTime: string[]   // parsed at write time
    createdAt: string
  }
  ```
- `components/boardroom/retro-review-checkpoint.tsx` —
  renders a checkbox list of carry-forward items pulled from
  the `retro-review.prompt` event. Submit emits an
  `{ kind: 'retro-review'; picked: string[] }` answer. Empty
  selection is valid ("skip without picking any"); the
  submit button copy reflects the picked count
  ("Skip — pick none" / "Pick 1" / "Pick 3").
- `components/boardroom/__tests__/retro-review-checkpoint.test.tsx` —
  renders the items; toggles checkboxes; submit fires with
  picked IDs; empty submit still fires (with picked=[]).
- `db/migrations/20260519_phase_22_retros.sql`:

  ```sql
  begin;

  -- Widen turns.phase to allow the wrapper phases that phase 22
  -- introduces. Drop + re-add the check constraint.
  alter table public.turns drop constraint if exists turns_phase_check;
  alter table public.turns add constraint turns_phase_check
    check (phase in (
      'retro-review',
      'clarify',
      'confer',
      'exec-summary',
      'specialists',
      'artifact',
      'retrospective',
      'moderator'
    ));

  -- One retro entry per concluded session.
  create table public.retros (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.sessions(id) on delete cascade unique,
    user_id uuid not null references auth.users(id) on delete cascade,
    pitch_excerpt text not null,
    entry_md text not null,
    for_next_time text[] not null default '{}',
    created_at timestamptz not null default now()
  );

  -- Indexed for the load-recent query (user_id + created_at desc).
  create index retros_user_recent_idx
    on public.retros (user_id, created_at desc);

  -- RLS: a user can only read their own retros (the orchestrator
  -- writes service-side, so no insert/update policy is needed at
  -- this layer — the route handler uses the user-scoped supabase
  -- client when it appends).
  alter table public.retros enable row level security;

  create policy retros_select_own on public.retros
    for select to authenticated
    using (auth.uid() = user_id);

  create policy retros_insert_own on public.retros
    for insert to authenticated
    with check (auth.uid() = user_id);

  commit;
  ```

**Edited:**

- `src-ai-skills/schemas/template.ts` — `TemplatePhaseSchema`
  gains `retro_review_recent_n: z.number().int().min(1).
  max(20).optional()`. Defaults aren't set in the schema; the
  orchestrator falls back to 5 when the phase is present and
  the field is absent.
- `src-ai-skills/schemas/events.ts` — two new variants:
  ```ts
  | {
      type: 'retro-review.prompt'
      items: Array<{ id: string; text: string; seen_in_retros: number }>
    }
  | { type: 'retrospective.complete'; sessionId: string }
  ```
  These match the variants spec'd in `ORCHESTRATOR.md`. The
  `seen_in_retros` count surfaces how often an item has
  recurred across recent retros — useful UI signal ("this
  has come up in 3 of the last 5 sessions"), defaulted to 1
  in v1 (per-item dedup heuristic is a follow-up).
- `lib/anthropic/conferring.ts` — three changes, in order:
  1. **Imports:** `loadRecentRetros`, `parseForNextTimeBullets`
     from `@/lib/retros/repo`; the new event types from
     `@framework/schemas/events`.
  2. **AnswerInput union:** add `{ kind: 'retro-review';
     picked: string[] }`.
  3. **Phase walk:** before the existing `await
     hooks.markStatus('clarify')`, add a new block:
     - Look up the `retro-review` phase in `phaseById`.
     - If absent, skip silently (template doesn't include it).
     - If present, call `hooks.loadRetros()` (new hook) and
       collect for-next-time bullets across the recent retros.
     - If the merged list is empty, skip silently — emit no
       phase.entered, no prompt.
     - Otherwise: `markStatus('retro-review')`, emit
       `phase.entered: 'retro-review'`, emit
       `retro-review.prompt` with the items, await answer.
     - On answer.kind === 'retro-review': record a synthetic
       user turn with phase='retro-review' and body
       containing the picked bullets (joined with newlines,
       prefixed with "User picked these carry-forwards: ").
     - On wrong answer.kind: emit session.error code=internal
       and abort, matching the existing pattern.
  4. **Post-artifact wrapper:** AFTER the existing
     `yield { type: 'session.done' }` is REMOVED from its
     current position, the following block lands between the
     artifact persistence and the session.done:
     - Look up the `retrospective` phase in `phaseById`. If
       absent, fall through to `session.done` immediately
       (template-controlled).
     - `markStatus('retrospective')` (new status — see
       below), emit `phase.entered: 'retrospective'`.
     - Invoke `runSecretaryTurn('retrospective', "Mode 2:
       compile a retrospective entry per your persona Mode 2
       instructions...")`. The persona file already locks the
       output shape (three bullets per section: What went
       well / What didn't / For next time).
     - Parse the compiled body for the "For next time"
       bullets via `parseForNextTimeBullets`.
     - Call `hooks.appendRetro({ pitchExcerpt, entryMd,
       forNextTime })`.
     - Emit `retrospective.complete: { sessionId }`.
     - Then emit `session.done`.
- `ConferringHooks` (in `lib/anthropic/conferring.ts`) — two
  new hooks (per ORCHESTRATOR.md):
  ```ts
  loadRetros(): Promise<Retro[]>
  appendRetro(input: {
    pitchExcerpt: string
    entryMd: string
    forNextTime: string[]
  }): Promise<void>
  ```
  Both required (no optional `?`) — the orchestrator decides
  per-template whether to invoke them; the host wires both
  unconditionally. The framework test harness can pass
  no-op implementations.
- `lib/sessions/repo.ts` — `SessionStatus` union extends to
  include `'retro-review' | 'retrospective'`. The
  `DbSessionStatus` narrow type (if it exists) widens; the
  status column in `sessions` already allows arbitrary text
  but check column constraint — phase 7 migration sets
  `status text not null` with a CHECK constraint allowing the
  v1 set + 'done' + 'aborted'. Add the two wrapper-phase
  values to that CHECK in the same migration. (See migration
  block above — yes, `sessions.status` also widens.)
- `app/api/sessions/route.ts` — wires the two new hooks:
  ```ts
  hooks: {
    ...,
    async loadRetros() {
      return loadRecentRetros(supabase, session.user.id, 5)
    },
    async appendRetro(input) {
      try {
        await appendRetro(supabase, {
          sessionId,
          userId: session.user.id,
          pitchExcerpt: input.pitchExcerpt,
          entryMd: input.entryMd,
          forNextTime: input.forNextTime,
        })
      } catch (err) {
        logError('orchestrator', err, { sessionId, step: 'appendRetro' })
      }
    },
  }
  ```
  The retro write is best-effort like the other persistence
  hooks — a failed write doesn't abort the session; it logs
  to the structured drain phase 16 wired.
- `components/boardroom/use-session-state.ts` — extend
  `SessionCheckpoint` union with the new shape:
  ```ts
  | {
      kind: 'retro-review'
      items: Array<{ id: string; text: string; seen_in_retros: number }>
    }
  ```
  Reducer handles `retro-review.prompt` (sets checkpoint),
  `retrospective.complete` (terminal — same effect as
  session.done but with a "retro saved" affordance for the
  artifact grid header).
- `components/boardroom/board-client.tsx` — handler:
  ```ts
  const submitRetroReview = useCallback((picked: string[]) => {
    sessionDispatch({ type: 'answer.sent' })
    void postAnswer({ kind: 'retro-review', picked })
  }, [...])
  ```
  And the checkpoint render block grows a branch:
  ```tsx
  {checkpoint?.kind === 'retro-review' && (
    <RetroReviewCheckpoint
      items={checkpoint.items}
      onSubmit={submitRetroReview}
    />
  )}
  ```
- `templates/pitch-to-spec.json` (boardroom's deployed
  template) — gets two new phases prepended/appended:
  ```json
  {
    "id": "retro-review",
    "name": "Recent retros",
    "description": "Surface unresolved 'for next time' items...",
    "retro_review_recent_n": 5
  },
  ... (existing five core phases unchanged) ...
  {
    "id": "retrospective",
    "name": "Retro",
    "description": "Secretary writes a single retrospective entry...",
    "turn_budget": 1
  }
  ```
  Also updates the artifact phase's description to "Render
  the four artifacts" (mirrors src-ai-skills/templates/
  pitch-to-spec.json line for line after this lands).
- `lib/anthropic/__tests__/conferring.test.ts` — extend two
  tests:
  1. Add a `loadRetros` + `appendRetro` to the test `makeHooks()`
     fixture. Default implementations return `[]` and a
     no-op.
  2. Add a new test "walks retro-review when the template
     includes it and retros exist": stub `loadRetros` to
     return one Retro with a non-empty `forNextTime`; assert
     `retro-review.prompt` fires before clarify; script the
     `retro-review` answer; assert the synthetic user turn
     lands in `turns` with phase='retro-review'.
  3. Add a new test "walks retrospective at session end":
     assert `retrospective.complete` fires after
     `artifact.ready` and before `session.done`; assert
     `appendRetro` was called with non-empty
     `forNextTime`.
- `src-ai-skills/__tests__/orchestrator-stub.test.ts` —
  extend with a third assertion: when the reference template's
  wrapper phases are exercised, the events list includes
  `retro-review.prompt` (if stub loadRetros returns items)
  and `retrospective.complete` after the artifact phase.
- `app/api/sessions/__tests__/route.test.ts` — the existing
  fixtures already pass; add a test "wires loadRetros +
  appendRetro hooks": mock the retros repo, assert the route
  calls them.
- `e2e/secretary-turn.spec.ts` (phase 21's conditional
  skeleton) — keep test-skipping; this phase doesn't
  meaningfully extend it.

## DB schema

See migration block above. Two changes:
- New `public.retros` table with RLS.
- Widened `turns.phase` and `sessions.status` check
  constraints to allow `'retro-review'` and
  `'retrospective'`.

The `DbTurnPhase` narrow type in `lib/sessions/repo.ts` —
phase 21's comment promised this phase would widen it. Lift
the cast at the `appendTurn` insert site by adding the two
new values to `DbTurnPhase`. Same idea on `SessionStatus`.

## Constants

`config/limits.ts` (or equivalent — confirm during build):
```ts
export const RETRO_REVIEW_RECENT_N = 5
```
Documented in bearings's "Decisions standing for the
autonomous loop" — top-N for any list = 10, but retros
deserve a tighter cap to keep the prompt list scannable.

## Session events + reducer

`src-ai-skills/schemas/events.ts` adds:
```ts
| {
    type: 'retro-review.prompt'
    items: Array<{ id: string; text: string; seen_in_retros: number }>
  }
| { type: 'retrospective.complete'; sessionId: string }
```

The reducer's `case 'retro-review.prompt'` sets
`currentCheckpoint: { kind: 'retro-review', items: event.items }`.
`case 'retrospective.complete'` is a no-op for the in-session
UI; the artifact grid already renders from the
`artifact.ready` event. A small "retro saved" affordance lands
in the page header for visual confirmation.

The user-side answer extension:
`type RetroReviewAnswer = { kind: 'retro-review'; picked: string[] }`
joins the `AnswerInput` union in `conferring.ts`.

## Cross-links

**In** (verify still wired):
- Phase 21's secretary persona + `runSecretaryTurn` helper.
- Phase 16's pricing / observability (the new retrospective
  turn consumes budget like any other; rolling totals
  account for it).
- Phase 9's per-session token cap (still honored — if the
  budget is exhausted before the retrospective turn, the
  orchestrator skips it gracefully and no retro is written
  for that session).

**Out** (ship):
- The retro-review checkpoint is a new user-facing surface
  inside the existing `/app` shell.
- The retros table is the source-of-truth for the
  cross-session learning loop; future phases (skill-pack
  export, multi-user sessions) read from here.

**Retro-fit:**
- `templates/pitch-to-spec.json` re-shaped to match the
  framework reference (wrapper phases prepended/appended).
  Existing sessions persisted under the old template were
  validated against the old schema; the new schema is a
  strict superset (wrapper phases are optional in the
  orchestrator's walk), so load-time parse stays compatible.

## SEO / metadata

N/A. Authed-only surfaces.

## Hero / body / sub-section composition

One new visual: the `<RetroReviewCheckpoint>` card. Sits
inside the existing checkpoint slot in `board-client.tsx`,
same shell as `<ClarifyPrompt>` and `<ExecSummaryCard>`. Layout:

```
─────────────────────────────────────────────────────
  Recent retros — pick zero or more to address

  ☐  Surface MAX_PERSONAS_SEATED to the user during staffing
     · 3 of last 5 sessions
  ☐  Document the "first-touch" definition somewhere visible
     · 2 of last 5 sessions
  ☐  Add a clarify question about success metric
     · 1 of last 5 sessions

  ┌────────────────┐
  │ Pick 0 — skip  │
  └────────────────┘
─────────────────────────────────────────────────────
```

- Eyebrow + lede: "Recent retros — pick zero or more to address"
- Each item: serif body, mono right-side "N of last 5"
  affordance (small, ink-muted).
- Submit button copy reflects selection count.

The "(none)" sentinel from the persona file's structured-log
output is filtered at parse time — never surfaces here.

## Empty / loading / error states

- **No retros yet (first session for this project, or all
  prior retros parsed empty):** the orchestrator skips the
  retro-review phase silently. No checkpoint event, no
  empty-state card. The session proceeds directly to clarify
  per the existing flow.
- **User picks zero, hits submit:** the orchestrator records
  a synthetic user turn with body "User picked no
  carry-forwards." and proceeds to clarify. Clarify continues
  exactly as before — the user just declined the prompt.
- **Retro write fails (DB error in appendRetro):** logged
  via `logError`; the session still emits `session.done`.
  The next session's `retro-review` will lack this session's
  carry-forwards — a small loss, not a failure.
- **Retrospective turn fails (LLM error mid-stream):** the
  orchestrator catches and skips appendRetro; emits
  `session.done` without `retrospective.complete`.

## Decisions made upfront — DO NOT ASK

- **Retros live in a Postgres table, not a repo file.** The
  ORCHESTRATOR.md framework spec describes the artifact as
  `retros.md` because the framework is portable to filesystem
  hosts; on Vercel the filesystem is read-only at runtime.
  The deployed implementation uses a managed-Postgres table
  per `bearings.md`'s `hybrid-with-managed-postgres` choice.
  The shape is one row per session.
- **`retros.user_id` is part of the row, not just
  `session_id`.** Reason: the load-recent query is
  user-scoped; carrying user_id avoids a JOIN through
  sessions on every read. Cascade delete via
  `auth.users(id)` keeps GDPR/account-deletion cleanly
  wired (phase 18 already cascades `sessions`; this row
  picks up the same delete path via both FKs).
- **`for_next_time` is stored as a parsed `text[]` AND the
  full `entry_md` is kept.** The parsed array is cheaper for
  the retro-review surface; the markdown is the authoritative
  record. Re-parsing the markdown on every read would work
  but burns CPU; the small denorm is worth it.
- **Parser is regex-based, not LLM-based.** The persona's
  Mode 2 output shape is locked ("### For next time" header,
  one-line bullets). A regex over the section is reliable;
  using an LLM to re-extract bullets would be circular and
  introduce drift.
- **Items in the prompt list are de-duplicated naively
  across the N most recent retros** — exact text match plus
  a `seen_in_retros` count. Smarter de-dup (semantic
  similarity, fuzzy match) is a follow-up. The naive version
  surfaces "this exact item recurred" honestly; the
  semantic-overlap question is future research.
- **The retro-review phase is silently skipped when retros
  is empty.** No empty-state card, no "first session"
  copy. The user shouldn't see a surface that does nothing.
  ORCHESTRATOR.md locks this: "Skipped silently when
  retros.md is empty (first session for this project)."
- **`RETRO_REVIEW_RECENT_N = 5`** as a constant. Pinned in
  config/limits.ts. The framework's
  `retro_review_recent_n` template field can override;
  default if absent is 5. Tighter than the standard
  "top-N = 10" cap because the prompt list is scannable
  inside one screen at the design's accent-2 register.
- **User picks zero is valid.** "Skip — pick none" is a
  legitimate UX flow. The orchestrator records the
  no-picks-decision so the audit trail shows the user
  saw the prompt and declined.
- **The picked items become a synthetic user turn**, not
  a new system-message injection. Reason: the existing
  `messagesFor` helper already routes user turns to the
  LLM as user-role messages; reusing that path is cheaper
  than threading a side channel through every LLM call.
- **The retrospective turn runs even when the user picked
  nothing in retro-review.** The retrospective is about
  THIS session's outcomes, not the prior session's
  carry-forwards.
- **The retrospective turn skips moderateOutput**, same
  as Mode 1 turns (phase 21 decision). Pure
  transcription / introspection; no novel content to gate.
- **`session.status = 'retrospective'`** for the final
  phase, before the existing `'done'`. The status column
  constraint widens to allow this; existing consumers
  (session-list-item, status-pill) display "retro" or
  similar — confirm during the build step that the existing
  status mapper handles the new value (probably yes — it's
  a simple string).
- **Wrapper phases are template-controlled.** A template
  without the `retro-review` phase produces no retro-review
  event; a template without `retrospective` skips the final
  secretary turn + appendRetro. Boardroom v1 ships both
  phases; future templates (or test fixtures) can opt out.
- **`<RetroReviewCheckpoint>` uses checkboxes, not
  toggles.** Multi-select is the affordance; a checkbox is
  the standard ARIA pattern for it. The submit button
  reflects the count.
- **Submit button copy varies by count.** "Skip — pick
  none" (0), "Pick 1" (1), "Pick N" (≥2). Reason: the
  zero-pick state is a legitimate path that warrants
  explicit language; the default "Submit" copy would
  read as "submit blank" which is confusing.
- **`<RetroReviewCheckpoint>` items have stable IDs.** The
  `id` field on each item is opaque to the user — used by
  the answer payload to round-trip the selection.
  Generated server-side as `retro-<session-id>-<bullet-idx>`
  so the orchestrator can map back to source retros if
  needed (v1 doesn't; future telemetry might).
- **`seen_in_retros` is a server-side count, not a
  per-item join.** Computed by the deduper while building
  the prompt-event payload; doesn't require a separate
  query.
- **`retros` table has no `updated_at`.** Retros are
  append-only by design — once written, they're the audit
  trail. No "edit a retro" UX in v1.
- **The "retro saved" affordance after
  `retrospective.complete`** is a one-line eyebrow above
  the artifact grid: "retro saved · next session will see
  it". Mono caps, ink-muted. Not a banner, not a toast.
- **`config/limits.ts`** (or `lib/limits.ts` — confirm at
  build) gets `RETRO_REVIEW_RECENT_N = 5` documented per
  bearings rule on token / turn budgets being pinned.
- **The `loadRetros` hook is called once per session, at
  the start.** Not memoized across sessions; not
  pre-fetched server-side; the orchestrator owns the
  call. Reads cost one query per session start —
  negligible.
- **A session whose template lacks `retro-review` but
  includes `retrospective` writes a retro without
  reading prior ones.** Asymmetry is intentional — a
  template author might want to record retros for audit
  without surfacing them as a checkpoint.

## Mobile reflow / responsive

- `<RetroReviewCheckpoint>`: stacks vertically on 375px;
  checkboxes left-aligned with body text; "seen in N"
  meta wraps to the second line. Submit button full-width
  at 375px, right-aligned at md+.
- "retro saved" eyebrow: single line on all viewports.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `db/migrations/20260519_phase_22_retros.sql` | data:validate runs; migration applies forward | — |
| `lib/retros/repo.ts` | loadRecentRetros query shape; appendRetro insert; parseForNextTimeBullets covers "For next time" section, missing section, "(none)" sentinel, leading whitespace tolerance | — |
| `lib/anthropic/conferring.ts` (extended) | walks retro-review when template + retros present; skips silently when retros empty; emits retrospective.complete after artifact; calls appendRetro with parsed bullets | — |
| `app/api/sessions/route.ts` (extended) | wires loadRetros + appendRetro hooks; route still succeeds when retros table is empty | — |
| `components/boardroom/retro-review-checkpoint.tsx` | renders items; toggles selection; submit fires with picked IDs (and empty array) | — |
| `components/boardroom/use-session-state.ts` (extended) | reducer handles retro-review.prompt + retrospective.complete | — |
| `src-ai-skills/__tests__/orchestrator-stub.test.ts` (extended) | reference cast + reference template now exercise wrapper phases; retrospective.complete fires | — |
| `templates/pitch-to-spec.json` (extended) | pnpm data:validate parses the new phases | — |

## Hermetic e2e registration

No new hermetic e2e. The wrapper phases are authed-only and
the existing e2e harness uses placeholder Supabase env. The
existing `e2e/secretary-turn.spec.ts` (phase 21's conditional
skeleton) covers the broader authed walk when the operator
wires the magic-link inbox; phase 22's wrapper phases ride
that same gate.

## Verify gate

```bash
pnpm verify
```

Runs the full sequence:
- `pnpm typecheck` — catches the AnswerInput / SessionEvent /
  ConferringHooks widening, plus the new template phase shape.
- `pnpm test:run` — runs phase 21 + 20 + the new repo + parser
  + reducer + component + orchestrator tests.
- `pnpm data:validate` — validates the extended
  `templates/pitch-to-spec.json` against the new schema (which
  accepts `retro_review_recent_n`).
- `pnpm build` — Next.js build catches any consumer missed
  by typecheck.
- `pnpm e2e` — Playwright against the built app on the alt
  port; the secretary e2e still test-skips.

**Each leg is a hard gate.**

## Commit body template

```
feat: secretary Mode 2 + cross-session retros — phase 22

- db/migrations/20260519_phase_22_retros.sql: new retros
  table (RLS-on; user-scoped index for the load-recent
  query); widens turns.phase + sessions.status to allow
  'retro-review' and 'retrospective'.
- lib/retros/repo.ts: loadRecentRetros, appendRetro,
  parseForNextTimeBullets.
- lib/retros/types.ts: Retro type.
- src-ai-skills/schemas/template.ts: TemplatePhaseSchema
  accepts retro_review_recent_n.
- src-ai-skills/schemas/events.ts: retro-review.prompt +
  retrospective.complete event variants land.
- lib/anthropic/conferring.ts: AnswerInput union extends
  with { kind: 'retro-review'; picked: string[] }. New
  retro-review phase fires at the start (when template
  includes it AND loadRetros returns items); records a
  synthetic user turn carrying the picked bullets.
  Retrospective phase fires after artifact: invokes
  runSecretaryTurn with the Mode 2 directive, parses
  for_next_time bullets, calls appendRetro, emits
  retrospective.complete before session.done. Both
  wrapper phases are template-controlled (silently
  skipped if the template doesn't include them).
- ConferringHooks: loadRetros() + appendRetro() are now
  required hooks (host wires both; framework test
  harness can pass no-ops).
- lib/sessions/repo.ts: SessionStatus extends to include
  'retro-review' + 'retrospective'; DbTurnPhase widens
  too (the phase-21 pointer comment removed).
- app/api/sessions/route.ts: hooks wire loadRecentRetros
  (limit=5) + appendRetro; both best-effort with logError.
- components/boardroom/retro-review-checkpoint.tsx: new
  multi-select checkpoint component.
- components/boardroom/use-session-state.ts: SessionCheckpoint
  union extends; reducer handles the two new events.
- components/boardroom/board-client.tsx: submitRetroReview
  handler + the new checkpoint render branch.
- templates/pitch-to-spec.json: prepends retro-review,
  appends retrospective, mirrors the framework reference
  template line for line.
- lib/limits.ts: RETRO_REVIEW_RECENT_N = 5.

Tests:
- lib/retros/__tests__/repo.test.ts: 4 cases.
- lib/anthropic/__tests__/conferring.test.ts (extended):
  retro-review walk + retrospective walk.
- src-ai-skills/__tests__/orchestrator-stub.test.ts
  (extended): wrapper phases fire when reference template
  + non-empty stub retros are wired.
- app/api/sessions/__tests__/route.test.ts (extended):
  loadRetros + appendRetro hooks fire.
- components/boardroom/__tests__/retro-review-checkpoint.test.tsx:
  4 cases.

Decisions:
- Retros live in Postgres, not a repo file (Vercel
  read-only fs; bearings hybrid-with-managed-postgres).
- retros has user_id + session_id (denorm for query);
  cascade delete via both FKs picks up phase 18's wipe.
- for_next_time stored as text[] alongside entry_md
  (cheap pre-parsed list + markdown audit trail).
- Parser is regex over the persona's locked output
  shape; LLM re-extraction would be circular drift.
- Naive dedup across recent retros (exact text match +
  seen_in_retros count); semantic dedup is a follow-up.
- retro-review silently skipped when retros is empty
  (no empty-state card, no first-session copy).
- User picks zero is a valid path; submit button copy
  reflects count.
- Picked items become a synthetic user turn; reuses the
  existing messagesFor LLM-routing path.
- The retrospective turn runs regardless of retro-review
  outcome — it logs THIS session, not last session's
  carry-forwards.
- Wrapper phases are template-controlled; a template
  without them produces a session that walks only the
  five core phases.
- RETRO_REVIEW_RECENT_N = 5 (tighter than top-N=10 cap
  for scan-ability inside the prompt list).

Operator action: `pnpm db:migrate` (or apply the SQL
file in Supabase) to create public.retros and widen the
turns.phase + sessions.status constraints. Until applied,
the wrapper phases will fail at the DB boundary; sessions
will still complete the five core phases but the retro
write will logError silently.

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 22's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

Filed in `plan/AUDIT.md` as `[operator]` row: "Apply phase 22
migration in Supabase." Auto-tagged so /iterate skips per
its own contract.

## Follow-ups (out of scope this phase)

- **Semantic dedup** in the retro-review prompt list —
  exact-text dedup is a v1 stand-in.
- **Per-item dismissal** ("don't show this carry-forward
  again"). Currently if the user picks zero, the same items
  re-surface next session. A "skip permanently" button is
  reasonable next.
- **Retro browsing surface** — a `/app/retros` page that
  lists past retro entries for the signed-in user. Not in
  scope; the data is in the table for future use.
- **Retro-mining heuristics** — surface common carry-forwards
  across users (anonymized) for product-research. Out of v1
  scope (privacy implications).
- **Authed e2e for the full wrapper walk** — phase 21's
  `e2e/secretary-turn.spec.ts` is the skeleton; once the
  operator wires the magic-link inbox, that spec extends
  to cover retro-review + retrospective.
- **`/app/sessions/[id]` page surfacing the retro entry** —
  v1 leaves the retro in its table; a small "Retro saved"
  link on the session results page is a small follow-up.
