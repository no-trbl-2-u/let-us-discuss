# Phase 26 — BYO Anthropic API key (foundation: schema + encrypt/decrypt + settings UI)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

1. **A new authed surface at `/app/settings/api-key`** lets
   a user paste an Anthropic API key, see its masked
   summary if one is on file, rotate it (replace) or revoke
   it (delete). The page is gated by `requireUser()`; no
   admin role required.
2. **Keys are encrypted at rest with AES-256-GCM**, keyed by
   `BYOK_MASTER_KEY` (a 32-byte base64 env var). The
   ciphertext, IV, auth tag, and a `key_version` integer
   live in a new `public.user_api_keys` table (one row per
   user, FK on-delete cascade). Plaintext never sits in any
   table. Plaintext never appears in any log.
3. **An audit trail** in `public.user_api_key_audit`
   captures `add` / `rotate` / `revoke` events per user;
   the settings page renders the last 5 events.
4. **`/app/settings/api-key` joins the bearings URL
   contract.** Walker + bearings sync test continues to
   pass.
5. **Phase 27 reads the encrypted key**; this phase ships
   the foundation only (schema + crypto helpers + UI +
   audit trail). The orchestrator integration is phase 27.

## Prerequisite

Phases 1–25 shipped. The `/app/settings` route exists
(phase 18) and now carries `<AccountUsageSummary>` above
the Account section (phase 25). The `requireUser()` helper
exists. Migration runner (`pnpm db:migrate`) is operator-
applied per the existing `[operator]` AUDIT pattern.

**Scout (2026-05-20):** confirmed app-level AES-256-GCM
over Supabase Vault — pgsodium is in pending-deprecation;
Vault's `decrypted_secrets` view + default statement
logging are a foot-gun for bearer-token storage. Source-
of-truth one-line: env var holds master key, app encrypts
client-side, ciphertext + iv + tag stored in Postgres.
Rotation = re-encrypt under a new `key_version`.

## Dependencies (operator action required for runtime)

- **Set `BYOK_MASTER_KEY` in `.env` (local) + Vercel
  Project Env (Production + Preview).** Format: a
  base64-encoded 32-byte random value. Generate via
  `openssl rand -base64 32`. Empty / unset → the settings
  page renders a one-line "BYOK not enabled by the
  operator yet" and `/api/byok/*` returns 503; rest of the
  app is unaffected.
- **Run `pnpm db:migrate`** against the production
  Supabase project to apply
  `db/migrations/20260520_phase_26_byok.sql`. Until
  applied, the settings page renders "BYOK not enabled"
  (the storage table doesn't exist; the page detects this
  via a one-shot guarded `select` and falls back). Both
  ops folded into one `[operator]` AUDIT row.

## Routes / endpoints (locked from bearings)

**Adds `/app/settings/api-key` to the URL contract.** The
locked URL list in `bearings.md` grows by one entry
(documented in the same commit). All other URLs
unchanged.

| Route | Method | Auth | Body / Render |
|---|---|---|---|
| `GET /app/settings/api-key` | server-rendered | authed | settings panel — masked summary + rotate/revoke actions OR paste form |
| `POST /api/byok` | route handler | authed | `{ key: string }` — sets / rotates; returns `{ ok: true, mask, keyVersion }` |
| `DELETE /api/byok` | route handler | authed | empty body — revokes (deletes the row + appends `revoke` audit) |

Both API handlers require an authed user; 401 otherwise.
Both return 503 when `BYOK_MASTER_KEY` is unset.

The settings page navigates back to `/app/settings` via
the existing breadcrumb pattern.

## Library / helpers (new code)

**Created:**

- `db/migrations/20260520_phase_26_byok.sql` — creates
  `public.user_api_keys` (one row per user) and
  `public.user_api_key_audit` (event log).
  - `user_api_keys`: `user_id uuid primary key references
    auth.users(id) on delete cascade`,
    `ciphertext bytea not null`, `iv bytea not null`,
    `auth_tag bytea not null`, `key_version int not null
    default 1`, `created_at timestamptz not null default
    now()`, `updated_at timestamptz not null default now()`.
    RLS on; policy: user can `select` / `insert` /
    `update` / `delete` rows where `user_id = auth.uid()`.
    Service role bypasses RLS.
  - `user_api_key_audit`: `id bigserial primary key`,
    `user_id uuid not null references auth.users(id) on
    delete cascade`, `event text not null check (event in
    ('add', 'rotate', 'revoke'))`, `created_at timestamptz
    not null default now()`, `key_version int not null
    default 1`. RLS on; policy: user can `select` rows
    where `user_id = auth.uid()`; INSERT is service-role
    only.
- `lib/byok/master-key.ts` —
  - `getMasterKey(): Buffer | null` — decode
    `BYOK_MASTER_KEY` from base64; return `null` if unset
    or wrong length (not 32 bytes). Pure / synchronous.
  - `BYOK_KEY_VERSION = 1` — current version constant.
    Increment on master-key rotation.
- `lib/byok/master-key.test.ts` — covers: returns null
  for unset / empty / not-base64 / wrong-length;
  returns a 32-byte Buffer for a valid value.
- `lib/byok/encrypt.ts` — server-only.
  - `encryptKey(plaintext: string): { ciphertext: Buffer;
    iv: Buffer; authTag: Buffer; keyVersion: number }` —
    AES-256-GCM via Node `crypto`. Random 12-byte IV;
    auth tag from `cipher.getAuthTag()`. Throws if the
    master key is unset.
  - `maskKey(plaintext: string): string` — returns
    `sk-ant-…XYZX` (first 6 + ellipsis + last 4) for safe
    display. Pure.
- `lib/byok/__tests__/encrypt.test.ts` — covers:
  - round-trip with `decrypt.ts` returns the original
    plaintext.
  - encrypt-decrypt with a different master key throws (auth
    tag invalid).
  - encrypt-decrypt with a tampered ciphertext throws.
  - throws if master key is unset.
  - `maskKey` masks long keys correctly; short keys fall
    back to a single `***` token.
- `lib/byok/decrypt.ts` — server-only.
  - `decryptKey(input: { ciphertext: Buffer; iv: Buffer;
    authTag: Buffer; keyVersion: number }): string` — AES-
    256-GCM decrypt. Throws on auth-tag mismatch (tampered
    or wrong key). Throws on
    `keyVersion !== BYOK_KEY_VERSION`.
- `lib/byok/repo.ts` — Supabase data access (server-only).
  - `loadKeyMeta(supabase, userId): Promise<{ mask: string;
    keyVersion: number; updatedAt: string } | null>` —
    returns the masked summary by re-encrypting (no, just
    reads the row and shows ciphertext-derived metadata: we
    store the mask, see Decisions); null on no row.
  - `setKey(supabase, userId, plaintext): Promise<{ mask:
    string; keyVersion: number }>` — encrypts via
    `encrypt.ts`, upserts the row, inserts an audit event
    (`add` if no prior row; `rotate` if replacing).
    Service-role write for the audit row.
  - `deleteKey(supabase, userId): Promise<void>` — deletes
    the row, inserts a `revoke` audit event.
  - `getDecryptedKey(supabase, userId): Promise<string |
    null>` — fetches the row + decrypts. **Server-only;
    used by phase 27's orchestrator.** Never exposed via
    a route handler.
  - `loadRecentAudit(supabase, userId, limit?):
    Promise<AuditEvent[]>` — returns the last N audit
    events (default 5).
- `lib/byok/__tests__/repo.test.ts` — covers each helper
  against a mocked Supabase client; asserts SQL shape;
  asserts the audit row is written for each event.
- `app/api/byok/route.ts` —
  - `POST` — body `{ key: string }`; trims; rejects
    obviously-wrong shapes (`key.startsWith('sk-ant-')`
    advisory but not enforced — see Decisions); calls
    `setKey`; returns the masked summary.
  - `DELETE` — calls `deleteKey`; returns `{ ok: true }`.
  - Both return 503 if `getMasterKey()` is null.
- `app/api/byok/__tests__/route.test.ts` — covers:
  - 401 anonymous on both verbs.
  - 503 when `BYOK_MASTER_KEY` is unset.
  - happy path POST + DELETE.
  - 400 on missing / empty `key` for POST.
- `components/settings/byok-panel.tsx` — client component.
  - Props: `initialMeta: { mask, keyVersion, updatedAt } |
    null`, `audit: AuditEvent[]`, `disabled: boolean`
    (true when `BYOK_MASTER_KEY` is unset).
  - Modes: `unset` (paste form), `set` (masked summary +
    Rotate button toggles back to paste + Revoke button
    with confirm prompt).
  - Calls `/api/byok` POST/DELETE via fetch; on success,
    refreshes via `router.refresh()`.
  - Locked first-run warning copy when transitioning from
    `unset` → `set`: "Once set, the key is used for every
    boardroom session on this account. Anthropic bills
    you for those calls; we don't see or log the key."
- `components/settings/__tests__/byok-panel.test.tsx` —
  asserts mode transitions; asserts disabled state when
  master key absent; mocks fetch.
- `app/app/settings/api-key/page.tsx` — server component.
  - `requireUser`, then loads `loadKeyMeta` +
    `loadRecentAudit`, plus a `disabled` flag from
    `getMasterKey() === null`.
  - Renders breadcrumb (`boardroom · app / settings /
    api-key`), H1 "API key.", and `<ByokPanel>`. Audit
    log rendered below as terse mono rows.
- `app/app/settings/api-key/__tests__/page.test.tsx` —
  mocks `requireUser` + repo helpers; asserts the panel
  + audit log render; asserts the `disabled` state when
  master key absent.
- `app/app/settings/page.tsx` — add one link in the
  Account section: "Manage your Anthropic API key →
  /app/settings/api-key".

**Edited:**

- `plan/bearings.md` — URL contract grows by one row:
  `/app/settings/api-key  BYO Anthropic API key
  (encrypted at rest; revocable; one per account).`
- `e2e/url-contract.ts` — add the new authed-redirect
  entry to keep walker ↔ bearings sync.
- `plan/AUDIT.md` — file one `[operator]` row covering
  both `BYOK_MASTER_KEY` env + `pnpm db:migrate`.

**No new shipped client-side dependencies.** Crypto is
pure Node `crypto`.

## Constants

`lib/byok/master-key.ts`:
```ts
export const BYOK_KEY_VERSION = 1
export const MASTER_KEY_BYTES = 32
export const IV_BYTES = 12
```

`lib/byok/limits.ts` (or inline in encrypt.ts):
```ts
export const MAX_KEY_LENGTH = 256
export const MIN_KEY_LENGTH = 32
```

## Session events + reducer

N/A this phase. Phase 27 adds the "you're paying now"
banner; this phase only ships storage + settings.

## Cross-links

**In** (verify still wired):
- `lib/supabase/auth.ts` `requireUser` — gate every
  surface.
- `lib/supabase/server.ts` — server client used by the
  route handlers + the settings page.

**Out** (ship):
- `/app/settings/api-key` URL family.
- `POST /api/byok` + `DELETE /api/byok`.
- `public.user_api_keys` + `public.user_api_key_audit`
  tables.
- `getDecryptedKey` is the contract phase 27 depends on
  — its shape is locked here.

**Retro-fit:**
- `app/app/settings/page.tsx` adds a single link to the
  new sub-route. Existing tests untouched.

## SEO / metadata

`generateMetadata` returns `{ robots: { index: false,
follow: false }, title: 'API key · boardroom' }` (mirrors
the other `/app/settings/*` pages).

## Hero / body / sub-section composition

```
boardroom · app / settings / api-key

API key.

[unset mode]
  Paste your Anthropic API key. We encrypt it at rest;
  Anthropic bills you for every call once set.

  [ Anthropic API key ………………… ]
  [ Save key ]

[set mode]
  ANTHROPIC KEY
  sk-ant-…XYZW · updated 2026-05-20 14:33 UTC · v1

  [ Rotate ]  [ Revoke ]

  Last 5 events
  ─────────────
  add     2026-05-19  v1
  rotate  2026-05-20  v1
  ...
```

`disabled` mode (BYOK not enabled by operator):
```
BYOK is not enabled on this deployment.
Ask the operator to set BYOK_MASTER_KEY.
```

## Empty / loading / error states

- **No master key:** entire panel renders the "BYOK is
  not enabled" line; buttons hidden.
- **No row yet:** paste form is the default.
- **Has row:** masked summary + Rotate/Revoke; Rotate
  toggles back to the paste form (with the "this will
  replace the existing key" copy locked).
- **Audit log empty:** "no events yet" mono ink-muted.
- **API failure on POST/DELETE:** inline error message
  next to the button; row state unchanged client-side.
- **Tampered ciphertext on read** (decrypt failure in
  phase 27 code path; this phase has no decrypt-at-read
  use case): the metadata loader gracefully renders the
  row's `updated_at` timestamp without attempting to
  decrypt. Mask is stored separately.

## Decisions made upfront — DO NOT ASK

- **AES-256-GCM via Node `crypto`, NOT Supabase Vault.**
  Scout (2026-05-20) pinned this: pgsodium is in pending
  deprecation; `vault.decrypted_secrets` exposes
  plaintext via a view; default Postgres statement
  logging leaks INSERTs. We control the master key out of
  band (env var), not in Postgres.
- **Master key in `BYOK_MASTER_KEY` env var.** Single
  operator; matches the Anthropic-API-KEY-in-env
  precedent. Migration to AWS/GCP KMS later swaps
  `getMasterKey()` without touching the on-disk schema —
  Follow-up.
- **One key per user.** Not per-session, not per-persona.
  Reasons: (a) trivially understood; (b) revoke = delete
  one row; (c) per-session BYOK is a niche use case
  (cost-attribution-by-session matters more than per-
  session key isolation). Per-persona / per-session BYOK
  filed as Follow-up.
- **Store the mask alongside the ciphertext at write
  time.** Reasons: (a) reading "what's the masked
  summary?" doesn't require decrypt; (b) decrypt path is
  only exercised by phase 27's orchestrator at session
  start — keeps the blast radius of a master-key-leak
  audit smaller; (c) `loadKeyMeta` returns from a single
  row read with no key dependency. Schema column:
  `mask text not null`.
- **`key_version` integer column** so master-key
  rotation = bump `BYOK_KEY_VERSION`, write a migration
  that re-encrypts. Default 1.
- **No client-side encryption.** The browser already has
  TLS to the server; doing client-side encryption with a
  key the browser ALSO has to decrypt is theater. The
  server is the trusted boundary.
- **`POST` for set + rotate; `DELETE` for revoke.** REST-
  shaped. The audit event distinguishes `add` vs
  `rotate` based on whether a row existed prior.
- **Both routes hard-disable when `BYOK_MASTER_KEY` is
  unset** with 503 (rather than silently store
  un-encrypted). Fail visible.
- **No `key.startsWith('sk-ant-')` enforcement.** The
  Anthropic key format may change; we don't gatekeep
  it — Anthropic does (the first call fails with 401 if
  the key is bad). Advisory: the paste form's hint copy
  mentions "starts with sk-ant-" but the server doesn't
  reject.
- **MAX_KEY_LENGTH = 256, MIN_KEY_LENGTH = 32.** Bounds
  abuse without rejecting future Anthropic key formats.
- **Audit log capped at 5 in the UI.** Operator-side log
  drill-down isn't part of v1; if needed,
  `loadRecentAudit` already accepts a limit.
- **RLS pins both tables to `user_id = auth.uid()`.**
  `user_api_keys`: full CRUD by owner; service role
  bypasses for system reads (phase 27). Audit table:
  user can SELECT (their own); INSERT only by service
  role (otherwise users could forge audit events).
- **Cascade delete via auth.users FK** so phase 18
  account-deletion auto-purges BYOK + audit. No edit to
  the deletion server action needed.
- **No "your key works" test button at v1.** The first
  real session is the test. Adding a test-call surface
  expands attack surface and burns the user's quota.
  Filed as Follow-up.
- **Revoke requires a confirm dialog.** Native
  `window.confirm` ("Revoke your Anthropic API key?
  Future sessions will fall back to the project key.")
  matches the existing delete-account pattern (phase 18).
- **Settings page link wording: "Manage your Anthropic
  API key →"** — terse, no marketing register.

## Mobile reflow / responsive

The settings panel fits a single column; same shape as
`/app/settings/delete-account`. Native `<input>` + native
confirm dialog — no bespoke mobile work.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/byok/master-key.ts` | returns null for unset / empty / not-base64 / wrong-length; returns 32-byte Buffer for valid | — |
| `lib/byok/encrypt.ts` + `decrypt.ts` | round-trip; auth-tag failure on tampered ciphertext / wrong key; throws if master unset; maskKey shape | — |
| `lib/byok/repo.ts` | loadKeyMeta / setKey / deleteKey / getDecryptedKey / loadRecentAudit each against mocked supabase; audit row written per event | — |
| `app/api/byok/route.ts` | 401 anon, 503 unset-master, 400 missing key, happy POST + DELETE | — |
| `components/settings/byok-panel.tsx` | mode transitions; disabled state; mocked fetch | — |
| `app/app/settings/api-key/page.tsx` | renders panel + audit; disabled state when master unset | — |
| existing redirect specs | confirm `/app/settings/api-key` redirects unauthed to /signin (URL_CONTRACT walker picks this up) | — |

## Hermetic e2e registration

No new hermetic e2e. Authed-only surface; the URL
contract walker's anon-redirect leg is the standing
guard.

## Verify gate

```bash
pnpm verify
```

Runs typecheck → test:run → data:validate → build → e2e.
**Each leg is a hard gate.**

## Commit body template

```
feat: BYO Anthropic API key foundation — phase 26

- db/migrations/20260520_phase_26_byok.sql: user_api_keys
  (one row per user; ciphertext/iv/auth_tag/key_version/mask)
  + user_api_key_audit (event log; SELECT by owner, INSERT
  by service role). RLS pinned to auth.uid(); cascade delete
  via auth.users.
- lib/byok/master-key.ts: BYOK_KEY_VERSION + getMasterKey
  (decodes base64; returns null for unset/wrong-length).
- lib/byok/encrypt.ts + decrypt.ts: AES-256-GCM via Node
  crypto. Random 12-byte IV; auth-tag mismatch throws;
  key-version mismatch throws.
- lib/byok/repo.ts: loadKeyMeta + setKey + deleteKey +
  getDecryptedKey (phase 27 contract) + loadRecentAudit.
  Audit row written for every add/rotate/revoke.
- app/api/byok/route.ts: POST + DELETE; 401 anon, 503 when
  master unset, 400 on empty body.
- app/app/settings/api-key/page.tsx + byok-panel.tsx:
  paste/masked/disabled modes; native confirm on revoke;
  audit log capped at 5 rows.
- plan/bearings.md: URL contract grows by one row.
- e2e/url-contract.ts: new entry to keep walker ↔ bearings
  sync.
- plan/AUDIT.md: new [operator] row for BYOK_MASTER_KEY +
  pnpm db:migrate (both fold into one row).

Decisions:
- AES-256-GCM env-keyed (scout pinned this — Vault's
  pgsodium is pending deprecation; decrypted_secrets view
  + default statement logging are foot-guns for bearer
  tokens).
- Master key in BYOK_MASTER_KEY env (single operator;
  migration to managed KMS later is a getMasterKey swap).
- One key per user; mask stored at write time so the
  metadata loader doesn't touch decrypt.
- Both routes 503 when master unset (fail visible).
- No sk-ant- format enforcement; Anthropic gates the
  first call.
- RLS: owners CRUD their key; audit inserts service-role
  only (no user-forged audit events).
- Cascade delete via auth.users — phase 18 deletion
  auto-purges.
- No "test your key" button at v1.

Phase 27 reads `getDecryptedKey(supabase, userId)` at
session start; this phase locks that contract.

Operator action: set BYOK_MASTER_KEY (`openssl rand
-base64 32`) in .env + Vercel; run pnpm db:migrate.
Until both done, /app/settings/api-key renders "BYOK
not enabled" and rest of the app is unaffected.

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 26's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash.

Add `[operator]` AUDIT row "Enable BYOK: set
BYOK_MASTER_KEY + apply phase-26 migration."

## Follow-ups (out of scope this phase)

- **Phase 27 — orchestrator integration.** Active session
  reads `getDecryptedKey`, instantiates a second
  Anthropic client, logs `key_origin: 'user' | 'project'`
  per session. Already next in the build plan.
- **Migrate to a managed KMS** (AWS KMS / GCP KMS envelope
  encryption). `getMasterKey()` swaps to a per-row DEK
  wrapped by a KEK; on-disk schema stays identical.
- **"Test your key" button** that pings Anthropic with a
  minimal request — useful once enough users actually
  use BYOK to justify expanding the attack surface.
- **Per-persona / per-session BYOK.** Niche; defer until
  user demand exists.
- **Browser-side input masking** that hides the pasted
  key after blur. Pure polish; Native input + autocomplete
  off is enough for v1.
- **Key-version migration helper script** to re-encrypt
  all rows under a new master key during rotation. Ship
  with the first real rotation event, not before.
