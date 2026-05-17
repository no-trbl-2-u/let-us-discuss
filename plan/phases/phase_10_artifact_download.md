# Phase 10 — Artifact render + download

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

The three artifacts that phase 7b produces (`spec.md`,
`exec summary`, `callouts`) become *downloadable* from the
artifact preview grid on `/app`. v1 download is **client-side
only** — the bytes are already in the page (the orchestrator
delivered them via SSE; `SessionArtifact` lives in the
reducer); no extra server round-trip. Filenames carry the
session id + ISO date so multiple downloads from the same
session sort.

`ArtifactPreviewGrid` keeps its current shape; what changes is
the `onDownload` handler on each tile. The phase-9 stub
(`window.alert('Download UI ships in phase 10.')`) goes away.

## Prerequisite

Phase 7b shipped: the orchestrator emits `artifact.ready` with
`{ specMd, execSummary, callouts }`, the reducer captures it,
and `ArtifactPreviewGrid` renders. Phase 8 + 9 also shipped
but neither affects the artifact pipeline.

## Dependencies (operator action required for runtime)

None. Pure client-side feature; no new env vars; no migration.

## Routes / endpoints

None added or modified. The download is a `Blob` + anchor
click, fully in the browser.

## Library / helpers (new code)

- `components/boardroom/download-artifact.ts` — exports
  `downloadArtifact({ kind, body, sessionId, finishedAt })`.
  Builds a `Blob` with `text/markdown;charset=utf-8` for spec
  + callouts and `text/plain;charset=utf-8` for exec summary,
  composes a filename, creates an anchor, clicks it, revokes
  the object URL. Defensive: bails silently when called
  server-side (`typeof window === 'undefined'`).
- `components/boardroom/__tests__/download-artifact.test.ts` —
  jsdom test mocks `URL.createObjectURL` + the anchor click;
  asserts filename shape, MIME type per kind, body content.

## Filename shape (locked)

`boardroom-<sessionId-first-8>-<YYYY-MM-DD>-<kind>.<ext>`

Examples:
- `boardroom-a3b1c2d4-2026-05-16-spec.md`
- `boardroom-a3b1c2d4-2026-05-16-summary.md`
- `boardroom-a3b1c2d4-2026-05-16-callouts.md`

Reasoning: the first 8 chars of the UUID are enough to
disambiguate within a session list of ≤10/day, the ISO date
sorts naturally in a Downloads folder, and the kind suffix
makes the file easy to find without opening it.

## Components / handlers (touched, not added)

- `components/boardroom/artifact-preview-grid.tsx`:
  - Drops the `window.alert(...)` stubs.
  - Each `ArtifactTile`'s `onDownload` now calls
    `downloadArtifact({...})` with the matching kind + body
    + the session metadata (sessionId + an
    artifact-finishedAt timestamp). Tracks a per-tile
    `downloaded` boolean in local state so subsequent clicks
    re-trigger the download but the `downloaded` flag flips
    the tile's accent corner (see ArtifactTile primitive).
  - Adds a `sessionId: string | null` + `finishedAt: string`
    prop (the reducer doesn't currently track artifact
    finish time — derive from `Date.now()` at render).
- `components/boardroom/board-client.tsx`:
  - Passes `sessionId={session.sessionId}` to
    `ArtifactPreviewGrid` alongside the existing
    `artifact={...}` and `tokensUsed={...}`.

## Cross-links

**In** (verify still wired):
- `SessionArtifact` shape from `use-session-state.ts` (7b).
- `ArtifactTile` primitive (`design/primitives/artifact-tile.tsx`).

**Out** (this phase ships these):
- The `downloadArtifact` helper is a candidate for reuse on
  phase 11's `/app/sessions/[id]` past-session surface, which
  will need the same download affordance.

**Retro-fit**:
- `ArtifactPreviewGrid.test.tsx` updates from "renders three
  tiles" to also assert that clicking Download triggers the
  helper (helper is mocked).

## SEO / metadata

None.

## Empty / loading / error states

- **No artifact yet:** `ArtifactPreviewGrid` does not render
  (already gated in `board-client` on `showArtifact`).
- **Download invoked twice:** the second click re-triggers the
  Blob construction + click. Browsers may show "save as" again
  or queue the same filename; that's acceptable v1 behavior.
- **Body is empty string** (degenerate orchestrator output):
  still produce the file (placeholder body composed by
  `composeArtifact` already substitutes a stub like
  `'# Spec\n\n(no content)'`).

## Decisions made upfront — DO NOT ASK

- **Client-side download only in v1.** A server round-trip
  would force the user to wait + would re-render the same
  bytes already on the page; not worth the latency.
- **One MIME per kind.** spec + callouts = markdown; exec
  summary = plain text (it's prose; opening as markdown
  encourages users to render bullets that aren't there).
- **Filename uses the first 8 chars of the UUID**, not the
  full UUID. Readable in the OS file dialog; collision risk
  inside the 10/day window is negligible.
- **No download counter, no analytics ping**. v1 doesn't
  track downloads.
- **No "all three as a zip" affordance.** Three separate
  downloads is the v1 shape; zip support is phase 17 polish
  if user feedback asks for it.
- **No "Share" or "Copy link" affordance**. There is no
  shareable URL in v1 (phase 11 ships
  `/app/sessions/[id]` for past-session viewing; only the
  session owner can read it).
- **`downloaded` state lives in local component state, not
  the reducer.** The reducer tracks server-truth (the
  artifact); the tile's "I already grabbed this" flag is
  purely UX feedback.
- **`finishedAt` is derived from `Date.now()` at the moment
  the grid first renders for a given artifact.** The reducer
  could be extended to capture the SSE `artifact.ready`
  timestamp, but that's overengineering for the v1 byline.

A brief that leaves Open Qs is a brief that fails its job.

## Mobile reflow / responsive

`ArtifactPreviewGrid` already collapses to one column under
`md`. Download click → native browser save dialog; no mobile
flow change.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `download-artifact.ts` | builds correct filename per kind; sets MIME; calls createObjectURL + click + revoke; bails when window is undefined | — |
| `artifact-preview-grid.tsx` | (extended) clicking Download on each tile calls the helper with the right kind + body; the `downloaded` flag flips per tile | — |
| `board-client.tsx` | (no new test; the integration is covered by the existing /app page test which mocks the reducer) | — |
| `/app` running flow (authed) | — | **Gated** on magic-link e2e wiring (same as 7b). When auth e2e is live, add a test that ends a session, clicks Download spec, asserts the download was initiated. |

## Hermetic e2e registration

No new public-anon e2e. The download path is fully behind
auth.

## Verify gate

```bash
pnpm verify
```

All checks pass before commit. No new dependencies.

## Commit body template

```
feat: artifact download UI — phase 10

- components/boardroom/download-artifact.ts: downloadArtifact
  helper. Blob + anchor click + revokeObjectURL; one MIME per
  kind (text/markdown for spec + callouts, text/plain for
  exec summary). Defensive on SSR (bails when window is
  undefined)
- artifact-preview-grid: drops the window.alert stub; each
  tile's onDownload wires through to downloadArtifact with
  the session's first-8 UUID + ISO date + kind suffix.
  Per-tile `downloaded` boolean flips the tile's accent corner
- board-client: passes session.sessionId through to
  ArtifactPreviewGrid

Decisions:
- Client-side download only in v1 (bytes already on the page)
- spec + callouts = markdown MIME; exec summary = plain text
- Filename: boardroom-<sid8>-<YYYY-MM-DD>-<kind>.<ext>
- No zip, no analytics, no Share affordance
- downloaded state is local UI feedback, not reducer state

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 10's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

## Follow-ups (out of scope this phase)

- Phase 11: past-session surface reuses `downloadArtifact` on
  `/app/sessions/[id]`.
- Phase 17 polish: "Download all (zip)" affordance if user
  feedback asks for it.
