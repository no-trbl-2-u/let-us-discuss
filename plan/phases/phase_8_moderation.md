# Phase 8 — Moderation gates (OpenAI omni-moderation pre-filter)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

Every text that crosses a session boundary is gated by an
OpenAI `omni-moderation-latest` call before it is acted on or
rendered. Specifically:

1. **User input → fan-out.** The pitch (on `POST /api/sessions`)
   and every checkpoint answer (on `POST /api/sessions/[id]/answer`)
   are moderated before they touch the orchestrator.
2. **Persona output → render/persist.** Each persona turn is
   moderated *after* the orchestrator collects the full text
   and *before* it persists the row + emits the final
   `turn.end` SSE event.

On a `flagged: true` verdict the session halts with
`session.error code=moderation`, the offending text + verdict
payload + timestamp + sessionId are written to
`public.flag_audit`, and the SSE stream closes. The client
surfaces the polite-refusal copy already wired in 7b's
`SessionErrorCard`.

`OPENAI_API_KEY` must be set in `.env` (local) and Vercel
Project Env (Production + Preview). When unset the moderation
helper falls back to **allow** with a stderr warning — local
dev without an OpenAI key still works; production without the
key short-circuits the moderation gate intentionally, with a
single startup log line. (Bearings flag this as `OK` once
populated; until then we ship the code but log loud.)

## Prerequisite

Phase 7b shipped: the orchestrator (`lib/anthropic/conferring.ts`)
+ both routes + the `SessionErrorCard` that already renders the
`moderation` error code. Phase 7's DB migration applied.

## Dependencies (operator action required for runtime)

- **`OPENAI_API_KEY`** must be populated. Path:
  https://platform.openai.com/api-keys. See `setup/05_openai.md`
  Section A.
- **`OPENAI_MODERATION_MODEL`** defaults to
  `omni-moderation-latest`. Override only if Anthropic publishes
  a moderation endpoint we'd prefer (out of v1 scope).
- **Run the migration** (`db/migrations/20260516_phase_8_flag_audit.sql`)
  against the Supabase project. `setup/03_supabase.md` Section D
  amended in this phase to add the row.

When `OPENAI_API_KEY` is unset, `moderate(text)` returns
`{ flagged: false, allowed: true, source: 'unconfigured' }` and
emits a single `console.warn('[moderation] OPENAI_API_KEY unset — gate is open')`
at process start. Tests assert both paths.

## Routes / endpoints (touched, not added)

- `POST /api/sessions` — adds the input-moderation call on
  `body.pitch` before `createSession`. On flagged: skip insert,
  return `200` with a single-event SSE stream
  (`session.error code=moderation message=<sanitized>`) and a
  `flag_audit` row. (The client renders the same
  SessionErrorCard either way; emitting via SSE keeps the
  failure mode parallel to in-session moderation.)
- `POST /api/sessions/[id]/answer` — adds the input-moderation
  call on `body.body` before delivering the answer to the
  resume map. On flagged: skip the `deliverAnswer` call,
  write a `flag_audit` row, and respond
  `409 { code: 'moderation', message: '<sanitized>' }`. The
  client-side `sendAnswer` surfaces this as a session error;
  the orchestrator's await stays open until the user retries
  with cleaner input or resets.

The orchestrator gains an injected `moderateOutput` hook
(default: real moderation; tests pass a stub) called per
persona turn after the stream completes; on flagged it yields
`session.error code=moderation` and returns.

## Library / helpers (new code)

- `lib/moderation/client.ts` — exports `moderate(text: string,
  context: { sessionId?: string; surface: 'input' | 'output' })`.
  Returns `Promise<ModerationVerdict>` where
  `ModerationVerdict = { flagged: boolean; allowed: boolean;
  source: 'openai' | 'unconfigured'; categories?: Record<string,
  boolean>; raw?: unknown }`. Single dependency: the global
  `fetch`. No SDK install (the OpenAI moderation endpoint is a
  simple POST; pulling the full OpenAI Node SDK for one call is
  weight we don't need).
- `lib/moderation/__tests__/client.test.ts` — covers: API key
  unset → allow + warn (one), 200 with `flagged:true` → flagged,
  200 with `flagged:false` → allowed, network failure → fail
  closed (`flagged:true`, `source:'openai'`, `categories:{}`)
  to bias safety.
- `lib/moderation/audit.ts` — exports `writeFlagAudit(supabase,
  { sessionId, surface, text, verdict })` → inserts one row in
  `public.flag_audit`. Best-effort: an exception logs but does
  not propagate. Tests mock the Supabase client.

## DB schema (new migration)

`db/migrations/20260516_phase_8_flag_audit.sql`:

```sql
create table public.flag_audit (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  surface text not null check (surface in ('input','output')),
  text text not null,
  verdict jsonb not null,
  flagged_at timestamptz not null default now()
);

alter table public.flag_audit enable row level security;

-- Read-only for the owning user (parity with sessions/turns).
create policy flag_audit_self on public.flag_audit
  for select to authenticated using (
    exists (
      select 1 from public.sessions s
       where s.id = flag_audit.session_id and s.user_id = auth.uid()
    )
  );

-- Service-role writes go through the route handler with the
-- caller's Supabase client; RLS lets the owning user insert
-- against their own session.
create policy flag_audit_insert on public.flag_audit
  for insert to authenticated with check (
    exists (
      select 1 from public.sessions s
       where s.id = flag_audit.session_id and s.user_id = auth.uid()
    )
  );
```

The `text` column stores the offending text **verbatim**. That
is a deliberate privacy + compliance call — the audit row
exists *because* the model flagged it; pseudo-anonymizing
defeats retrospective review. The row is RLS-pinned to the
owner; nothing surfaces it in the product UI in v1.

## Orchestrator integration

`lib/anthropic/conferring.ts` gains:

- A new field on `RunConferringInput`:
  `moderateOutput?: (text: string) => Promise<{ flagged: boolean; verdict: unknown }>`.
  Default (in `defaultStreamClient` companion): calls the real
  `moderate` from `lib/moderation/client.ts`. Tests pass a stub.
- After each persona turn's `turn.end` (in `runPersonaTurn`), the
  collected body is moderated. On flagged: yield
  `session.error code=moderation`, call `hooks.markStatus('aborted')`,
  return. The route handler captures the verdict + writes the
  audit row in its `finally`.
- The signature of `runConferring` accepts an optional
  `onFlaggedOutput(text: string, verdict: unknown)` hook so the
  route handler gets the verdict for the audit write.

The route handler wires:

- `moderateOutput` to call `moderate` + `writeFlagAudit` on
  flag.
- The input-moderation call directly in the POST handler
  (before `createSession`).

## Components / handlers (in `components/boardroom/`)

No new files. `SessionErrorCard.bodyFor('moderation')` is
already wired (phase 7b); confirm the copy reads:

> "The session was halted by the moderation gate. Try a
> different pitch or rephrase."

If a sharper copy emerges in code review, override in this
phase's commit.

## Cross-links

**In** (verify still wired):
- Phase 7b: `runConferring`, both routes, `SessionErrorCard`.
- Phase 7a: `lib/sessions/{events,repo}`.

**Out** (this phase ships these):
- `lib/moderation/{client,audit}` — phase 9 anti-abuse limits
  consume the audit table for flag-spike detection
  (oversight escalation per bearings).

**Retro-fit**: none. The `moderation` error code is already
in 7b's reducer surface.

## SEO / metadata / output schema

No new public routes.

## Empty / loading / error states

- **Moderation-flagged input on `/api/sessions`:** SSE stream
  emits exactly one event (`session.error code=moderation`)
  and closes. The orchestrator never starts.
- **Moderation-flagged answer on `/api/sessions/[id]/answer`:**
  409 response, no resume delivered. The orchestrator's
  await stays open until the user retries with cleaner input
  or hits Reset.
- **Moderation-flagged persona output:** orchestrator yields
  `session.error code=moderation` mid-stream, writes audit
  row, marks status `aborted`.
- **Network failure to OpenAI:** fail-closed
  (`flagged:true`). Better a false-positive halt than a
  silent pass-through.

## Decisions made upfront — DO NOT ASK

- **No OpenAI SDK install.** Use the global `fetch` against
  `https://api.openai.com/v1/moderations`. One endpoint, one
  call shape; the full SDK is weight.
- **Unset key → open gate + loud warn.** Local dev without an
  OpenAI key still works (`/api/sessions` runs the
  orchestrator); production without the key short-circuits
  moderation but emits a `console.warn` once per process. This
  is intentional — we don't want a missing env var to take
  the product down. Setup file documents the env-must-be-set
  expectation for production.
- **Verbatim text in audit.** RLS-pinned; no UI exposure in v1.
- **Fail-closed on OpenAI network errors.** Safety bias.
- **Single-text-per-call.** No batching across user + persona
  outputs in v1; the moderation endpoint is cheap and per-turn
  granularity matches the row-per-flag audit shape.
- **No mod-queue UI.** Bearings: "none in v1." Flag rows are
  retrospective.
- **Moderation runs inside the route handler**, not the
  orchestrator (for input) — keeps the orchestrator pure of
  network I/O it doesn't already own.
- **Moderation runs inside the orchestrator (for output)** —
  ordering: stream completes → moderate → emit `turn.end` if
  clean, else `session.error code=moderation`. The user sees
  the partial deltas regardless; that's acceptable because
  the persona's output is already on screen by the time we
  decide. The audit + halt prevent persistence + future turns.
- **Surface label values:** `input` for both the pitch and
  answer routes; `output` for persona text. Two values, one
  enum.
- **Pitch + answer body length cap for moderation** matches
  the existing route limits (`MAX_PITCH_WORDS` already enforced
  at body schema). No separate moderation-side cap.

A brief that leaves Open Qs is a brief that fails its job.

## Mobile reflow / responsive

No new UI; existing SessionErrorCard reflows cleanly on
mobile (phase 7b verified).

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/moderation/client.ts` | unset-key path returns allow + warns once; flagged-200 path returns flagged; allowed-200 path returns allowed; network error returns flagged (fail-closed) | — |
| `lib/moderation/audit.ts` | writes one row with surface + text + verdict; swallows supabase errors with a warn | — |
| `app/api/sessions/route.ts` | (extended) input moderation: flagged pitch → single session.error code=moderation event, no createSession call, audit row attempted | — |
| `app/api/sessions/[id]/answer/route.ts` | (extended) flagged answer body → 409 code=moderation, no deliverAnswer, audit row attempted | — |
| `lib/anthropic/conferring.ts` | (extended) moderateOutput stub returning flagged → orchestrator yields session.error code=moderation after first turn.end, markStatus('aborted') | — |
| `e2e/api-sessions-moderation.spec.ts` | new: anonymous POST still 401 (existing); authed POST with stubbed-flagged input → single session.error event (gated on having a way to flip the moderation stub in the running build — if not, doc gap noted) | — |

## Hermetic e2e registration

No new public-anon e2e beyond the existing 401 spec. The
moderation behavior is unit-tested; an authed e2e remains gated
on the Mailosaur/cookie wiring.

## Verify gate

```bash
pnpm verify
```

All checks pass before commit. No new pnpm add.

## Commit body template

```
feat: moderation gates (OpenAI omni-moderation) — phase 8

- lib/moderation/client.ts: moderate(text, ctx) → ModerationVerdict.
  Fetch against /v1/moderations; unset-key → allow + warn once;
  network error → fail-closed flagged
- lib/moderation/audit.ts: writeFlagAudit(supabase, { sessionId,
  surface, text, verdict }) → public.flag_audit
- db/migrations/20260516_phase_8_flag_audit.sql: flag_audit table
  with RLS pinning visibility + insert to the owning session's user
- /api/sessions: input-moderation gate on body.pitch before
  createSession; flagged → single session.error code=moderation SSE
  event + audit row
- /api/sessions/[id]/answer: input-moderation gate on body.body
  before deliverAnswer; flagged → 409 code=moderation + audit row
- conferring.ts: moderateOutput hook called after each persona
  turn.end; flagged → yield session.error code=moderation, abort
- SessionErrorCard.bodyFor('moderation') copy validated (no change)

Decisions:
- No OpenAI SDK install (one endpoint, raw fetch)
- Unset API key → open gate + loud warn; intentional, documented
- Verbatim text in audit (RLS-pinned, no UI exposure in v1)
- Fail-closed on network errors (safety bias)
- Moderation lives in the route handler for input, the orchestrator
  for output — keeps the orchestrator narrowly scoped

Operator follow-up:
- Apply db/migrations/20260516_phase_8_flag_audit.sql against
  Supabase
- Set OPENAI_API_KEY in .env + Vercel Project Env

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 8's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

## Follow-ups (out of scope this phase)

- Phase 9: per-account quota / per-IP rate-limit / graceful
  wrap UX consume flag spike via /oversight (bearings
  threshold: 10 flagged rows in any 60-min window).
- Phase 17 polish: a per-process gate to suppress duplicate
  unset-key warnings during dev hot-reload.
