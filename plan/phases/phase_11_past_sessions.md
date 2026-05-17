# Phase 11 — Past-session surface

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

Three new authed pages land, per the bearings URL contract:

1. **`/app/sessions`** — list of the signed-in user's past
   sessions. Most-recent first; no pagination in v1 (per
   bearings standing decision: "session list is short by
   definition"; if a user actually hits the daily quota cap
   every day for a year that's 3,650 rows and we'll add
   pagination then). Empty state per the standing template:
   *"No sessions yet — start one on /app."*
2. **`/app/sessions/[id]`** — past-session results page.
   Renders the same `ArtifactPreviewGrid` shape the live `/app`
   uses when a session ends; re-download is the phase-10
   helper.
3. **`/app/sessions/[id]/transcript`** — full transcript view.
   `LiveTranscript` (phase 7b primitive) rendered against the
   persisted `turns` rows for the session.

All three pages are gated by `requireUser()`. RLS already
pins each row to the owning user, so the queries are simple
filtered selects — no extra ownership check in the handler.

## Prerequisite

Phases 7a + 7b + 10 shipped. The DB tables (`sessions`,
`turns`, `artifacts`) carry the data; `LiveTranscript`,
`ArtifactPreviewGrid`, and the `downloadArtifact` helper are
the primitives.

## Dependencies (operator action required for runtime)

None. Reads only; uses the existing migrations + env.

## Routes / endpoints (locked from bearings)

- `/app/sessions` — Next App Router server component
  (`app/app/sessions/page.tsx`). Loads via Supabase server
  client; returns the list.
- `/app/sessions/[id]` — server component. Loads the session
  row, the artifact row (may be null for sessions that ended
  early or aborted), and the turn count. 404 if the session
  isn't owned by the caller (RLS will return null; surface as
  notFound()).
- `/app/sessions/[id]/transcript` — server component. Loads
  the session row + all turns ordered by `idx`. Same 404
  semantics.

No new API routes.

## Library / helpers (new code)

- `lib/sessions/queries.ts` — server-only reader helpers:
  - `listSessions(supabase, userId)` → most-recent-first
    metadata only (id, status, total_tokens, created_at,
    pitch first 80 chars, template_slug, persona_slugs).
  - `loadSession(supabase, userId, id)` → full row + artifact
    + `turnCount`. Returns `null` when the row doesn't exist
    or RLS hides it.
  - `loadTranscript(supabase, userId, id)` → session row +
    `turns` array ordered by idx. Returns `null` likewise.
- `lib/sessions/__tests__/queries.test.ts` — mock the Supabase
  client; assert the SQL shapes + ordering + RLS-null
  handling.

## Components / handlers (new files under `components/sessions/`)

- `components/sessions/session-list.tsx` — server-friendly
  component that takes the list output and renders a stack
  of `SessionListItem`s.
- `components/sessions/session-list-item.tsx` —
  `'use client'` for the `<Link>`; renders one row with
  status pill, pitch excerpt, ISO date, and a "open" affordance.
  Card-shaped (consumes `Card` primitive).
- `components/sessions/session-empty.tsx` — empty-state
  card using the standing template copy. Links to `/app`.
- `components/sessions/transcript-view.tsx` — adapts the
  persisted `turns` rows into the `SessionTurn` shape the
  existing `LiveTranscript` expects (the persisted shape +
  the runtime reducer shape are siblings; the adapter is a
  10-line pure function).

Tests for each.

## Pages composition

```
app/app/sessions/page.tsx                — server; calls listSessions; renders <SessionList />
app/app/sessions/[id]/page.tsx           — server; calls loadSession; renders <ArtifactPreviewGrid /> + back-link
app/app/sessions/[id]/transcript/page.tsx — server; calls loadTranscript; renders <TranscriptView />
```

Each page declares `export const dynamic = 'force-dynamic'`
(matches `/app` from phase 5) since session data is
per-request.

## SEO / metadata

- All three pages: `metadata.robots = { index: false, follow: false }`
  (same as `/app`; these are private surfaces).
- `metadata.title` per page:
  - `/app/sessions` → `'Past sessions — boardroom'`
  - `/app/sessions/[id]` → `'Session results — boardroom'`
  - `/app/sessions/[id]/transcript` → `'Transcript — boardroom'`

## Empty / loading / error states

- **No sessions yet:** `SessionEmpty` renders the standing
  template copy.
- **Session id not owned or non-existent:** `notFound()` →
  Next's 404 page. (Pass-4 critique notes that page is bare;
  fixing the 404 page itself is phase 12 scope.)
- **Session ended early without an artifact row:** the
  results page renders the metadata + a small notice ("This
  session ended before producing artifacts.") + a "View
  transcript" link.

## Decisions made upfront — DO NOT ASK

- **No pagination in v1.** Per bearings standing decision.
- **Most-recent first** by `created_at desc`. Bearings sort
  default for the sessions list.
- **Pitch excerpt** truncated to 80 chars + ellipsis; raw
  body preserved on the detail pages.
- **Status pill colors:** map status enum to muted-only
  variants — no traffic-light alarmism. `done` →
  default-ink; `aborted` → muted; everything else (clarify,
  confer, ...) → in-flight italic. Single style file
  (`components/sessions/status-pill.tsx`).
- **404 on RLS-hidden** rather than 403. We deliberately
  don't leak "this session exists but you can't see it";
  consistent with bearings privacy posture.
- **Transcript pagination** is also out of scope. A 60k-token
  session is at most a few hundred turns; render the whole
  list. Phase 17 polish can add a virtualizer if needed.
- **No "delete session" affordance** in v1. Bearings doesn't
  list it. Phase 17 polish if requested.
- **No filter / search** on the list. Same reason.
- **Header on /app/sessions** uses the same eyebrow + H1
  pattern as `/app`: eyebrow `boardroom · past sessions`,
  H1 `Past sessions.`.

A brief that leaves Open Qs is a brief that fails its job.

## Mobile reflow / responsive

All three pages stack to one column under `md` (the
existing primitives already do this). Pitch excerpt wraps
naturally on narrow viewports.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/sessions/queries.ts` | listSessions filter shape + order; loadSession returns null on RLS-hidden; loadTranscript turns ordered by idx | — |
| `components/sessions/session-list.tsx` | empty array → SessionEmpty; non-empty → N SessionListItems | — |
| `components/sessions/session-list-item.tsx` | renders pitch excerpt + status + ISO date; Link href correct | — |
| `components/sessions/session-empty.tsx` | renders standing copy + /app link | — |
| `components/sessions/transcript-view.tsx` | adapts persisted turns → LiveTranscript turns; renders | — |
| `components/sessions/status-pill.tsx` | maps each enum value to a class | — |
| `app/app/sessions/page.tsx` | (server) requireUser → list query → render | — |
| `app/app/sessions/[id]/page.tsx` | notFound() when null; renders artifact grid + back link otherwise | — |
| `/app/sessions` running flow (anon) | — | hits `/app/sessions` unauthenticated → redirect to /signin?next=/app/sessions |

## Hermetic e2e registration

`e2e/app-sessions-redirect.spec.ts` (new):

- `GET /app/sessions` unauthenticated → redirect to /signin
  with `next=/app/sessions`.

Authed e2e remains gated on Mailosaur/cookie wiring.

## Verify gate

```bash
pnpm verify
```

No new deps; no migration.

## Commit body template

```
feat: past-session surface — phase 11

- app/app/sessions/page.tsx: list of the user's past sessions
  (most-recent first, no pagination per bearings); empty state
  with link to /app
- app/app/sessions/[id]/page.tsx: results page reusing
  ArtifactPreviewGrid; notFound() when RLS hides the row
- app/app/sessions/[id]/transcript/page.tsx: full transcript
  view via the LiveTranscript primitive against the persisted
  turns rows
- lib/sessions/queries.ts: listSessions, loadSession,
  loadTranscript reader helpers. RLS does the ownership check
- components/sessions/{session-list,session-list-item,
  session-empty,transcript-view,status-pill}.tsx: small UI
  primitives composed onto the new pages
- e2e: anonymous GET /app/sessions redirects to /signin with
  next=/app/sessions

Decisions:
- No pagination, no filter, no search, no delete affordance
  (bearings + standing decisions)
- 404 on RLS-hidden id rather than 403 (no leak)
- Status pill is muted-only; no traffic-light alarmism
- Transcript renders the whole list (no virtualizer in v1)
- Each page is force-dynamic per /app's pattern

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 11's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

## Follow-ups (out of scope this phase)

- Phase 12: about + legal pages (also closes the pending HIGH
  critique on /legal/{privacy,terms} 404s).
- Phase 17 polish: delete affordance, filter/search,
  transcript virtualizer if usage profile demands it.
