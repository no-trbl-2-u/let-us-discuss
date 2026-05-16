# Phase 5 — Boardroom canonical surface (CANONICAL SIBLING)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body. **This phase establishes the canonical structure every
> later in-app feature surface mirrors.** Spend extra care
> here. Budget 2x of a typical phase.
>
> Refreshed via `/plan-a-phase` on 2026-05-16 against:
> design v1 (commit 76c9338) and the /oversight inputs in
> ff7c989 (DnD library pin + design-primitive consumption).
> Supersedes `plan/phases/phase_canonical_sibling.md`, which is
> deleted in the same commit.

## Outcome

`/app` renders the boardroom: a drag-and-drop table on paper, a
persona shelf, a pitch input, and a "Start session" affordance.
Four discriminated states flow through a single reducer
(`empty` → `staffed` → `ready` → `running`). Persistence is
URL params + `sessionStorage` in this phase; phase 6 lights up
the DB write for authed users. The four metaphor-carrying
design primitives (`BoardroomTable`, draggable `PersonaCard`,
pitch input, the future `TurnBubble`) are wired with real data
for the first time.

## Routes / endpoints (locked in `bearings.md`)

- `/app` — authenticated boardroom session entry. Public routes
  unchanged. The placeholder shipped in phase 3 (`eb5e302`) is
  replaced.

No new endpoints, no new server actions in phase 5 — the
"Start session" button transitions the in-page state machine
to `running` but does not call any API. Phase 7's
`/api/sessions` lights that up.

## Content / data reads

| Helper | Lookup | Use |
|---|---|---|
| `loadPersonas()` | `lib/personas/load.ts` (phase 4) | Read all `personas/*.md` for the shelf. Sort: lead-first, alphabetical (the helper already does this). |
| `loadDefaultTemplate()` | `lib/templates/load.ts` (phase 4) | Read `templates/pitch-to-spec.json` so the start-button copy can reference the first phase name. Phase 7 consumes it more deeply. |
| `requireUser()` | `lib/supabase/auth.ts` (phase 3) | `/app/layout.tsx` already gates the segment. Page reads `getCurrentUser()` only if it needs the email for chrome. |
| `MIN_PERSONAS_SEATED` / `MAX_PERSONAS_SEATED` / `MAX_PITCH_WORDS` | `lib/limits.ts` (phase 4) | Reducer transition guards; client-side enforcement on pitch length. |

No new persona / template loaders. No `personas/` schema
changes. No new Zod schemas.

## Components / handlers (in `components/boardroom/`)

- `board.tsx` — server-aware wrapper. Reads personas + template
  on the server, hands them to a thin client island via props.
- `board-client.tsx` — `'use client'`. The reducer + dnd-kit
  context (`DndContext` + `SortableContext`) live here.
  Composes the design primitives below.
- `persona-shelf.tsx` — left column. Iterates `loadPersonas()`
  output, wraps each in `useDraggable` from `@dnd-kit/core`.
  The visual surface is the design's draggable
  `PersonaCard` primitive at `@/design/primitives/persona-card`
  with `state="resting"` (or `state="dragging"` while held).
- `boardroom-surface.tsx` — main column. Wraps the design's
  `BoardroomTable` primitive at
  `@/design/primitives/boardroom-table` with `useDroppable` on
  every seat. Seats render either an empty placeholder or
  `PersonaCard` with `state="staffed"`.
- `pitch-input.tsx` — multiline textarea + word counter +
  client-side `MAX_PITCH_WORDS` guard. No server validation in
  phase 5 (phase 7 lands it).
- `start-session-button.tsx` — uses the design `Button`
  primitive (`variant="primary"`). Disabled until reducer is
  in `ready` state.
- `boardroom-empty-hint.tsx` — the empty-state copy already
  rendered by the design's `BoardroomTable` primitive
  (`state="empty"`); this small wrapper exists for parity with
  the canonical structure later phases will mirror (`<Family>Empty`).
- `use-board-state.ts` — `useReducer` + the discriminated
  union state machine. Pure logic; tests sit beside it in
  `__tests__/`.
- `use-board-persistence.ts` — wires URL params + `sessionStorage`
  to the reducer. Two helpers: `readInitialBoardState()` and a
  `useEffect` that mirrors state into both targets.

Pure helpers and their tests live in
`components/boardroom/__tests__/`. Keep each component file
single-purpose; bias to splitting (5 small > 1 dense).

## Cross-links

**In** (already shipped — verify still wired):
- Phase 3 middleware + `/app/layout.tsx` continue to gate
  `/app/*`. The new `/app/page.tsx` calls `requireUser()` as
  the belt-and-suspenders pattern.
- Phase 4 `loadPersonas()` is the canonical persona reader.
  Phase 5 does **not** duplicate it.
- Visual system v1 tokens + `Heading`/`Button`/`Link`/`Card`
  primitives. All consumed via `@/design/primitives/<name>`.

**Out** (this phase ships these):
- The reducer's `running` state is the hook phase 7 consumes
  to start an actual streaming session (no-op in phase 5).
- Event surface: `onStartSession`, `onPersonaSeated`,
  `onPersonaUnseated`, `onPitchChange`. Emitted from
  `board-client.tsx`.

**Retro-fit**:
- `components/site/header.tsx` already links `/signin` → after
  sign-in, the user lands on `/app`. No retro-fit needed for
  phase 5 itself.

## SEO / metadata

`/app` is authenticated and noindex (already set on the phase
3 placeholder). Keep `<title>Boardroom — session</title>`.

## Hero / body / sub-section composition

```
<AuthedShell>                            # phase 3 layout (requireUser)
  <main className="grid">                # two columns at md+; stacked at sm
    <PersonaShelf                        # left
      personas={loadPersonas()}
      seatedIds={reducer.staffed} />
    <section className="flex flex-col">  # right
      <BoardroomSurface                  # design's BoardroomTable + droppable seats
        seats={reducer.seats}
        state={reducer.state} />
      <PitchInput
        value={reducer.pitch}
        max={MAX_PITCH_WORDS}
        onChange={...} />
      <StartSessionButton
        disabled={reducer.state !== 'ready'}
        onClick={() => dispatch({ type: 'START' })} />
      <TranscriptArea placeholder />     # phase 7 fills this
    </section>
  </main>
</AuthedShell>
```

`TranscriptArea` in phase 5 renders a single "Session shipped
in phase 7." card built from the design `Card` primitive —
honest about state.

## Empty / loading / error states

- **Empty** (no personas seated): the design's `BoardroomTable
  state="empty"` primitive already renders the canonical hint
  copy. Wrap it in the data plumbing; do not duplicate text.
- **Loading** (persona shelf): personas are server-resolved, so
  no client loading state. If `loadPersonas()` ever returns
  `[]`, the shelf renders a single sans-italic line: *"No
  personas yet — the v1 library ships in phase 4."* (matches
  `/about/personas`'s empty state).
- **Error** (persona load throws): the route segment falls to
  Next.js's default error boundary. `data:validate` catches
  invalid persona files at CI time; production should not see
  this. Phase 17 adds friendlier error boundaries.

## Decisions made upfront — DO NOT ASK

- **Drag-and-drop library:** `@dnd-kit/core` + `@dnd-kit/sortable`.
  Overrides the original brief's native-HTML5 pick (per
  /oversight 2026-05-16 input). Rationale: dnd-kit ships
  keyboard-equivalent semantics out of the box, so phase 14's
  a11y sweep becomes a verification pass rather than a rewrite.
  Bundle cost (~25kB gz) is accepted.
- **Sensors:** `PointerSensor` + `KeyboardSensor` from dnd-kit;
  defaults. No touch sensor configuration in v1 (phase 14
  re-evaluates).
- **Collision detection:** dnd-kit's `closestCenter` strategy.
  Seats render at canonical positions on the ellipse from the
  design primitive — `closestCenter` matches the metaphor
  ("which seat is this card closest to").
- **Maximum personas seated:** `MAX_PERSONAS_SEATED = 6`
  (from `lib/limits.ts`). The design's `BoardroomTable` renders
  exactly 6 seats around the oval ring.
- **Minimum personas to start:** `MIN_PERSONAS_SEATED = 2`
  (from `lib/limits.ts`).
- **Pitch length:** clientside `MAX_PITCH_WORDS = 600` from
  `lib/limits.ts`. Word counter visible at all times; soft warn
  at 90%; hard cap at 100%.
- **State machine shape:** discriminated union
  `{ tag: 'empty' | 'staffed' | 'ready' | 'running', ... }`
  inside `use-board-state.ts`. Transitions:
  - `empty → staffed` when first persona seated.
  - `staffed → ready` when `staffed.length >= MIN_PERSONAS_SEATED`
    AND pitch has ≥1 word.
  - `staffed/ready → ready` when both gates remain met.
  - `ready → running` on `START` action; terminal in phase 5.
  - `running → empty` on `RESET` (button hidden until phase 7
    wires the real session reset).
- **Persistence:** URL params encode the staffed-slug list
  (`?personas=product-lead,skeptical-engineer`); `sessionStorage`
  carries the pitch under key `boardroom:pitch`. No DB write in
  this phase.
- **`running` placeholder:** a single design `Card` containing
  *"Session shipped in phase 7."* + an exec-summary excerpt
  pulled from the template's `exec-summary` phase description.
  Honest about state.
- **No undo for drag-and-drop in phase 5.** Re-drag handles it.
- **Component file naming:** `kebab-case.tsx`. Test names match
  source with `.test.tsx`. Tests colocated in
  `components/boardroom/__tests__/`.
- **No new server actions.** The "Start session" button is
  client-only in phase 5.
- **Mobile pattern:** at `< md`, the shelf collapses into a
  horizontal-scrollable strip *above* the table. Drag-and-drop
  on touch is dnd-kit's default (long-press to pick up). No
  tap-to-place affordance in phase 5; phase 14 may add one.

A brief that leaves Open Qs is a brief that fails its job.

## Mobile reflow / responsive

- Below `md` (768px): single column. Shelf above, table below,
  pitch + start sticky-bottom.
- The design's `BoardroomTable` primitive is currently fixed at
  `880×520` (desktop). For mobile, render at `100%` width with a
  proportionally scaled height: `aspect-[880/520]` from the
  CSS-variable spacing system, max-width 100vw minus the
  container px. Seats stay anchored to the ellipse formula;
  card width drops from 220 to ~160 at narrow viewports.
- Pitch input is full-width at all viewports.
- The 375px viewport must reflow without horizontal scroll
  (`scrollWidth - innerWidth ≤ 1`).

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `use-board-state.ts` (reducer) | empty → staffed; staffed → ready; ready → running; reset path; max-personas reject; pitch-min gate | — |
| `use-board-persistence.ts` | URL param round-trip; sessionStorage restore on mount; storage cleared on reset | — |
| `persona-shelf.tsx` | renders all personas; renders dragging state when dnd-kit reports `active` | — |
| `boardroom-surface.tsx` | renders empty seats in `empty` state; renders staffed personas in `staffed`; rail visible in `active` (phase 7 still wires that path; the visual primitive is the same) | — |
| `pitch-input.tsx` | renders word counter; soft-warns at 90%; blocks chars past 100%; aria-invalid on overflow | — |
| `start-session-button.tsx` | disabled when state ≠ `ready`; enabled when `ready`; fires `onStartSession` on click | — |
| `app/app/page.tsx` | calls `requireUser`; renders Board with personas + template; renders running placeholder when state=`running` (mocked) | `/app` unauthenticated → `/signin?next=/app` (already covered by phase 3's `e2e/app-redirect.spec.ts`) |
| `/app` (authed) | — | n/a in phase 5 — requires a real session cookie. Filed as a follow-up under `[needs-e2e]` once magic-link e2e (AUDIT 4.0) lands. |
| `/app` 375px reflow | — | covered indirectly via `/about/personas` 375px test pattern; ship the same test against `/app` when auth-aware e2e is available |

## Hermetic e2e registration

Phase 5 does **not** add a new e2e file. The existing
`e2e/app-redirect.spec.ts` continues to assert the anon →
signin redirect. Authed `/app` walks land when magic-link e2e
ships per `plan/AUDIT.md` [needs-e2e].

## Verify gate

```bash
pnpm verify
```

All checks pass before commit.

## Commit body template

```
feat: boardroom canonical surface — phase 5

- /app drag-and-drop board, persona shelf, pitch input,
  start-session button
- @dnd-kit/core + @dnd-kit/sortable; PointerSensor +
  KeyboardSensor; closestCenter strategy
- useReducer state machine: empty / staffed / ready / running
- URL params + sessionStorage persistence; phase 6 lands DB
- Design v1 primitives consumed: BoardroomTable, PersonaCard,
  Button, Card, Heading, Link
- /app/page.tsx replaces the phase 3 placeholder

Canonical sibling for every later authed feature surface.

Decisions:
- Max seated personas: 6; min: 2; pitch max: 600 words
  (from lib/limits.ts)
- dnd-kit (not native HTML5) per /oversight 2026-05-16 —
  keyboard semantics out of the box
- closestCenter collision; PointerSensor + KeyboardSensor
- 'running' state is terminal in phase 5; phase 7 wires
  /api/sessions and the actual conferring loop
- Mobile: shelf becomes horizontal strip above the table at
  < md; table aspect-ratio scales to viewport
```

## DoD

Flip Phase 5's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash, add to
"Phase log". Delete the old
`plan/phases/phase_canonical_sibling.md` (already deleted in
the brief-refresh commit prior to ship).

## Confirm deploy

```bash
pnpm deploy:check
```

## Follow-ups (out of scope this phase)

- DB-persisted board state for authed users (phase 6).
- `/api/sessions` streaming + real running state (phase 7).
- The `TurnBubble` primitive used live (phase 7 transcript).
- Touch-drag a11y verification (phase 14; dnd-kit gives us a
  head start).
- Authed `/app` e2e walk (gated on magic-link e2e per
  `plan/AUDIT.md`).
- The exec-summary checkpoint UI (phase 7).
