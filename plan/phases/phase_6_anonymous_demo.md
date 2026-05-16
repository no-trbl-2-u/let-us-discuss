# Phase 6 — Anonymous demo loop (`/try`)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.
>
> Drafted via `/plan-a-phase` on 2026-05-16 against:
> - phase 5 brief (canonical sibling — `phase_5_boardroom_canonical.md`)
> - design v1 (commit `76c9338`) — TurnBubble + ArtifactTile
>   primitives light up here for the first time
> - bearings.md L88–100 (Identity tiers: anonymous can run
>   one short capped demo session)
> - spec.md L130–142 + L150–156 (capped, sessionStorage only,
>   no download, demo cap exists "to let the persona *feel*
>   the loop before paying with their email")
> - phase-9's per-IP rate-limit is intentionally **out of
>   scope** here; phase 6 ships the demo loop, phase 9 lands
>   the cap.

## Outcome

`/try` renders a **one-persona, one-shot, canned** demo of the
boardroom loop end-to-end. Product-lead is pre-staffed; the
user types a short pitch; clicking "Start demo" plays a
3-turn canned transcript through `TurnBubble` (with the
thinking-dot affordance between turns) and reveals
artifact-tile previews with downloads disabled. A persistent
"sign in to keep going" CTA lands at the end, gated on the
demo having actually been played. State lives in
`sessionStorage`; once the demo enters `done`, a second visit
in the same browser session lands directly on the "demo
already used" state — that's the v1 cap. Per-IP throttling
ships in phase 9.

This phase carries the smoke-test responsibility: a fresh
visitor with no account can walk the entire user-visible
session lifecycle (pitch → confer → exec-summary →
artifacts) on a single page, without an AI call, in under a
minute. **No real AI usage in this phase** — the canned
transcript lives in `lib/demo/canned-session.ts`.

## Routes / endpoints (locked in `bearings.md`)

- `/try` — public, anonymous. The route ships in this phase.
- Retro-fit: `components/site/landing-hero.tsx` "Try a demo
  session" CTA is currently disabled with a "Coming in v1"
  title. Enable it and link to `/try` as part of the same
  phase commit.

No new endpoints. No server actions. **No** API calls. The
demo runs entirely client-side off a single TS module.

## Content / data reads

| Helper | Lookup | Use |
|---|---|---|
| `loadPersonas()` | `lib/personas/load.ts` (phase 4) | Server-load the single demo persona by slug (`product-lead`); pass it through to the client. The full list is intentionally not surfaced — the demo's single-persona constraint is part of its honesty. |
| `loadDefaultTemplate()` | `lib/templates/load.ts` (phase 4) | Reads the `pitch-to-spec` template so the canned transcript's phase names (`Clarify` / `Confer` / `Executive summary`) match the real template. |
| `DEMO_PITCH_WORDS` / `DEMO_TURN_COUNT` / `DEMO_AUTO_ADVANCE_MS` | `lib/limits.ts` (extend) | Pitch cap (100), canned-transcript length (3 turns), per-turn auto-advance delay (2200ms). All exported so the test matrix can read them. |
| `cannedSession` | `lib/demo/canned-session.ts` (new) | The 3-turn transcript + 3 artifact previews. Hard-coded in TS, frontmatter-style annotations so future operators can swap. |

No new Zod schemas (the demo content is hard-coded TS, not
data-layer content). `personas/` and `templates/` schemas
unchanged.

## Components / handlers (in `components/demo/`)

Mirrors phase 5's `components/boardroom/` shape so phase 7+
authed surfaces can keep using the canonical pattern. Reuse
phase 5's primitives where appropriate; do NOT refactor
phase 5 code in this phase (any refactor lands as a
follow-up phase or `/iterate` finding).

- `try-board.tsx` — server-aware wrapper. Reads the persona
  + template on the server; hands them to a thin client
  island. Parallels `components/boardroom/board.tsx`.
- `try-client.tsx` — `'use client'`. The demo reducer +
  effect-driven canned-turn reveal live here. Composes
  children below. Parallels `board-client.tsx`. No
  `DndContext` — the demo persona is pre-seated.
- `demo-shelf.tsx` — left column. Single non-draggable
  `PersonaCard` (`state="staffed"`) with a small eyebrow
  "demo · 1 persona". A "want all four?" caption underneath
  links to `/signin?next=/app`.
- `demo-surface.tsx` — main column. Renders a single
  seat-on-table at canonical position `t=0` (top center)
  with product-lead staffed. The 5 other seats render
  greyed-out and labelled "demo · seat locked" — the
  metaphor: the user can see the rest of the table is
  there, but it's not available without signing in.
- `demo-pitch-input.tsx` — wraps phase 5's `PitchInput` with
  a smaller `max` (`DEMO_PITCH_WORDS = 100`). Phase 5's
  component already accepts the configured cap; the wrapper
  exists for clarity and to keep the demo's seam visible.
  (Implementation detail: phase 5's `PitchInput` reads
  `MAX_PITCH_WORDS` from `lib/limits.ts` directly; refactor
  it in this phase to accept the cap via prop with the
  module constant as the default. Add a single test that
  the new prop is honored.)
- `demo-start-button.tsx` — uses the design `Button`
  primitive (`variant="primary"`). Disabled until the demo
  is in `ready` state (pitch has ≥1 word).
- `demo-transcript.tsx` — renders the canned turns through
  the design `TurnBubble` primitive. Drives the thinking →
  streaming → settled animation off the reducer's
  `revealIndex` state. Auto-advance is timer-driven; the
  user can press "Skip animation" to jump to the end.
- `demo-artifact-preview.tsx` — three design `ArtifactTile`
  primitives showing artifact titles only. `downloadable={false}`
  with hover/focus tooltip "Sign in to download." Renders
  only in the `done` state.
- `demo-cta.tsx` — the post-demo banner. Renders only in
  `done`. Says: *"You've seen the shape. Sign in to run
  yours with all four personas, real AI, and downloadable
  artifacts."* Single primary `Button` link to
  `/signin?next=/app`.
- `demo-already-used.tsx` — full-page state for the second
  visit. Renders when `sessionStorage` shows the demo was
  used. Same CTA as `demo-cta.tsx`, plus a small "or refresh
  the tab to retry" honesty caption (sessionStorage clears
  on tab close).
- `use-demo-state.ts` — `useReducer` over the discriminated
  union state machine. Pure logic; tests in `__tests__/`.
- `use-demo-persistence.ts` — wires `sessionStorage` to the
  reducer. Keys: `boardroom:demo-pitch`, `boardroom:demo-state`
  (only `done` / `not-done`). The pitch persists across the
  same-tab refresh; the `done` flag is the cap.

Pure helpers + their tests sit in
`components/demo/__tests__/`. Keep each component file
single-purpose; bias to splitting (5 small > 1 dense).

## Cross-links

**In** (already shipped — verify still wired):
- Phase 4 `loadPersonas()` + `loadDefaultTemplate()` continue
  to be the canonical readers. The demo filters to one
  persona but does not duplicate the loader.
- Phase 5 `components/boardroom/PitchInput` is reused (with
  the prop-cap refactor noted above). Phase 5 `lib/limits.ts`
  is extended (additions, not edits) with demo-specific
  constants.
- Visual system v1 tokens + `Button` / `Card` / `Heading` /
  `Link` / `PersonaCard` / `ArtifactTile` / `TurnBubble`
  primitives.

**Out** (this phase ships these):
- The shape of the canned-session module — phase 7 may
  produce a small adapter so an in-progress real session can
  render through the same `Transcript` component family.
- The "demo-used" sessionStorage flag — phase 9 reads it as
  one signal for its per-IP throttle; not part of the
  throttle itself.

**Retro-fit**:
- `components/site/landing-hero.tsx`: enable the "Try a demo
  session" CTA, link to `/try`, drop the "Coming in v1"
  title attr.
- `components/site/footer.tsx`: add a "Try a demo" link in
  whatever nav slot already exists, if there's one (if the
  footer is link-free, skip; the brief does not invent a
  nav structure).

## SEO / metadata

`/try` is public — set:

- `title`: "Try a boardroom demo — let-us-discuss"
- `description`: "One short, AI-free walkthrough of the
  boardroom session. No account; nothing saved."
- `robots`: index, follow.
- JSON-LD: `WebPage` with `name`, `description`. No `ItemList`
  (single page, not a feed).

## Hero / body / sub-section composition

```
<MarketingShell>                              # the same layout / / about uses (Header + Footer)
  <section className="mx-auto max-w-[1080px] …">
    <header>
      <Eyebrow>boardroom · try the demo</Eyebrow>
      <Heading level={1}>See the shape in under a minute.</Heading>
      <p className="lede">One persona, three canned turns, three artifact tiles. Real sessions sign in.</p>
    </header>

    <DemoBoard />                             # try-client.tsx
  </section>
</MarketingShell>
```

`DemoBoard` lays out as two columns at `md+` (shelf +
surface column), single column below.

When `state.tag === 'done'`:
- `DemoSurface` collapses to its "session settled" form (rail
  visible but soft, all 6 seats faintly visible).
- `DemoTranscript` becomes a static list of the three turns.
- `DemoArtifactPreview` renders below the transcript.
- `DemoCTA` is the last visible band.

When the visitor lands with `sessionStorage:
boardroom:demo-used === '1'`, the entire `DemoBoard` swaps
to `DemoAlreadyUsed`. The page chrome (header, footer,
heading) does not change — only the body slot.

## Empty / loading / error states

- **Empty (initial visit, no pitch typed):** the demo
  surface shows product-lead in seat 0 (staffed) and the
  other 5 seats in their `locked` decoration. The pitch
  input is the focal point with placeholder *"What are you
  trying to ship, and for whom? (≤ 100 words.)"*. Start
  button is disabled.
- **Ready (pitch typed):** Start button enables; eyebrow
  copy gains "ready to start" affordance.
- **Running:** `DemoTranscript` mounts; canned turns reveal
  with the `TurnBubble` thinking → settled animation. Skip
  button visible.
- **Done:** transcript settled, artifact previews + CTA
  render.
- **Demo-already-used:** single full-width `Card` with the
  cap message + sign-in CTA + the "refresh the tab to
  retry" caption.
- **Persona load throws / template missing:** Next.js
  default error boundary (route segment). `data:validate`
  catches malformed persona / template at CI; production
  should never see this.

## Decisions made upfront — DO NOT ASK

- **Demo persona:** `product-lead` (only). Rationale: it is
  the singular "lead" persona that anchors every real
  session in the canonical template; surfacing only the
  lead in the demo sets the right expectation that real
  sessions add the specialists.
- **Number of canned turns:** 3 (one Clarify question, one
  Confer reply, one Executive-summary line). The turn
  count matches `DEMO_TURN_COUNT` so the test matrix can
  assert it.
- **Canned transcript content:** generic, pitch-agnostic.
  The transcript renders *next to* the user's pitch but does
  NOT reference it textually — that would be uncanny without
  real AI. Eyebrow text on the transcript says "preview of
  shape — your real session will respond to your pitch."
- **Auto-advance vs click-through:** auto-advance every
  2200ms (`DEMO_AUTO_ADVANCE_MS`), with a visible "Skip
  animation" affordance. No "next turn" button — that would
  feel like a tutorial.
- **Token / turn cap surfacing:** an eyebrow on the demo
  Card reads "demo · 3 turns, one persona, no AI calls" so
  the constraint is honest, not hidden.
- **Per-tab cap:** sessionStorage flag
  `boardroom:demo-used = '1'` set on `RUN_COMPLETE` action.
  Second visit in same tab lands on `DemoAlreadyUsed`.
  Closing the tab clears it. Per-IP / per-day limits ship
  in phase 9; this phase does not pretend to throttle.
- **Pitch cap:** `DEMO_PITCH_WORDS = 100`. Lower than the
  real session's 600 to keep the demo feel honest.
- **Demo-surface seats:** all 6 seats render at canonical
  positions; seat 0 is staffed (product-lead, non-draggable);
  seats 1–5 render with the `seat <n>` empty-state visual
  PLUS a small mono caption "demo · seat locked". On hover,
  the cursor is `not-allowed`. They do NOT use `useDroppable`
  (this is not a DnD surface).
- **Pitch input refactor:** phase 5's `PitchInput` is
  extended to accept an optional `max` prop. The existing
  `MAX_PITCH_WORDS` constant remains the default. Phase 5
  unit tests are updated where they assert the cap value
  — switch to assertions that reference the resolved cap
  via the rendered counter, not the constant directly.
  This is the only phase-5 path edited in phase 6.
- **State machine:**
  ```
  type State =
    | { tag: 'empty';   pitch: '' }
    | { tag: 'ready';   pitch: string }
    | { tag: 'running'; pitch: string; revealIndex: number }
    | { tag: 'done';    pitch: string }
  ```
  Transitions:
  - `empty → ready` on first non-empty pitch word.
  - `ready → empty` on cleared pitch.
  - `ready → running` on `START` action; `revealIndex = 0`.
  - `running → running` on `ADVANCE`; `revealIndex += 1`.
  - `running → done` on `ADVANCE` when `revealIndex + 1 ===
    DEMO_TURN_COUNT`, OR on `SKIP` action.
  - `done → ready` is not exposed (no re-run within the
    same tab; sessionStorage carries `done` across reloads).
  - `RESET` is wired but not exposed in UI — the helper
    exists so /iterate can later add a "reset" link if the
    posture changes.
- **Component file naming:** `kebab-case.tsx`. Test names
  match source with `.test.tsx`. Tests colocated in
  `components/demo/__tests__/`.
- **Mobile pattern:** below `md`, the shelf collapses to a
  single horizontal card above the surface. The surface
  itself uses the same `aspect-[880/520]` scale phase 5
  established. Transcript and artifact tiles stack
  vertically full-width.

A brief that leaves Open Qs is a brief that fails its job.

## Mobile reflow / responsive

- Below `md` (768px): single column. Shelf above (single
  card), surface, pitch, start, transcript + artifacts stack
  vertically full-width.
- 375px viewport must reflow without horizontal scroll
  (`scrollWidth - innerWidth ≤ 1`).
- `TurnBubble` already lays out fluidly (44px gutter +
  min-w-0 body). No tweaks needed.
- `ArtifactTile`: render in a single column at `< md`,
  3-column row at `md+`.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `use-demo-state.ts` (reducer) | empty → ready; ready → running; running → running on ADVANCE; running → done on final ADVANCE; running → done on SKIP; once done, ADVANCE is no-op; HYDRATE from sessionStorage | — |
| `use-demo-persistence.ts` | pitch round-trip; demo-used flag set on done; flag read on init | — |
| `demo-shelf.tsx` | renders product-lead with `state="staffed"`; no other personas rendered | — |
| `demo-surface.tsx` | renders 6 seats; seat 0 occupied; seats 1–5 carry `demo · seat locked` and are not droppable (no useDroppable in tree); table state attribute matches state.tag (empty/seated/active) | — |
| `demo-pitch-input.tsx` (and the underlying `PitchInput` refactor) | renders with `max=100`; word counter shows 100 cap; aria-invalid at cap | — |
| `demo-start-button.tsx` | disabled when not ready; enabled in ready; fires onStart | — |
| `demo-transcript.tsx` | renders 0 turns when revealIndex is undefined; renders `revealIndex+1` turns when set; renders `TurnBubble thinking` for the in-flight turn during a brief settle window; SKIP collapses to all-settled | — |
| `demo-artifact-preview.tsx` | renders 3 `ArtifactTile`s; downloadable=false; titles match canned-session.ts | — |
| `demo-cta.tsx` | renders only in done state; sign-in link points to /signin?next=/app | — |
| `demo-already-used.tsx` | renders when localStorage flag set | — |
| `/try` (page) | calls `loadPersonas`; renders demo board; sets the expected title; JSON-LD WebPage emitted | `/try` renders without console errors; "Try a demo session" header from landing reaches /try via click; 375px reflow |
| Landing retro-fit | E2E updates: the existing landing test "Try-a-demo CTA is disabled until phase 6" flips assertion: CTA is enabled, has `href="/try"`, no `title="Coming in v1…"` | new spec or update existing |

The phase-5 brief left `/app` authed-walk as a follow-up
gated on magic-link e2e creds. **Phase 6's `/try` is
anonymous**, so a real E2E walks it without auth — that's
table-stakes for this phase.

## Hermetic e2e registration

Phase 6 adds `e2e/try.spec.ts`:
- `/try` renders the demo board; "Start demo" disabled
  initially.
- Typing a pitch enables "Start demo".
- Clicking "Skip animation" jumps straight to `done`; the 3
  artifact previews render; CTA points to `/signin?next=/app`.
- Reload of `/try` in the same context (sessionStorage
  retained) lands on `demo-already-used`.
- 375px reflow assertion (mobile project picks this up
  automatically).

Phase 6 updates `e2e/landing.spec.ts`:
- The existing assertion that "Try a demo session" is
  disabled flips to: the CTA is enabled and links to
  `/try`.

## Verify gate

```bash
pnpm verify
```

All checks pass before commit.

## Commit body template

```
feat: anonymous demo loop — phase 6

- /try renders the canonical-sibling shape with one
  pre-seated persona (product-lead), pitch input, and a
  canned 3-turn transcript that settles to artifact-tile
  previews + sign-in CTA
- design v1 primitives consumed for the first time:
  TurnBubble (thinking → settled), ArtifactTile
  (downloadable=false)
- sessionStorage carries pitch + the one-tab demo cap
  (boardroom:demo-used); phase 9 lands per-IP throttling
- Landing retro-fit: "Try a demo session" CTA enabled,
  links to /try; existing landing e2e assertion flips
- components/boardroom/PitchInput refactored to accept an
  optional `max` prop (default unchanged) so demo can use
  the smaller DEMO_PITCH_WORDS cap without forking
- No AI calls in this phase. Canned transcript lives in
  lib/demo/canned-session.ts; phase 7 wires the real
  /api/sessions

Decisions:
- One demo persona (product-lead) — sets expectation that
  real sessions add specialists
- 3 canned turns (Clarify / Confer / Exec-summary); auto-
  advance 2200ms with Skip button
- sessionStorage cap is the v1 demo cap; per-IP is phase 9
- Demo cannot reference the user's pitch (uncanny without
  real AI); eyebrow says "preview of shape"

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 6's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash, add to
"Phase log".

## Follow-ups (out of scope this phase)

- Per-IP rate limit on the anonymous demo (phase 9).
- Real `/api/sessions` streaming + actual AI calls (phase 7).
- Real-pitch-responsive canned content (won't be canned then).
- A11y verification of `TurnBubble` thinking dots in
  assistive-tech (phase 14).
- Localized canned-session content (post-v1).
