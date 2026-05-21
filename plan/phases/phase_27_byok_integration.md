# Phase 27 — BYO Anthropic API key (orchestrator integration)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

1. **Authed sessions automatically pick up the user's
   encrypted Anthropic key** when one is on file. The
   orchestrator instantiates a second Anthropic stream client
   keyed by the user's plaintext (decrypted at session start
   only). When the user has no key on file or BYOK is not
   enabled on this deployment, the orchestrator falls back to
   the project's `ANTHROPIC_API_KEY` env — existing behavior
   unchanged.
2. **Per-session `key_origin` accounting.** A new column on
   `public.sessions` records `'user'` or `'project'` so cost
   attribution stays honest. Migration is additive; existing
   rows default to `'project'`.
3. **A "you're paying now" banner on the boardroom shelf** for
   user-key sessions (rendered only when the session was
   created with a user key on file). Locked copy.
4. **No new URL surfaces.** `/app/settings/api-key` (phase 26)
   stays the manage-keys surface; this phase only wires the
   orchestrator + the in-session banner.
5. **The boardroom remains operational when BYOK is not
   enabled on the deployment.** `getMasterKey() === null` →
   the new path short-circuits to project-key behavior; no
   503s on the session-create path.

## Prerequisite

Phases 1–26 shipped. `lib/byok/repo.ts` exports
`getDecryptedKey(supabase, userId): Promise<string | null>`
(phase 26 locked this contract). `lib/byok/master-key.ts`
exports `getMasterKey()`. `lib/anthropic/conferring.ts`
accepts an injected `client?: AnthropicStreamClient`. The
session-create route already passes the user's supabase
client to `runConferring` via the `persistTurn` /
`persistArtifact` hooks.

## Dependencies (operator action required for runtime)

- **Apply `db/migrations/20260520_phase_27_byok_key_origin.sql`**
  via `pnpm db:migrate`. The column has `default 'project'`
  so existing rows stay valid and the orchestrator's write
  path silently succeeds whether or not the migration has
  landed (the column is optional in the Insert type). Until
  applied: every session row reports `'project'` regardless of
  origin — the banner still renders correctly because the
  decision is made at session-create time from the in-memory
  decrypted key, not by reading the row back. **One
  `[operator]` AUDIT row covers this migration.**
- **No new env vars.** Phase 26 already requires
  `BYOK_MASTER_KEY`; phase 27 reuses it.

## Routes / endpoints (locked from bearings)

**No new URLs.** Existing surfaces only:

| Route | Method | Auth | Change |
|---|---|---|---|
| `POST /api/sessions` | route handler | authed | Reads the user's key at session start; injects a per-session Anthropic client; persists `key_origin` on the row |

The bearings URL contract is unchanged.

## Library / helpers (new code)

**Created:**

- `db/migrations/20260520_phase_27_byok_key_origin.sql` —
  adds one column to `public.sessions`:
  `key_origin text not null default 'project' check
  (key_origin in ('user', 'project'))`.
- `lib/anthropic/user-key-client.ts` — server-only.
  - `buildUserKeyStreamClient(apiKey: string):
    AnthropicStreamClient` — wraps the Anthropic SDK
    identically to `defaultStreamClient` (see
    `conferring.ts:771`) but with the user's plaintext key.
    No model override here; the model still comes from the
    session's `model` field (phase 24).
  - `resolveSessionClient(opts: { supabase, userId }):
    Promise<{ client: AnthropicStreamClient | null;
    keyOrigin: 'user' | 'project' }>` — single decision
    point. Calls `getMasterKey()` first; if null →
    `{ client: null, keyOrigin: 'project' }`. Otherwise
    calls `getDecryptedKey(supabase, userId)`; on a
    non-null plaintext returns
    `{ client: buildUserKeyStreamClient(plaintext),
    keyOrigin: 'user' }`; otherwise
    `{ client: null, keyOrigin: 'project' }`. **Catches all
    errors from `getDecryptedKey` and falls back to
    project** — a tampered ciphertext / missing migration
    table should not break the session.
- `lib/anthropic/__tests__/user-key-client.test.ts` —
  covers:
  - `buildUserKeyStreamClient` returns a client whose
    `streamCompletion` accepts the locked input shape (mock
    Anthropic SDK constructor; assert apiKey is passed
    through).
  - `resolveSessionClient` returns project when master is
    unset.
  - `resolveSessionClient` returns project when the user
    has no key on file.
  - `resolveSessionClient` returns user when both master +
    user key are present.
  - `resolveSessionClient` swallows `getDecryptedKey`
    errors and returns project (logged via
    `logError('byok', ...)`).
- `components/boardroom/byok-banner.tsx` — server-renderable
  client wrapper around a static one-line tile that surfaces
  on `/app` when the session was created with a user key.
  Locked copy: "You're paying for this session — your
  Anthropic API key is in use." Props:
  `{ visible: boolean }`. Pure presentational; no fetch.
- `components/boardroom/__tests__/byok-banner.test.tsx` —
  asserts:
  - returns null when `visible={false}`.
  - renders the locked copy when `visible={true}`.
  - has the documented `data-testid="byok-banner"`.

**Edited:**

- `lib/sessions/repo.ts` —
  - Extend `CreateSessionInput` with optional
    `keyOrigin?: 'user' | 'project'`. Defaulted to
    `'project'` when absent; insert it on the Supabase
    write. Existing call sites pass nothing → silent
    backward compat.
- `app/api/sessions/route.ts` —
  - After `getRouteUser` + `createSession` + before
    `runConferring`: call `resolveSessionClient`. Pass the
    returned `client` (when non-null) into `runConferring`
    via the existing `client?: AnthropicStreamClient`
    surface. Pass `keyOrigin` to `createSession`.
  - On exception thrown by `resolveSessionClient` itself
    (should be unreachable — the helper catches its own
    errors), log + fall back to project.
- `components/boardroom/board-client.tsx` (or whichever
  component currently owns the boardroom shelf in `/app`)
  — render `<ByokBanner visible={hasUserKey} />` above the
  pitch input, where `hasUserKey` comes from a server-side
  load identical to the one phase 26's settings page does
  (`loadKeyMeta(supabase, user.id) !== null`).
- `app/app/page.tsx` — load `loadKeyMeta` server-side; pass
  `hasUserKey: meta !== null` down to the board client.
- `lib/supabase/database.types.ts` — add `key_origin:
  'user' | 'project'` to `SessionRow` and the Insert type.
- `plan/AUDIT.md` — file one `[operator]` row for the
  phase-27 migration.

**No new client-side dependencies.** Same Anthropic SDK
already in use.

## Constants

`lib/anthropic/user-key-client.ts`:
```ts
export const BYOK_BANNER_TEXT =
  "You're paying for this session — your Anthropic API key is in use."
```

## Session events + reducer

N/A. The orchestrator's SSE event stream shape is unchanged.
The banner reads from the page's server-side load, not from
SSE.

## Cross-links

**In** (verify still wired):
- `lib/anthropic/conferring.ts` `runConferring` —
  `client?: AnthropicStreamClient` injection point
  (already in the public surface; not new).
- `lib/byok/repo.ts` `getDecryptedKey` — phase 26's locked
  contract.
- `lib/byok/master-key.ts` `getMasterKey` — phase 26.
- `lib/supabase/auth.ts` `getRouteUser` / `requireUser` —
  reused.

**Out** (ship):
- `lib/anthropic/user-key-client.ts` — `resolveSessionClient`
  + `buildUserKeyStreamClient`.
- `components/boardroom/byok-banner.tsx`.
- `public.sessions.key_origin` column.

**Retro-fit:**
- `app/app/page.tsx` adds one server-side load.
- `components/boardroom/board-client.tsx` renders one
  conditional banner. Existing tests untouched (banner
  defaults to `visible={false}` so test fixtures with no
  user key see no change).

## SEO / metadata

N/A. Surface changes are inside `/app` (already
`robots: noindex`).

## Hero / body / sub-section composition

When `hasUserKey === true`, the boardroom shelf renders a
single one-line tile above the pitch input:

```
+------------------------------------------------------------+
|  You're paying for this session — your Anthropic API key   |
|  is in use.                                                |
+------------------------------------------------------------+
```

Mono, ink-muted, single-line. Matches the existing
`UsageEstimate` tile's visual register (phase 25).

When `hasUserKey === false`, no tile renders. No spacing
gap — the conditional removes the element from the DOM.

## Empty / loading / error states

- **No master key on the deployment:** banner never renders
  (`hasUserKey` always false because the server-side load
  short-circuits in `loadKeyMeta`); orchestrator uses
  project key.
- **User has no key:** banner doesn't render; orchestrator
  uses project key.
- **`getDecryptedKey` throws** (tampered ciphertext, table
  missing, etc.): logged via `logError('byok', ...)`;
  orchestrator falls back to project. Session completes.
  The banner state is decided **before** decrypt by reading
  `loadKeyMeta` (no decrypt path), so it stays in sync with
  what the user sees on the settings page.
- **User has a key but Anthropic rejects it at first call:**
  the Anthropic SDK throws inside `streamCompletion`; the
  existing orchestrator error path catches it and the
  session emits `session.error` with the SDK's error
  message. No special-casing — same path as a misconfigured
  project key already takes.

## Decisions made upfront — DO NOT ASK

- **`resolveSessionClient` does the decision once at
  session create.** Don't re-resolve per turn — locks the
  key for the session lifetime; mirrors phase 24's model
  pinning at session-create.
- **Plaintext lives in memory only.** It's bound into the
  AnthropicStreamClient closure (the SDK keeps the key
  internal) and not stored elsewhere. No `key_origin =
  'user'` value-of-plaintext escape via logs.
- **`key_origin` is stored on the session row, not on
  every turn.** Per-turn would over-write a stable fact.
  One row per session is enough for honest accounting.
- **`key_origin` defaults to `'project'`** in the migration
  and the Insert type. Pre-phase-27 rows + the
  pre-migration phase-27 rows both report `'project'` —
  which is honest for the first and a known undercount
  for the second (banner UI is still correct because the
  decision is made in memory at create time, not by
  reading the row).
- **Banner copy is locked at module scope** so audit
  tooling can grep it.
- **No "rotate this session's key" affordance.** The user
  can rotate via the settings page; the next session picks
  up the new key. A mid-session rotate is niche and
  doesn't compose cleanly with already-streaming completions.
- **`buildUserKeyStreamClient` does not accept a model
  override.** The model still comes from the session's
  `model` field (phase 24). Per-key model allowlist
  intersection is a follow-up.
- **Per-key spend tile is a follow-up.** Phase 25's usage
  summary aggregates across both origins; this phase
  doesn't slice further.
- **First-run warning checkbox is a follow-up.** The
  settings page's first-run locked copy from phase 26 is
  the existing surface for that warning; we don't add a
  second confirmation step at session-create.
- **`resolveSessionClient` catches all errors.** A
  tampered ciphertext / missing migration / Supabase
  hiccup should not break a session that would otherwise
  work on the project key. The trade-off: a silently-failed
  decrypt looks identical to "no key on file" to the user.
  Acceptable — they can rotate from the settings page if
  the banner doesn't appear.
- **The banner is computed once on the server.** No client
  fetch to `/api/byok` to check if a key exists; that
  would race the page render and add a flicker.

## Mobile reflow / responsive

The banner is a single-line tile inside the existing
boardroom shelf column. Same mobile-reflow shape as
`UsageEstimate`. No new breakpoint-specific code.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/anthropic/user-key-client.ts` | resolveSessionClient: project on master-unset; project on no-key; user on both present; project on decrypt error; buildUserKeyStreamClient passes apiKey | — |
| `components/boardroom/byok-banner.tsx` | null when visible=false; renders locked copy when visible=true; data-testid present | — |
| `app/api/sessions/route.ts` | extends existing route.test: when resolveSessionClient returns a user client, runConferring is called with that client + createSession receives keyOrigin='user'; project default otherwise | — |
| `lib/sessions/repo.ts` | createSession includes keyOrigin in the insert when provided | — |
| existing /app page test | extends existing test if needed to assert the banner conditional renders when hasUserKey is true | — |

## Hermetic e2e registration

No new hermetic e2e. The orchestrator is exercised by the
existing operator-gated authed walk; the banner is a single
DOM element guarded by a server-side prop.

## Verify gate

```bash
pnpm verify
```

Runs typecheck → test:run → data:validate → build → e2e.
**Each leg is a hard gate.**

## Commit body template

```
feat: BYO Anthropic API key orchestrator integration — phase 27

- db/migrations/20260520_phase_27_byok_key_origin.sql: adds
  sessions.key_origin text not null default 'project' check
  (in ('user', 'project')).
- lib/anthropic/user-key-client.ts: resolveSessionClient
  decides project|user at session-create; buildUserKeyStreamClient
  wraps the SDK with the user's plaintext key. All decrypt
  errors swallowed -> project fallback.
- lib/anthropic/__tests__/user-key-client.test.ts: covers
  master-unset, no-key, both-present, decrypt-error paths.
- components/boardroom/byok-banner.tsx: locked-copy single-line
  tile; hidden when visible=false.
- components/boardroom/__tests__/byok-banner.test.tsx: tests
  the conditional + the copy.
- lib/sessions/repo.ts: CreateSessionInput grows by optional
  keyOrigin; default 'project'.
- app/api/sessions/route.ts: calls resolveSessionClient,
  injects the client into runConferring, passes keyOrigin
  into createSession.
- app/app/page.tsx + components/boardroom/board-client.tsx:
  load loadKeyMeta server-side; render <ByokBanner> above
  the pitch input when a user key is on file.
- lib/supabase/database.types.ts: key_origin column added to
  the SessionRow + Insert type.
- plan/AUDIT.md: new [operator] row for the phase-27
  migration.

Decisions:
- One decision at session-create (resolveSessionClient);
  per-turn re-resolve would race rotation.
- Plaintext lives only in the per-session SDK closure.
- key_origin on the session row, not per-turn (one stable
  fact per session).
- Default 'project' so pre-migration rows + the orchestrator's
  insert both stay valid before the migration lands.
- Banner state derived from loadKeyMeta (no decrypt path);
  stays in sync with the settings page.
- All getDecryptedKey errors swallowed -> project fallback.
  Trade-off: a silent decrypt-failure looks identical to
  "no key" to the user, but they can rotate from the
  settings page if the banner doesn't appear.
- No model override on the user-key client (model still
  comes from phase 24's session.model).
- Per-key spend tile + first-run warning checkbox folded
  into /iterate after this ships (per the phase 27 row in
  01_build_plan.md).

Operator action: run pnpm db:migrate. Until applied, every
session row reports key_origin='project' regardless of
which key was used; banner UI still renders correctly
because the decision is made in memory.

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 27's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash.

Add `[operator]` AUDIT row "Apply phase-27 key_origin
migration in Supabase".

## Follow-ups (out of scope this phase)

- **Per-key spend tile.** Slice phase 25's usage summary by
  `key_origin` so users can see how much of their spend
  came from BYOK vs the project fallback.
- **Per-key model allowlist intersection.** When a user
  provides a key, the model picker should intersect the
  app's allowlist with what their account is provisioned
  for. Currently both allowlists are identical; cross-org
  customization is the trigger.
- **First-run warning checkbox** in the boardroom shelf
  the first time a user starts a session with a key on
  file. Phase 26's settings page already locks first-run
  copy; this is the in-session re-confirmation step.
- **Mid-session rotate.** If demand exists, surface a
  refresh-token affordance that picks up a newly rotated
  key without ending the current session. Niche; defer.
- **Per-org BYOK** (multiple users sharing one key).
  Schema-shaped now (one row per user) but a future
  expansion could add an `org_id` column. Out of v1 scope.
