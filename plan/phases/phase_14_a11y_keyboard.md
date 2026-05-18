# Phase 14 — A11y + keyboard sweep

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

The boardroom is keyboard-operable end-to-end and screen-reader
legible.

1. **Drag-and-drop has a keyboard equivalent.** Tab to a
   persona on the shelf, Space (or Enter) to pick up, Arrow
   keys to navigate between seats on the table, Space to drop,
   Escape to cancel. dnd-kit's `KeyboardSensor` provides this
   automatically; this phase makes it actually usable by
   fixing the double-`role="button"` bug, adding visible
   focus, and giving screen-reader users the procedure up
   front.
2. **Transcript bubbles are landmarked and announced.** The
   transcript region becomes a `role="log"` live region;
   each `TurnBubble` is already an `<article>` with header,
   so SR users get the persona name + voice on every new
   turn without intervention.
3. **Color contrast is verified.** A vitest test asserts
   every text-on-paper token combination clears WCAG AA
   (≥4.5 for normal text, ≥3 for large/UI text per AA), so
   future token edits can't regress without tripping the
   gate.
4. **Layout has a skip link.** Anonymous and authed pages
   both get a "Skip to main" affordance that becomes visible
   on focus and jumps past the header into `<main>`.

## Prerequisite

Phases 1–13 shipped. `@dnd-kit/core`'s `KeyboardSensor` is
already in the sensor set; `design/primitives/persona-card.tsx`
already declares `role="button"` and `tabIndex={0}` when
`draggable` is true. The layout's `<main>` exists.

## Dependencies (operator action required for runtime)

None.

## Routes / endpoints (locked from bearings)

No new routes. All work is component-level.

## Library / helpers (new code)

- `lib/a11y/wcag-contrast.ts` — pure helper that takes two
  CSS colors (oklch strings or hex), returns the WCAG
  contrast ratio. Tested against published WCAG examples.
- `lib/a11y/__tests__/wcag-contrast.test.ts` — unit tests
  for the helper.
- `lib/a11y/__tests__/token-contrast.test.ts` — applies the
  helper to every text-on-paper combination declared in
  `design/tokens.css` and asserts AA-or-better. Reads the
  token file as a string so a future token rename surfaces
  here instead of hiding in CSS.

## Components / handlers (new + edited)

**New:**

- `components/site/skip-link.tsx` — single anchor `Skip to
  main`. Visually hidden until focused; then occupies a small
  fixed strip at the top of the viewport with the accent CTA
  styling. Tests colocated.
- `components/boardroom/keyboard-instructions.tsx` — a
  visually-hidden `<p id="boardroom-kbd-help">` element
  that documents the keyboard interaction. Referenced by
  `aria-describedby` on the boardroom region. The visible UI
  copy belongs in `boardroom-empty-hint.tsx`; this helper is
  the screen-reader-only twin. Test colocated.

**Edited:**

- `app/layout.tsx` — add `id="main"` to `<main>`; render
  `<SkipLink />` as the first body child.
- `components/boardroom/draggable-persona-card.tsx` — pass
  `draggable={false}` to the inner `<PersonaCard>` so the
  wrapper is the only thing with `role="button"` /
  `tabIndex={0}`. Spread dnd-kit's `attributes` (which
  include `role`, `tabIndex`, `aria-roledescription`,
  `aria-disabled`) on the wrapper. Keep `listeners` on the
  wrapper. Add a focus-visible ring so keyboard users see
  where focus lives.
- `components/boardroom/boardroom-surface.tsx` — wrap the
  table in a section element with
  `aria-label="Boardroom table"` and
  `aria-describedby="boardroom-kbd-help"`. Update
  `DroppableSeat` to set `aria-label` whether the seat is
  empty OR occupied (`"Seat N — empty"` vs
  `"Seat N — <persona name> staffed"`). Add focus-visible
  ring to the seat wrapper for the moment a SR / keyboard
  user navigates to it via dnd-kit. Render the hidden
  `<KeyboardInstructions />` once as a sibling.
- `components/boardroom/live-transcript.tsx` — change the
  outer `<section>` to also carry `role="log"` and
  `aria-live="polite"` so newly-streamed turns are announced
  without re-reading the whole transcript. Keep the existing
  `aria-label`.
- `design/primitives/persona-card.tsx` — when staffed, also
  set `aria-label="<role>: <name> (seated)"` on the
  `<article>` itself (the badge already has its own label,
  but the article is what SRs land on). When non-draggable
  and non-staffed, set `aria-label="<role>: <name>"` so
  reading the seated seat is unambiguous.

Tests for every edited file (extend existing test files
where present).

## Cross-links

**In (verify):**

- Footer + Header keep their existing landmarks
  (`<header>`, `<footer>` from `app/layout.tsx`'s components).

**Out (ship):**

- No new outgoing links from this phase's surfaces.

**Retro-fit:**

- None. All component edits are scoped to the existing
  surfaces.

## SEO / metadata

N/A. No new pages.

## Hero / body / sub-section composition

N/A.

## Empty / loading / error states

The skip link is always-present; visible only on focus. No
empty/loading/error states added.

## Decisions made upfront — DO NOT ASK

- **Skip link target is `#main`.** `<main>` is already the
  semantic landing for the route — no need to invent a
  separate `#content` anchor.
- **Skip link is hardcoded to one href (`#main`), not a list
  of jump targets.** v1 doesn't have side-rail nav; one
  destination is enough. Phase 17 polish can expand if v2
  introduces a left rail.
- **Keyboard instructions copy is the
  literal text below.** Locked here so screen-reader output
  is reviewable from the brief alone:

  > "Drag-and-drop has a keyboard equivalent. Tab to a
  > persona on the shelf, then press Space or Enter to pick
  > it up. Use the arrow keys to choose a seat. Press Space
  > or Enter again to drop. Press Escape at any time to
  > cancel."

- **Visually-hidden style uses the standard `sr-only`
  pattern**, expressed via Tailwind utilities (`absolute
  w-px h-px overflow-hidden clip-[rect(0,0,0,0)] -m-px`
  inlined where used; no `sr-only` Tailwind class because
  the project hasn't shipped one). Locked here to avoid
  duplicate visually-hidden helpers across the codebase.
- **WCAG target is AA, not AAA.** Spec-driven: the audience
  is "indie devs in a hurry," not assistive-tech-primary
  users. AA is the legal baseline + the design palette's
  obvious target. If a token combination fails AA, the
  token gets adjusted (not the threshold).
- **Token contrast test reads `design/tokens.css` as a
  string** and greps the `oklch(...)` declarations under
  the color block. Crude but the tokens file is
  hand-controlled; alternative would be a CSS parser
  dependency that we don't need yet.
- **The contrast helper accepts oklch + hex** (not RGB
  strings) because every token is declared as `oklch(...)`
  and the WCAG formula needs RGB internally. Conversion uses
  the published oklch→sRGB matrix; no new dependency.
- **`--ink-faint` (oklch 62%) on `--paper` (96.5%) is
  expected to FAIL AA for body text** (estimated ratio
  ~3.4:1, below 4.5). The token doc names it as
  "metadata, placeholders" — that's UI text per WCAG, which
  has a lower threshold (3:1 is the AA bar for non-text
  UI; 4.5 for text). Decision: assert ≥4.5 for tokens used
  with `text-base`/`text-md`, ≥3 for tokens documented as
  "metadata, captions, placeholders" (where the design
  intentionally uses them). The test encodes this split.
  If `--ink-faint` ever bumps into a body-text context, the
  test trips.
- **Live region is `role="log"` not `role="status"`** because
  the transcript is a chronological message stream, not a
  short status update. `polite` (not `assertive`) so it
  doesn't interrupt user input — the spec's UX rule (1-word
  answers) keeps interruptions costly.
- **Visible focus ring on draggable/droppable** uses the
  existing `--ring` token (oxidized-red at 0.55 alpha) — no
  new accent. Two-pixel ring + 2px offset matches the
  primitives' existing `focus-visible` style.
- **No `prefers-reduced-motion` audit in this phase.** Phase
  17 polish owns motion sweeps per the build plan; the
  decisions.md motion stops are already conservative
  (three timings, three easings, no page transitions).
- **No automated axe-core run.** It would be valuable but
  adds a heavy dev dep + complicates the verify gate; the
  vitest contrast test + targeted unit tests + the
  keyboard e2e walk give us the load-bearing coverage
  without the runtime cost. Phase 17 can add axe-core if
  the operator wants it.
- **Keyboard e2e walk runs desktop-only** (same reasoning
  as phase 13's contract walker): the keyboard interaction
  surface is identical between desktop and mobile chromium,
  and mobile keyboards aren't representative of the
  assistive-tech path anyway.
- **The drag-end test uses dnd-kit's built-in
  `data-dndkit-collision-id` / event sequence** via
  `page.keyboard.press` — no programmatic dnd-kit API
  reach-through. If the e2e proves flaky (timing on
  KeyboardSensor's announcement), the spec is the canary
  for a dnd-kit upgrade discussion, not something to mute.

## Mobile reflow / responsive

Skip link is hidden on small viewports too — it appears on
focus regardless of viewport. The keyboard-instructions
element is invisible everywhere. No new visible UI; no
reflow concerns.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/a11y/wcag-contrast.ts` | published WCAG sample pairs (≥6 known ratios round-trip within 0.01) | — |
| `lib/a11y/token-contrast.test.ts` | each `oklch(...)` token paired with the appropriate paper token clears the bar (4.5 for body tokens, 3 for metadata tokens) | — |
| `components/site/skip-link.tsx` | renders an anchor with `href="#main"`; visually-hidden classes present | `e2e/skip-link.spec.ts`: tab focuses the link; pressing Enter changes `window.location.hash` to `#main` |
| `components/boardroom/keyboard-instructions.tsx` | renders the locked copy; element id matches the boardroom region's `aria-describedby` | — |
| `components/boardroom/draggable-persona-card.tsx` | wrapper has one `role="button"` (not two); inner card lacks button role; focus-visible class present | — |
| `components/boardroom/boardroom-surface.tsx` | empty seat aria-label `Seat N — empty`; staffed seat aria-label `Seat N — <name> staffed`; `aria-describedby` points at the keyboard-instructions id | — |
| `components/boardroom/live-transcript.tsx` | outer section has `role="log"` + `aria-live="polite"` | — |
| `design/primitives/persona-card.tsx` | when `state="staffed"`, the article has `aria-label` matching `<role>: <name> (seated)` | — |
| `app/layout.tsx` | renders the skip link as the first child of `<body>`; `<main>` has `id="main"` | — |
| Keyboard DnD walk | — | `e2e/board-keyboard.spec.ts`: on `/app` redirected to `/signin` (no auth); fall back to `/try` where the demo board renders; tab to Product Lead card; press Space; press ArrowRight a few times; press Space — assert a seat now reads "staffed" via accessibility tree |

## Hermetic e2e registration

Two new specs:

- `e2e/skip-link.spec.ts` — anonymous, all viewports.
- `e2e/board-keyboard.spec.ts` — anonymous, desktop-only (per
  the decision above). Walks `/try` where the demo is
  pre-staffed with one persona on a 6-seat table; the test
  exercises the persona shelf's tab order, then verifies the
  keyboard pick-up/drop flow does not throw.

  Note: `/try` pre-staffs the Product Lead and the remaining
  5 seats are "demo locked" (per pass-4 critique). The
  keyboard test asserts that focus moves through the
  shelf-side draggable AND lands on the locked seats with
  the correct `aria-label`, without actually swapping —
  swapping is the authed-board behavior, which isn't
  reachable in the hermetic gate. Phase 14's scope is
  keyboard discoverability + correct ARIA semantics; the
  actual drag completion happens in the operator-gated
  authed walk if/when Mailosaur is wired.

## Verify gate

```bash
pnpm verify
```

No new dependencies. Two new lib files, two new components,
edits to four existing components + the layout.

## Commit body template

```
feat: a11y + keyboard sweep — phase 14

- components/site/skip-link.tsx: visually-hidden anchor that
  surfaces on focus, jumps to #main. Rendered as the first
  body child in app/layout.tsx; <main> gains id="main"
- components/boardroom/keyboard-instructions.tsx: visually-
  hidden screen-reader procedure for the dnd-kit Keyboard
  Sensor's pick-up/move/drop flow; referenced by the
  boardroom region via aria-describedby
- components/boardroom/draggable-persona-card.tsx: fix
  double-button bug (the wrapper div had dnd-kit's
  role="button" + tabIndex AND inner PersonaCard had its
  own); inner card now non-draggable, wrapper is the
  focusable surface; visible focus ring added
- components/boardroom/boardroom-surface.tsx: aria-label
  on every seat (empty and staffed); region gains
  aria-describedby pointing at the keyboard-instructions
  element; visible focus ring on droppable seats
- components/boardroom/live-transcript.tsx: outer section
  gains role="log" + aria-live="polite" so streamed turns
  announce without re-reading the whole transcript
- design/primitives/persona-card.tsx: aria-label on the
  article when staffed or non-draggable so SR users hear
  the persona identity without focusing the badge
- lib/a11y/wcag-contrast.ts + tests: oklch-aware contrast
  helper validated against published WCAG sample pairs
- lib/a11y/__tests__/token-contrast.test.ts: every text-on-
  paper token combination clears AA (4.5 for body tokens,
  3 for metadata tokens); a future token bump that breaks
  the bar trips this gate before the e2e leg
- e2e/skip-link.spec.ts: anonymous; tab from page start
  focuses the skip link; Enter jumps to #main
- e2e/board-keyboard.spec.ts: desktop-only; walks the
  /try board's shelf + seat aria-labels via the
  accessibility tree, asserts no axe-relevant double-role
  bugs

Decisions:
- WCAG target is AA, not AAA (spec-driven: audience is
  not assistive-tech-primary)
- --ink-faint allowed below 4.5 only for metadata/caption
  tokens; the test encodes the split via doc comments
- Live region is role="log" + polite (chronological stream,
  doesn't interrupt user input)
- No axe-core in this phase (avoid heavy dev dep; targeted
  unit + e2e cover the load-bearing surfaces)
- No prefers-reduced-motion audit (phase 17 polish owns
  motion sweeps)
- Keyboard e2e is desktop-only (same reasoning as phase 13)

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 14's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

After ship, the following critique findings can be marked
[x] in `plan/CRITIQUE.md`:

- `[LOW] /signin — unlabeled hidden inputs surface to
  assistive tech` (pass 4) — partially overlaps; the framework-
  injected fields aren't this phase's scope, but a Header
  + main + footer landmark sweep narrows where the issue
  is reachable from. Document the partial overlap in the
  commit; do not auto-close.

The next /critique pass will confirm.

## Follow-ups (out of scope this phase)

- **axe-core in CI** — phase 17 polish if the operator
  wants automated SR + a11y rule coverage.
- **Dark-mode contrast audit** — `design/decisions.md`
  open Q. Token-contrast test is light-mode only.
- **Reduced-motion support** — phase 17 motion sweep per
  the build plan.
- **Authed keyboard DnD walk** — needs Mailosaur; surfaces
  as an [operator] AUDIT.md row if/when the operator wires
  the inbox.
- **`/signin` hidden-input a11y** — separate /iterate fix
  (root cause likely framework-injected; needs its own
  investigation).
