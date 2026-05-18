# Phase 13 — `/api/health` + smoke-walker integration

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

A single hermetic Playwright spec walks the entire URL contract
declared in `plan/bearings.md` and asserts none of the routes
return a 500. The spec is gated into the existing `pnpm e2e`
leg, so a future regression that takes down `/about` (say) trips
the verify gate before it merges.

The happy-path "one session run end-to-end" requirement is
already satisfied by `e2e/try.spec.ts` (anonymous canned
3-turn demo through artifacts) — the smoke walker complements
that by guarding URL availability, not session correctness.

The `/api/health` endpoint is already shipped (`app/api/health/
route.ts` from phase 1; `e2e/health.spec.ts` already exercises
the 200/JSON-shape contract). This phase verifies the existing
coverage and uses `/api/health` as the cheap probe inside the
smoke walker's pre-flight.

## Prerequisite

Phases 1–12 shipped. Every URL in the bearings contract now
resolves either to a 200 (public pages, `/api/health`,
`/auth/callback` with a noop code), a 3xx redirect (authed
pages without a session → `/signin`), or a 401 (API routes
called anonymously).

## Dependencies (operator action required for runtime)

None. The spec runs against the hermetic `pnpm build && next
start` already wired in `playwright.config.ts`.

## Routes / endpoints (locked from bearings)

No new routes. The smoke walker enumerates the existing URL
contract and asserts each one's expected status family:

| Route                              | Method | Auth state | Expected |
|------------------------------------|--------|-----------|----------|
| `/`                                | GET    | anon      | 200 |
| `/try`                             | GET    | anon      | 200 |
| `/signin`                          | GET    | anon      | 200 |
| `/auth/callback`                   | GET    | anon      | 302/307 to `/signin?error=missing_code` (or `/signin`); NOT 500 |
| `/about`                           | GET    | anon      | 200 |
| `/about/personas`                  | GET    | anon      | 200 |
| `/legal/privacy`                   | GET    | anon      | 200 |
| `/legal/terms`                     | GET    | anon      | 200 |
| `/app`                             | GET    | anon      | 302/307 to `/signin?next=/app` |
| `/app/sessions`                    | GET    | anon      | 302/307 to `/signin?next=/app/sessions` |
| `/app/sessions/00000000-0000-0000-0000-000000000000` | GET | anon | 302/307 to `/signin?next=…` |
| `/app/sessions/00000000-0000-0000-0000-000000000000/transcript` | GET | anon | 302/307 to `/signin?next=…` |
| `/api/health`                      | GET    | anon      | 200 + JSON body `{ ok: true, ts: <iso> }` |
| `/api/sessions`                    | POST   | anon      | 401 |
| `/api/sessions/<id>/answer`        | POST   | anon      | 401 |
| `/api/demo/begin`                  | POST   | anon      | 200 + documented body (existing spec asserts shape; smoke walker only asserts `< 500`) |

**Critical assertion:** every cell returns `status < 500`. The
walker doesn't enforce the precise 2xx vs 3xx vs 4xx contract
(other specs already do that); it asserts the absence of 5xx
specifically. That's what "no 500s" means in the build-plan
row.

## Library / helpers (new code)

- `e2e/url-contract.ts` — a small pure module that exports
  `URL_CONTRACT` (an array of `{ url, method, body?, label }`)
  drawn directly from the table above. The smoke walker
  iterates this array. Living in `e2e/` keeps it out of the
  app bundle and colocates with the spec that uses it.
- `e2e/url-contract.test.ts` (vitest) — asserts that
  `URL_CONTRACT` covers every entry in the bearings URL
  contract (parses `plan/bearings.md` "URL contract (locked)"
  block and diffs against the array). Reason: if a future
  phase adds a route to bearings, this test fails until the
  smoke walker is taught about it.

## Components / handlers (new files)

None. No UI surfaces in this phase.

## Cross-links

**In (verify):**

- `e2e/health.spec.ts` already asserts `/api/health` shape;
  the smoke walker subsumes the bare-status assertion but
  leaves the shape assertion in place (different concern).

**Out (ship):**

- Nothing user-facing.

**Retro-fit:**

- None. The smoke walker is purely additive.

## SEO / metadata

N/A. Test-only phase.

## Hero / body / sub-section composition

N/A.

## Empty / loading / error states

The walker's own failure mode: if any URL trips a 500, the
spec emits a failure naming the offending URL + the response
body excerpt (so the regression is debuggable from the CI log
alone — no need to bisect locally). Implemented via Playwright
`test.soft` so a single failing URL surfaces every other
broken URL in the same run instead of stopping at the first.

## Decisions made upfront — DO NOT ASK

- **Smoke walker lives in `e2e/url-contract-smoke.spec.ts`,
  not in the existing `health.spec.ts` or `landing.spec.ts`.**
  Reason: it's a contract-level test (across routes), not a
  page-level test. Keeping it in its own file makes the
  failure mode obvious from the spec name in CI.
- **Use `request.get()` / `request.post()` (Playwright's
  fetch API), not `page.goto()`.** Reason: the walker has 16
  routes and `page.goto` boots a fresh Chromium instance per
  navigation. `request` is 10x faster, runs in parallel, and
  is exactly what `/api/health.spec.ts` already uses for the
  health probe.
- **`/auth/callback` is tested with no `?code=` param.** The
  expected behavior is a redirect to `/signin` (already coded
  defensively); the spec asserts `< 500` and `Location`
  header points at `/signin`. If the route currently throws
  500 on missing code (it shouldn't, but I haven't verified
  yet), the spec fails — that's a real bug to fix in this
  phase before merge.
- **Use a deterministic invalid session UUID
  (`00000000-0000-0000-0000-000000000000`) for
  `/app/sessions/[id]`.** Reason: real session UUIDs need
  auth + DB seed; the redirect-when-unauthenticated path is
  what the walker checks, and the redirect happens before
  the DB lookup ever runs (middleware-level).
- **`/api/sessions` and `/api/sessions/[id]/answer` walked
  via POST, not GET.** Reason: the routes are POST-only by
  contract (per `bearings.md` AI usage map: "server-action
  surface for the active session (streaming responses)").
  GET-on-POST returns 405 which is fine — but we'd be
  asserting an unintentional behavior; POST is the contract.
- **`/api/demo/begin` walked as POST with an empty body** —
  the existing `api-demo-begin.spec.ts` asserts the
  documented shape; the smoke walker just asserts `< 500`
  on the same input.
- **URL contract source-of-truth check is a vitest test, not
  a build-time codegen step.** Reason: a runtime test that
  fails on drift is honest about the contract; codegen
  hides the drift inside generated code. The vitest path
  also keeps the check inside `pnpm verify` (test:run leg)
  so the gate trips immediately, not deeper in e2e.
- **The vitest test parses bearings.md as a string and
  greps for `^- \`/`** under the URL contract block to
  extract route patterns. Crude but deterministic; the
  bearings format is hand-controlled. The test ignores
  parametric segments (e.g. `[id]` matches the smoke walker's
  literal-UUID entry by stripping bracket parts).
- **No happy-path-session test added in this phase.** The
  build-plan row says "visits one happy-path session run
  end-to-end" — that's `e2e/try.spec.ts` (already shipped at
  phase 6). An authed full-AI session walk would require
  Anthropic credits + a real signed-in session, which the
  hermetic gate can't satisfy. The smoke walker complements
  /try by covering URL availability; together they meet the
  build-plan row's intent.
- **No new `pnpm` script.** The spec auto-discovers under
  Playwright's existing config; no `pnpm smoke` alias.
  Reason: `pnpm e2e` is already the gate; adding aliases
  fragments operator habits.
- **Walker runs in `[desktop]` project only**, not on
  `[mobile]`. Reason: mobile-vs-desktop status-code behavior
  is identical — this is a contract test, not a layout test.
  Cuts test count from 32 to 16 with no loss of signal.

## Mobile reflow / responsive

N/A. No UI in this phase.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `e2e/url-contract.ts` | (no logic, data only) | — |
| `e2e/url-contract.test.ts` | parses bearings URL contract; asserts every route appears in `URL_CONTRACT`; reverse: every `URL_CONTRACT` entry is in bearings | — |
| All routes | — | `e2e/url-contract-smoke.spec.ts`: iterate `URL_CONTRACT`; assert `status < 500` for each; assert `Location` redirect-target for authed routes; assert 200 for `/api/health`; assert 401 for `/api/sessions[/...]/answer` POST |

## Hermetic e2e registration

`e2e/url-contract-smoke.spec.ts` (new) runs under the existing
`playwright.config.ts` desktop project. No new browser, no new
webServer config.

## Verify gate

```bash
pnpm verify
```

No new deps, no migrations, no env vars. Two new test files
(one vitest, one playwright) plus one data module.

## Commit body template

```
feat: URL-contract smoke walker — phase 13

- e2e/url-contract.ts: enumeration of every URL in the
  bearings contract with expected method + auth state
- e2e/url-contract.test.ts (vitest): asserts URL_CONTRACT
  stays in sync with plan/bearings.md "URL contract (locked)"
  block — drift fails the test:run leg
- e2e/url-contract-smoke.spec.ts: iterates URL_CONTRACT and
  asserts `status < 500` for every route + asserts redirect
  targets for /app/* + asserts 401 for /api/sessions[...]/
  answer POST anonymously
- Uses Playwright request fixture (not page.goto) — 16 routes
  in parallel without spinning up browser contexts; mirrors
  the existing health.spec.ts probe style
- test.soft assertions — a single broken route surfaces
  every other broken route in the same run

Decisions:
- Smoke walker is desktop-only (contract test, not layout)
- /auth/callback walked with no ?code= — asserts graceful
  redirect to /signin, not the auth-success path
- App/sessions detail uses a literal UUID; the redirect runs
  before the DB lookup, so seeding isn't required
- URL contract sync check is a vitest test, not codegen
- No authed happy-path session walk in this phase — /try
  already covers session-loop end-to-end; full authed loop
  needs Anthropic credits the hermetic gate doesn't have
- No new pnpm script alias — pnpm e2e is the gate

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 13's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

If the smoke walker discovers a route currently returning 500
(possible for `/auth/callback` without code; possible for
`/app/sessions/[id]` if the redirect happens after a throw),
fix the offending route inside this phase before merge. The
brief is `ship green or fix the regression`.

## Follow-ups (out of scope this phase)

- Authed happy-path session walk gated on Anthropic credits +
  Mailosaur. Not a phase; surfaces as an [operator]-tagged
  enhancement in `plan/AUDIT.md` if/when the operator wires
  both env blocks.
- A per-route latency budget assertion (e.g. "every page
  responds in <2s"). Useful for phase 15 (performance).
