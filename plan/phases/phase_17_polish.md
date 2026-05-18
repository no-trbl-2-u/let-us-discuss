# Phase 17 — Polish (404 + error boundaries + empty-state audit)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

1. **A real 404 page.** `app/not-found.tsx` replaces Next's
   auto-generated fallback with a page that matches the
   bearings voice (in-voice body, dedicated `<title>`, link
   back to `/`). Closes the pending MED critique finding
   from pass 4 (`404 page is bare and inherits the landing
   title`).
2. **Error boundaries.** A root `app/error.tsx` catches
   unhandled runtime errors below the layout; an
   `app/global-error.tsx` catches errors in the layout
   itself (the only place where it's reachable). Both render
   bearings-voice copy + a single retry control + a link
   back to `/`.
3. **Empty-state audit.** Confirm every list-shaped surface
   exposes a polite empty state. `/app/sessions` already
   ships `SessionEmpty`; `/about/personas` ships its own.
   This phase verifies via a vitest snapshot-style check
   (the empty-state copy template from bearings is the
   contract).
4. **Motion-token audit (light).** A unit test enumerates
   the design motion tokens declared in `tokens.css` and
   asserts the three stops + three easings the design brief
   names exist. Catches a future token rename / removal.

This is the last phase before the loop transitions to
`/iterate` per the build plan.

## Prerequisite

Phases 1–16 shipped. The layout exists; `<main id="main">`
landed in phase 14; `Skeleton` + `Heading` + `Link`
primitives are in place.

## Dependencies (operator action required for runtime)

None.

## Routes / endpoints (locked from bearings)

No URL contract additions. New file-system route handlers
that Next.js auto-discovers under `app/`:

- `app/not-found.tsx` — served when `notFound()` is called
  or any URL doesn't match a route.
- `app/error.tsx` — route-segment error boundary; renders
  whenever a child segment throws.
- `app/global-error.tsx` — root error boundary; renders only
  when the layout itself throws (very rare).

These are framework-auto-resolved paths and don't add to
the bearings URL contract.

## Library / helpers (new code)

- `lib/site/empty-state-copy.ts` — exports
  `EMPTY_STATE_TEMPLATE_RE = /No .+ yet — .+\.$/` matching
  the bearings standing decision (*"No <thing> yet — <next
  action>."*). Imported by the empty-state audit test and
  available to any future empty-state surface that wants to
  self-check its copy.
- `lib/site/__tests__/empty-state-copy.test.ts` — asserts
  the regex matches known-good entries and rejects
  obvious violations.

## Components / handlers (new files)

- `components/site/error-boundary.tsx` — single shared
  composition for both `error.tsx` and `global-error.tsx`.
  Renders eyebrow + H1 + lede + retry button + back-to-home
  link. Test colocated.

`error.tsx` and `global-error.tsx` are thin wrappers that
forward props to the shared composition; tests focus on
the composition.

## Cross-links

**In (verify):**

- `app/not-found.tsx` now resolves via the footer-rendered
  `Footer` (already on every layout); the infinite-404-loop
  concern is fully closed (phase 12 closed it for the
  legal links; this phase makes the 404 page itself
  voice-matched).

**Out (ship):**

- 404 + error boundaries link only back to `/`.

**Retro-fit:**

- None. Pure additions.

## SEO / metadata

- `app/not-found.tsx`: `export const metadata = { title:
  'Not found — boardroom', robots: { index: false,
  follow: false } }`. Phase-4 critique flagged the missing
  title; this resolves it.
- Error boundaries don't ship metadata (they render mid-
  navigation; Next.js inherits the parent's metadata).

## Hero / body / sub-section composition

### `app/not-found.tsx` — body locked

```
boardroom · not found
─────────────────────
Not found.

That URL doesn't lead anywhere on boardroom. Here are the
real entry points:

  Go to the landing page →

```

Single-column, max-width 540px. The H1 is `Not found.` per
the in-voice convention (terse + period). The body
paragraph is plain. The single CTA is the bearings `Link`
primitive pointing at `/`.

### `<ErrorBoundary />` — body locked

```
boardroom · something went wrong
─────────────────────────────────
Something went wrong.

The page hit an unexpected error. We logged it; you can
try again, or head back to the landing page.

  Try again              ← Back to /
```

`Try again` is a `<button onClick={reset}>` (Next.js
provides `reset` to error boundary components). `← Back to /`
is the `Link` primitive.

The error's `message` is NOT shown in the UI — keeps the
surface plain and avoids leaking internals.

## Empty / loading / error states

This phase IS the error-state work; no additional empty/
loading copy to lock.

## Decisions made upfront — DO NOT ASK

- **No global retry beyond the "Try again" button.** The
  button calls Next's `reset` which re-renders the segment.
  Beyond that the user reloads. Anything more (e.g. polled
  health-check before retry) is premature.
- **Errors don't render their `message` to the user.**
  Reasoning: spec voice ("plainspoken, terse, no marketing
  fluff") doesn't include exposing stack-trace fragments.
  The error is logged via `logError('client-boundary',
  ...)` (phase 16 helper) so operator can recover the
  message from the drain.
- **`global-error.tsx` lives at the app/ root.** It must
  include its own `<html>` + `<body>` because it replaces
  the root layout entirely when the layout itself throws.
  Locked here so the shape isn't re-litigated.
- **A single `<ErrorBoundary />` composition serves both
  boundaries.** Reason: same copy, same CTAs, same chrome;
  the difference is whether it renders inside the layout
  (`error.tsx`) or replaces it (`global-error.tsx`). The
  composition takes `{ error, reset }` props matching
  Next's error-boundary contract.
- **Per-segment error.tsx is NOT shipped this phase.**
  The root `app/error.tsx` covers every child segment by
  default; per-segment boundaries are needed only when
  the operator wants finer-grained retry UX (e.g. retry
  just the sessions list without re-rendering the header).
  v1 traffic doesn't warrant it; phase candidates can
  re-evaluate.
- **Empty-state audit is a vitest test, not an e2e walk.**
  Reason: the empty states are component-level; verifying
  their copy in a unit test catches regressions faster
  than an e2e roundtrip.
- **Motion-token audit asserts only that the three stops
  + three easings exist** (per design/decisions.md). It
  doesn't enforce that every component uses them — that's
  /critique's job, not a test.
- **The 404 page is rendered as a server component (no
  `'use client'`).** Reason: no interaction; static
  output is faster + cheaper to render. Error boundaries
  must be client components (Next's contract), but the
  shared `<ErrorBoundary />` composition declares
  `'use client'` once for both.
- **Locked 404 H1: `Not found.`** Not `404` (Next's auto
  fallback) and not `That page doesn't exist` (the
  bearings-voice variant). `Not found.` is the
  minimum-information honest version that matches the
  voice cue (terse, period, no marketing).
- **Locked error H1: `Something went wrong.`** Matches
  the in-voice tone of the other landmark pages.
- **No icon / illustration** on either error page. Per
  design decisions: no SaaS dashboard tropes; no
  animated illustrations. Type-only.
- **Locked copy `EMPTY_STATE_TEMPLATE_RE = /No .+ yet —
  .+\.$/`.** Matches the bearings template *"No <thing>
  yet — <next action>."* The dash is an em-dash; the
  regex is permissive enough to accommodate copy variants
  but strict enough to catch obvious drift.
- **The empty-state audit test imports the rendered text
  from existing components**, not the bearings file. Reason:
  the components are the live surface — if the bearings
  doc gets re-worded, the audit shouldn't false-positive
  on a copy that still matches the template.

## Mobile reflow / responsive

Single-column on every viewport. The 404 and error pages
use the same `mx-auto max-w-[540px] px-... py-...` shell
that `/signin` uses, so they look like proper landmark
pages on mobile.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/site/empty-state-copy.ts` | regex matches "No sessions yet — start one on /app."; rejects "No data" (too short) and a missing period | — |
| `lib/site/__tests__/empty-state-audit.test.ts` | render `<SessionEmpty />` + the personas empty branch; assert each rendered string matches `EMPTY_STATE_TEMPLATE_RE` | — |
| `lib/site/__tests__/motion-tokens.test.ts` | parses `design/tokens.css` for motion declarations; asserts `--t-lift`, `--t-settle`, `--t-recede` exist; asserts `--ease-lift`, `--ease-settle`, `--ease-recede` exist | — |
| `components/site/error-boundary.tsx` | renders H1; reset button calls the provided callback; back-link points at `/` | — |
| `app/not-found.tsx` | renders H1; renders the single CTA pointing at `/` | `e2e/not-found.spec.ts`: GET `/this-url-does-not-exist` returns 404 + body contains "Not found" |
| `app/error.tsx` + `app/global-error.tsx` | (Next-managed; no direct unit test possible — covered by the shared composition test) | — |

## Hermetic e2e registration

`e2e/not-found.spec.ts` (new): anonymous; asserts 404
status + voice-matched H1. Desktop + mobile.

## Verify gate

```bash
pnpm verify
```

No new dependencies, no migrations.

## Commit body template

```
feat: polish — phase 17

- app/not-found.tsx: voice-matched 404 page with title
  "Not found — boardroom", H1 "Not found.", in-voice
  body, single CTA to /. Resolves the pass-4 MED critique
  finding on the bare auto-404
- app/error.tsx + app/global-error.tsx: root error
  boundaries; both forward to a shared <ErrorBoundary>
  composition. Renders bearings-voice copy + a "Try
  again" button (calls Next's reset) + a back-to-/ link.
  Error messages are NOT shown in the UI (spec voice;
  logged via logError instead)
- components/site/error-boundary.tsx: shared client
  composition consumed by both error boundary files
- lib/site/empty-state-copy.ts: EMPTY_STATE_TEMPLATE_RE
  matching the bearings standing template; the empty-state
  audit test imports it
- lib/site/__tests__/empty-state-audit.test.ts: renders
  every shipped empty-state surface and asserts the copy
  matches the template — drift trips the gate
- lib/site/__tests__/motion-tokens.test.ts: parses
  design/tokens.css; asserts the three timing + three
  easing tokens declared in design/decisions.md exist
- e2e/not-found.spec.ts: GET /this-url-does-not-exist
  returns 404 with "Not found" body

Decisions:
- No per-segment error.tsx in v1 — root covers all
- Error message not surfaced in UI (logged via logError
  to the drain instead; spec voice)
- 404 H1 locked at "Not found." (period, no fluff)
- Single shared ErrorBoundary composition for both
  error.tsx + global-error.tsx
- Motion-token audit asserts existence, not usage
  enforcement (/critique's job)
- 404 is a server component; error boundaries are
  client components (Next's contract)
- No icon / illustration on either page (design rule)

This is the last phase before the loop transitions to
/iterate.

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 17's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

After ship, the following critique findings can be marked
[x] in `plan/CRITIQUE.md` (or moved to `## Done`):

- `[MED] 404 page is bare and inherits the landing title`
  (pass 4) — closed by this phase.

The next /critique pass will confirm.

## Follow-ups (out of scope this phase)

- **Per-segment error boundaries** for `/app/sessions/*`
  if the granularity matters at higher traffic.
- **Animated transitions on the 404 / error pages** —
  out of scope per design rules; not warranted.
- **`/signin` hidden-input a11y** (pass-4 LOW) — separate
  /iterate fix; framework-injected fields need their own
  investigation.
- **/about/personas "ship via PR" copy leak** (pass-2 MED)
  — /iterate scope, single-sentence change.
- **The full /try MEDs/LOWs cluster** — was filed as
  expand candidate `[3.5] /try polish batch`; oversight
  promotes or /iterate drains naturally.
