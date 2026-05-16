# Phase 5 — Boardroom canonical surface (CANONICAL SIBLING)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body. **This phase establishes the canonical structure every
> later in-app feature surface mirrors.** Spend extra care
> here. Budget 2x of a typical phase.
>
> Rename this file to `phase_5_boardroom_canonical.md` at ship
> time and link it from `plan/steps/01_build_plan.md`.

> **/oversight 2026-05-16 inputs (apply on next /plan-a-phase
> refresh):**
>
> 1. **DnD library:** pin `@dnd-kit/core` + `@dnd-kit/sortable`
>    rather than native HTML5 (overrides the existing brief's
>    "native HTML5" decision below). Reason: dnd-kit ships
>    keyboard-equivalent semantics out of the box, which means
>    phase 14's a11y sweep becomes a verification pass rather
>    than a rewrite. Bundle cost accepted.
> 2. **Refresh against design v1.** The design tree at `design/`
>    now ships `boardroom-table.tsx` + draggable `persona-card.tsx`
>    + `turn-bubble.tsx` primitives. The refreshed brief should
>    reference these explicitly instead of working defaults.
> 3. **Approach:** dry-run brief refresh first (separate commit
>    `phases: brief for phase 5 — boardroom canonical`); code
>    ships on the following /march tick.

## Routes / endpoints / CLI surface (locked in `bearings.md`)

- `/app` — the authenticated boardroom session entry. Empty,
  staffed, ready, running states.

This phase ships the *shell* of `/app`. The actual session
runtime (`/api/sessions` streaming, multi-persona conferring)
ships in phases 6–7. State machine for `/app` covered here so
phases 6+ slot in.

## Content / data reads

| Helper | Lookup | Use |
|---|---|---|
| `getCurrentUser()` | `lib/supabase/server.ts` | Gate `/app` server-side; redirect to `/signin` if anonymous |
| `loadPersonaLibrary()` | `lib/personas/load.ts` (shipped phase 4) | Read all personas from `personas/` for the side panel |
| `useBoardState()` | `components/boardroom/use-board-state.ts` | Client-side reducer: staffed personas, pitch text, session phase |

Persistence in phase 5: URL params (which personas are staffed)
+ `sessionStorage` (the typed pitch). Phase 6 introduces DB
persistence for authed users.

## Components / handlers (in `components/boardroom/`)

- `board.tsx` — the drop-target. Receives a list of staffed
  persona ids and renders the "table." Three visual states:
  `empty`, `staffed`, `running`.
- `persona-card.tsx` — the draggable card. Consumes
  `design/primitives/persona-card.tsx` if present; otherwise
  renders a working-default card. Two states: `at-rest` (in
  the side panel) and `seated` (on the table).
- `persona-shelf.tsx` — the side panel listing the persona
  library. Filters: by role; later phases extend.
- `pitch-input.tsx` — the multiline pitch entry. Hardline
  validates length (min 1 word, max ~600 words to stay within
  the moderation API window).
- `start-session-button.tsx` — disabled until 2+ personas are
  seated AND pitch length > min. On click, transitions state
  machine into `running`. In phase 5, "running" just shows a
  placeholder transcript area; phase 7 wires real streaming.

Pure helpers and their tests live in
`components/boardroom/__tests__/`. Keep each component file
single-purpose; bias to splitting (5 small > 1 dense).

## Cross-links

**In** (already shipped — verify still wired):
- Phase 3 middleware gates `/app/*` for authed users.
- Phase 4 `personas/` validated by `pnpm data:validate`.
- Phase 4 `/about/personas` route reads from the same loader;
  this phase must not duplicate the loader.

**Out** (this phase ships these):
- Hook points (events / props) the phase-6 demo loop will
  consume: `onStartSession`, `onPersonaSeated`,
  `onPersonaUnseated`.

## SEO / metadata / output schema

`/app` is authenticated; emit `<meta name="robots" content="noindex">`
and a `generateMetadata()` returning a terse title
("Boardroom — session"). No JSON-LD; not a content surface.

## Hero / body / sub-section composition

```
<AuthedShell>                          # phase 3 component
  <BoardroomLayout>                    # two-column at md+, stacked at sm
    <PersonaShelf personas={library} /> # left, scrollable
    <Board state={state}>              # right, main attention area
      <SeatedPersonas .../>
      <PitchInput .../>
      <StartSessionButton .../>
      <TranscriptArea placeholder />   # phase 7 fills this
    </Board>
  </BoardroomLayout>
</AuthedShell>
```

## Empty / loading / error states

- **Empty** (no personas seated): a hint line — *"Drag two or
  more personas onto the table to start."* Plus a low-emphasis
  example illustration if the design system has one.
- **Loading** (persona library): skeleton blocks for each
  expected card slot in the shelf.
- **Error** (persona library fails to load): mono error block
  with a retry button. Never silently retry.

## Decisions made upfront — DO NOT ASK

- Drag-and-drop library: native HTML5 DnD via React state, no
  external library at v1. (`react-dnd` and `dnd-kit` both have
  a11y stories; we'll evaluate one in phase 14 when the
  keyboard sweep happens. For phase 5, native DnD + a
  documented `[needs-a11y]` row in `plan/AUDIT.md` is
  acceptable.)
- Maximum personas seated: 6. Hard-coded constant in
  `lib/limits.ts` (renamed `config/limits.ts` when phase 9
  consolidates limits).
- Minimum personas to start: 2. Same file.
- Pitch length: min 1 word, max ~600 words (clientside
  enforcement only in phase 5; server-side enforcement lands
  with phase 7's API).
- State machine: implemented as a useReducer with discriminated
  union states (`'empty' | 'staffed' | 'ready' | 'running'`).
  Transitions: `staffed → ready` when both personas-min and
  pitch-min satisfied; `ready → running` on `onStartSession`;
  `running` is terminal in phase 5.
- `running` placeholder shows a "Session shipped in phase 7."
  card so manual testing of phase 5 is honest about state.
- No undo for drag-and-drop in phase 5. Re-drag handles it.
- Component file naming: `kebab-case.tsx`. Test names match
  source with `.test.tsx`.

A brief that leaves Open Qs is a brief that fails its job.

## Mobile reflow / responsive

- Below `md`: the persona shelf collapses into a horizontal
  scrollable strip *above* the board. Drag-and-drop becomes a
  tap-to-pick / tap-to-place affordance (we don't simulate
  drag on touch in phase 5; document the limitation).
- The pitch input grows to full width; the start button is
  sticky-bottom.
- Transcript area scrolls within its own container so the
  pitch + board stay visible during phase 7.

## Pages × tests matrix

| Page / surface | Unit tests | E2E |
|---|---|---|
| `/app` empty | reducer transitions; component a11y roles | walks signed-in user; asserts empty hint copy |
| `/app` staffed | drag/drop seat + unseat actions; start-button disabled | seats 2 personas; asserts ready state and enabled button |
| `/app` running | reducer terminal state; placeholder copy | clicks start; asserts placeholder card visible |

## Hermetic e2e registration (every page family does this)

Phase 1 shipped the harness shape. This phase appends an
entry to `e2e/fixtures/page-reads.ts` (created in phase 13's
smoke walker; until then, the e2e specs above ARE the
registration):

```ts
export const pageReads: PageReads = {
  '/app': {
    sample: '(authed default)',
    assertions: [
      'renders H1',
      'renders persona shelf',
      'renders board',
      'no console errors',
      '375px viewport: persona shelf scrolls horizontally; board stacks below',
    ],
  },
}
```

## Verify gate

```bash
pnpm verify
```

All checks must pass before commit.

## Commit body template

```
feat: boardroom canonical surface — phase 5

- Drag-and-drop board at /app
- persona-card, persona-shelf, board, pitch-input,
  start-session-button primitives
- useReducer state machine (empty / staffed / ready / running)
- Native HTML5 DnD; a11y row filed in plan/AUDIT.md (phase 14)
- /app/running placeholder until phase 7

Canonical sibling for every later authed feature surface.

Decisions:
- Max seated personas: 6; min: 2; pitch max: ~600 words
- Native DnD; library evaluation deferred to phase 14
- Mobile: shelf becomes horizontal strip; tap-to-place
```

## DoD

Flip Phase 5's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash, add to
"Phase log".

## Confirm deploy

```bash
pnpm deploy:check
```

## Follow-ups (out of scope this phase)

- The actual session runtime (phases 6, 7).
- DB persistence of board state for authed users (phase 6).
- Keyboard-equivalent drag-and-drop (phase 14).
- Touch-drag simulation (phase 14 if it ships in scope).
