# Orchestrator

> **The engine that drives the conversation.** Reads the template,
> instantiates the personas, walks the phases, streams turns as
> SSE events, persists transcripts, hits the moderation gate on
> every input + output, tracks the per-session token budget, and
> emits the final artifacts. This document is the contract —
> implementation notes follow, but the contract is what matters
> for portability.

## What the orchestrator does

In one sentence: it converts `(pitch, personas[], template) →
streamed conversation → three artifacts` while honoring a small
set of runtime budgets and gates.

```
Input:
  pitch        : string                  (user-supplied)
  personas[]   : Persona[]               (user-staffed cast, validated)
  template     : Template                (chosen by the product; validated)

Stream of events:
  session.start
  turn.begin
  turn.delta
  turn.end
  clarify.prompt  ← awaits user answers
  exec-summary    ← awaits user accept/redirect
  artifact
  session.error
  session.done

Persisted state:
  one session row    (sessions table — or equivalent)
  N turn rows        (turns table)
  one artifact row   (artifacts table)
  moderation rows    (flag_audit table, only on suspect verdict)
```

## The full loop

```
┌─────────────────┐
│  retro-review   │  Read project-level retros.md; surface recent
│   (OPTIONAL)    │  "for next time" items to the user as a pre-
│                 │  clarify checkpoint. User picks zero/one/several
│                 │  to address this session.
│                 │  → emits retro-review.prompt; awaits answers
└────────┬────────┘
         ▼
┌─────────────────┐
│   clarify       │  Leads ask 1-4 brief questions each.
│                 │  User answers each in ≤1 sentence.
│                 │  → emits ClarifyPrompt; awaits answers
└────────┬────────┘
         ▼
┌─────────────────┐
│    confer       │  Personas take turns; auto turn-taking by LLM.
│                 │  Bounded by template.turn_budget.
│                 │  → emits turn.begin / turn.delta / turn.end
└────────┬────────┘
         ▼
┌─────────────────┐
│  exec-summary   │  Orchestrator emits a moderator turn summarizing
│   (CHECKPOINT)  │  the conferred shape. Pauses for user.
│                 │  → user accepts → continue to specialists
│                 │  → user redirects → loop back to confer
│                 │     (max user_redirect_max rounds)
└────────┬────────┘
         ▼
┌─────────────────┐
│  specialists    │  Specialist personas drill in. Same turn-budget
│                 │  shape as confer.
└────────┬────────┘
         ▼
┌─────────────────┐
│   artifact      │  Orchestrator (as moderator) assembles four
│                 │  outputs: spec.md + exec summary + call-outs +
│                 │  secretary-log.md (in-session log compiled).
│                 │  → emits artifact event
└────────┬────────┘
         ▼
┌─────────────────┐
│ retrospective   │  Secretary in Mode 2 — single turn reflecting
│   (OPTIONAL)    │  on what went well / didn't / for next time.
│                 │  Orchestrator appends to project-level retros.md.
│                 │  → emits retrospective.complete event
└────────┬────────┘
         ▼
    session.done
```

The **five core phases** (clarify → confer → exec-summary →
specialists → artifact) are the conferring loop proper. The
**two wrapper phases** (retro-review at the start, retrospective
at the end) close the cross-session learning loop. Templates can
include all seven, only the five core, or any subset that makes
sense for the domain. The framework requires `clarify` and
`artifact`; everything else is per-template.

## Contract — what the engine must provide

The orchestrator is an **async generator** that yields SSE events
and accepts user input via an `awaitAnswer` callback. The full
TypeScript shape:

```ts
type RunConferringInput = {
  pitch: string
  personas: Persona[]              // must include exactly one role: secretary
  template: Template
  hooks: ConferringHooks
  awaitAnswer(): Promise<AnswerInput>
  client?: LLMStreamClient         // Anthropic SDK by default
  moderateOutput?: (text: string) => Promise<ModerationCheck>
  onFlaggedOutput?: (text: string, verdict: unknown) => Promise<void>
}

type ConferringHooks = {
  persistTurn(turn: RecordedTurn & { idx: number }): Promise<void>
  persistArtifact(artifact: {
    specMd: string
    execSummary: string
    callouts: string
    secretaryLog: string           // always present (secretary required)
    tokensUsed: number
  }): Promise<void>
  markStatus(status: SessionStatus): Promise<void>

  // Cross-session retros (required when template includes retro-review
  // or retrospective phase; can be no-ops otherwise).
  loadRetros(): Promise<Retro[]>
  appendRetro(entry: Retro): Promise<void>
}

async function* runConferring(
  input: RunConferringInput,
): AsyncGenerator<SessionEvent>
```

The host (a Next.js route handler, an Express endpoint, a CLI
runner — whatever) wires:

- An **LLM streaming client** (Anthropic SDK or compatible).
- A **moderation gate** (OpenAI omni-moderation or equivalent).
- A **persistence layer** (Postgres / SQLite / file-based) behind
  the hooks.
- An **answer-routing channel** (an in-memory promise map, a
  Redis pub/sub, whatever) that feeds user answers back to the
  generator via `awaitAnswer`.

## Streaming SSE event types

The orchestrator yields events the host sends as Server-Sent
Events to the client. The locked event shapes:

```ts
type SessionEvent =
  | { type: 'session.start'; sessionId: string }
  | { type: 'retro-review.prompt';
      items: Array<{ id: string; text: string; seen_in_retros: number }> }
  | { type: 'turn.begin'; turnId: string; phase: SessionPhase;
      author: TurnAuthor; personaSlug: string | null;
      replyingTo: string | null }
  | { type: 'turn.delta'; turnId: string; delta: string }
  | { type: 'turn.end'; turnId: string; tokens: number }
  | { type: 'clarify.prompt'; questions: string[] }
  | { type: 'exec-summary'; body: string }
  | { type: 'artifact'; specMd: string; execSummary: string;
      callouts: string; secretaryLog: string }
  | { type: 'retrospective.complete'; sessionId: string }
  | { type: 'session.error'; code: ErrorCode; message: string }
  | { type: 'session.done' }
```

`TurnAuthor` extends to include `'secretary'`:
```ts
type TurnAuthor = 'persona' | 'user' | 'moderator' | 'secretary'
```

`SessionPhase` extends to include the wrapper phases:
```ts
type SessionPhase =
  | 'retro-review' | 'clarify' | 'confer' | 'exec-summary'
  | 'specialists' | 'artifact' | 'retrospective'
```

The `secretaryLog` field on `artifact` is now **always present**
(the secretary is required; the four-artifact shape is the
canonical output). Hosts that previously consumed the
three-artifact shape need a one-time update.

The client renders `turn.delta` chunks into a live transcript
bubble; `clarify.prompt` and `exec-summary` events surface as
forms.

## Secretary turns

When the persona cast includes a `role: secretary` persona, the
orchestrator runs a **side-channel turn** at each phase boundary
(after `clarify`, after `confer`, after the `exec-summary`
checkpoint resolves, after `specialists`). The secretary does NOT
participate in regular turn-taking inside a phase.

### Invocation pattern

```
phase ends
  → orchestrator yields control to the secretary
  → constructs prompt:
       SYSTEM: <secretary persona's systemPrompt>
       USER:   <transcript-since-last-secretary-turn>
               + "phase: <name>. Emit your structured log entry."
  → streams the response as a secretary turn
  → persists it with `phase: 'secretary'` and the regular turn shape
  → next phase begins
```

The secretary's stream goes out as `turn.begin` / `turn.delta` /
`turn.end` events with `author: 'secretary'` (a new author value
alongside `persona`, `user`, `moderator`). Hosts that don't want
the secretary turns rendered in the live transcript can filter on
`author === 'secretary'` and route those to a side panel instead.

### Output shape

The secretary's turn body is a single structured-log block:

```
=== Secretary log — phase: confer ===

Critiques:
- SE noted: token cost at 100 sessions/day is unbudgeted [open]
- (or: "(none)")

Audits:
- Claim: Anthropic Claude 4.7 input rate is $15/MTOK. Source: cited. Confidence: high
- (or: "(none)")

Out-of-scope:
- Deferred: per-account quota dashboard. Reason: out of v1. Revisit: post-v1
- (or: "(none)")

Decisions:
- Q: how many personas per session? A: 2-6 staffed. Alternative: unlimited
- (or: "(none)")
```

The four-taxonomy shape is locked. The persona's system prompt
enforces the format; the orchestrator does NOT post-process or
re-format the output.

### Artifact phase — the secretary log

At the `artifact` phase, the orchestrator yields control to the
secretary one more time with the instruction "compile the running
log." The secretary emits the cumulative `secretary-log.md`
content, which the orchestrator surfaces as a **fourth artifact**
alongside `spec.md`, the executive summary, and call-outs.

The artifact event becomes:

```ts
{
  type: 'artifact',
  specMd: string,
  execSummary: string,
  callouts: string,
  secretaryLog?: string   // present iff the session staffed a secretary
}
```

The `secretaryLog?` field is optional so sessions without a
secretary keep the three-artifact shape.

### Why a side channel, not a regular turn

A secretary persona that takes regular turns inside `confer` /
`specialists` would derail the personas' arguments — the
record-keeper interrupting to confirm what was just said. The
side-channel design keeps the conferring flow intact while still
producing the audit trail.

### Counting against budgets

Secretary turns consume tokens (input: transcript so far; output:
the log entry). They count against `MAX_SESSION_TOKENS` like any
other turn. Budget-conscious products can set a sub-cap on
secretary tokens (e.g., 10% of the session budget) and have the
secretary emit shorter entries when approaching the sub-cap.

### Required, not optional

**Every session must staff exactly one secretary persona.** The
orchestrator validates the cast on session start and refuses to
proceed if no `role: secretary` is present (or if more than one
is). This is a framework rule, not a per-template option. See
PERSONA-FORMAT.md §Role/secretary for the rationale.

## Cross-session retros

When the template includes a `retro-review` phase (first) and/or
a `retrospective` phase (last), the orchestrator wires the
**cross-session learning loop** through a project-level
`retros.md` file.

### The file

`retros.md` lives at the project root by default (path is
configurable). Append-only. Format:

```markdown
# Session retrospectives

> Append-only. One entry per concluded session. The orchestrator
> reads recent entries on session start; the secretary appends a
> new entry on session end.

---

## 2026-05-19T14:32:00Z — session abc123…

Pitch: "What we're building is a..."

### What went well
- ...
- ...
- ...

### What didn't
- ...
- ...

### For next time
- ...
- ...
- ...

---

## 2026-05-18T11:05:00Z — session xyz789…
...
```

The file does NOT live in the database — it lives in the
filesystem (or equivalent durable store) so it survives
DB resets, schema migrations, and operator hand-offs. Treat it
as a textual artifact of the same class as `spec.md`.

### Pre-session: the `retro-review` phase

If the template includes a `retro-review` phase as the first
phase, the orchestrator:

1. Reads `retros.md` (host provides via the `loadRetros()` hook).
2. Extracts the most-recent N retros' "for next time" items
   (N = `template.phases[retro-review].retro_review_recent_n`,
   default 5).
3. Deduplicates by string-similarity (so the same carry-forward
   appearing across multiple retros surfaces once with a count).
4. Emits a `retro-review.prompt` event listing up to 6 items.
5. Awaits a `RetroReviewAnswer` (which items to address +
   one sentence each on how).

```ts
type RetroReviewPrompt = {
  type: 'retro-review.prompt'
  items: Array<{
    id: string             // hash-of-text
    text: string           // the "for next time" line
    seen_in_retros: number // 1+ if repeated across sessions
  }>
}

type RetroReviewAnswer = {
  kind: 'retro-review'
  picks: Array<{
    item_id: string
    response: string       // 1 sentence
  }>
}
```

The user's picks become **prepended context** for the clarify
phase. Lead personas see:

```
The user is starting a new session. From recent retros:
- "<item.text>" → user wants to address: "<item.response>"
- ...

The pitch is: "<pitch>"
```

If `retros.md` is empty (first session for this project) or the
hook returns no recent items, the orchestrator skips the phase
silently and jumps to clarify.

### Post-session: the `retrospective` phase

If the template includes a `retrospective` phase as the final
phase, the orchestrator:

1. Yields control to the secretary in Mode 2.
2. Constructs the prompt:
   ```
   SYSTEM: <secretary persona's systemPrompt>
   USER:   Mode: retrospective.
           Session ID: <id>
           Pitch: <pitch>
           Transcript: <full transcript>
           In-session log: <accumulated secretary log>
           Artifacts: <spec.md + exec summary + call-outs>
           Now emit a single retrospective entry per Mode 2.
   ```
3. Streams the response (one turn).
4. Calls `hooks.appendRetro(entry)` to persist to `retros.md`.
5. Emits a `retrospective.complete` event.
6. `session.done` follows.

### The hooks

Two new hooks complete the cross-session contract:

```ts
type ConferringHooks = {
  // ...existing hooks (persistTurn / persistArtifact / markStatus)

  loadRetros(): Promise<Retro[]>           // pre-session read
  appendRetro(entry: Retro): Promise<void> // post-session write
}

type Retro = {
  session_id: string
  written_at: string  // ISO timestamp
  pitch_excerpt: string  // first 60 chars
  went_well: string[]
  didnt: string[]
  for_next_time: string[]
}
```

The host implements `loadRetros` / `appendRetro` against
`retros.md` directly (`fs.readFile` / `fs.appendFile` in a
Node.js host; equivalent in any other stack). Both can be no-ops
if the host doesn't want cross-session memory; the orchestrator
treats empty returns as "no prior context."

### Why a file, not a database

Three reasons:

1. **Survives DB resets.** A session log that lives in Postgres
   gets wiped if you reset the DB. The retros file is the
   audit trail — losing it negates the system's ability to
   learn over time. Filesystem is more durable than the DB
   schema across migrations and resets.

2. **Human-readable.** A user can `cat retros.md` and see what
   their last 10 sessions tried to learn. They can edit by hand
   to suppress noise or add their own carry-forwards.

3. **Git-trackable.** The retros file commits to the repo
   alongside the code. Project history captures both what was
   built and what was learned along the way.

### How the loop closes

```
Session N starts
  └─ retro-review reads retros.md (sessions 1..N-1)
     └─ surfaces "for next time" to user
        └─ user picks zero/some
           └─ picks become clarify context
              └─ ... session runs normally ...
                 └─ retrospective writes new entry
                    └─ appended to retros.md
                       └─ feeds session N+1's retro-review
```

The first session for a project sees an empty file → the phase
skips silently. The tenth session sees nine prior retros → the
phase has rich context to surface. The **value of the framework
compounds with use**: each session makes the next one start
smarter.

### Pre-session bypass

Templates can opt out of `retro-review` by simply omitting the
phase. Common reasons:

- The session is intentionally independent (one-off
  post-mortems, where prior post-mortems shouldn't bias the
  current one).
- The user is starting a fresh experiment and explicitly wants
  to ignore prior learning.
- The product is in a content-creation domain (writers' room,
  screenplay arc) where retros from prior arcs would derail the
  creative flow.

When omitted, the cross-session loop is half-closed: the
`retrospective` phase still writes new retros, but they don't
get surfaced. This is fine; the file is still a useful audit
trail even without the read side.

## Turn-taking inside a phase

Inside `confer` and `specialists`, who speaks next is decided by
the LLM, not the orchestrator. The orchestrator constructs a
single prompt of the form:

```
SYSTEM: <selected persona's systemPrompt>
USER:   <pitch + transcript-so-far + "now speak for <name>">
```

…and streams the response as that persona's turn. After each
turn, the orchestrator picks the next persona using a small
heuristic (round-robin within the lead/specialist subset, with a
nudge toward whoever was most-cited in the previous turn).

This is intentionally simple. More sophisticated patterns
(e.g., explicit moderator-mediated turn-allocation) are possible
but unnecessary for v1.

## Convergence detection

After each `confer` or `specialists` turn, the orchestrator
computes a lightweight **agreement score** over the last N turns
(default: last 4). The heuristic:

- Count nouns/verbs that recur ≥2 times across turns.
- Divide by the total noun/verb count.
- Result is a 0–1 ratio.

If the ratio falls below `template.escalation.convergence_min_agreement`
(default 0.7) AND there's still turn budget, the orchestrator
emits a **moderator turn** that names the disagreement explicitly
and asks the user to break the tie (this counts against
`user_redirect_max`).

This is a heuristic, not a guarantee. The fallback is the
exec-summary checkpoint where the user can always redirect.

## Moderation gate (two-sided)

Every user input AND every persona output passes through a
moderation pre-filter before being persisted/rendered. The
contract:

```ts
type ModerationCheck = {
  flagged: boolean
  verdict: unknown            // provider's full payload
}

async function moderateOutput(text: string): Promise<ModerationCheck>
```

The default impl uses OpenAI's `omni-moderation-latest` endpoint;
the orchestrator works with any equivalent (Anthropic's
moderation, Mistral's, a self-hosted classifier).

On `flagged: true`:

1. The orchestrator emits `session.error code=moderation`.
2. Writes a `flag_audit` row via the `onFlaggedOutput` hook with
   the offending text + verdict payload + timestamp.
3. Calls `hooks.markStatus('aborted')`.
4. Returns (the generator ends; no further turns).

The polite-refusal UI is the host's job. The orchestrator's job is
to halt cleanly.

## Token budget

Every session has a hard `MAX_SESSION_TOKENS` cap (default 60,000).
The orchestrator maintains a `BudgetTracker`:

```ts
class BudgetTracker {
  add(tokens: number): void
  snapshot(): { used: number; max: number; wrapped: boolean }
}
```

Each LLM response's input+output tokens are added. When `used`
crosses `max`:

1. The current turn finishes (no mid-turn cutoff).
2. The orchestrator jumps to the `artifact` phase early.
3. The artifact reflects "session ended early — here's what we
   have" with the partial spec.
4. `session.done` emits normally.

This is the **graceful wrap**. The user always gets artifacts,
even when the conversation didn't fully converge.

## Resume + answer-feeding

The user-facing checkpoints (`clarify.prompt`, `exec-summary`)
need user input mid-session. The orchestrator handles this via
`awaitAnswer()`:

```ts
input.awaitAnswer(): Promise<AnswerInput>
```

The host implements this however fits its stack:

- **In-memory promise map** (boardroom's choice) — works for a
  single-server deploy; a Map keyed by sessionId of pending
  promises that the API answer-endpoint resolves.
- **Redis pub/sub** — works across multiple servers; the
  answer-endpoint publishes; the orchestrator subscribes.
- **Database polling** — simplest, slowest; the orchestrator
  polls a `pending_answers` table.

The orchestrator doesn't care. It just `await`s.

## Failure modes

The orchestrator emits `session.error` and halts cleanly on:

| Code | Cause | Host response |
|---|---|---|
| `anthropic-config` | API key missing / rejected | Surface to user; offer sign-in or retry later |
| `moderation` | Input or output flagged | Show polite-refusal copy; do not retry |
| `internal` | Unexpected exception | Surface generic error; log full stack |
| `budget` | Token budget exhausted mid-phase (rare) | Should not happen with graceful wrap; if it does, treat as `internal` |

In all error cases, the orchestrator calls
`hooks.markStatus('aborted')` before returning.

## Reference implementation

The boardroom build ships `lib/anthropic/conferring.ts` — a
~600-line TypeScript reference impl that hits this contract. It
uses:

- `@anthropic-ai/sdk` for streaming.
- A custom `BudgetTracker` class.
- An in-memory `resume-map` for `awaitAnswer`.
- OpenAI omni-moderation for the gate.
- SSE via Next.js's `ReadableStream`.

Adapt as needed. The contract above is more important than the
specific code shape; an implementation in Python, Go, or Rust
that hits the same interface ships boardroom-style sessions just
as well.

## What the orchestrator is NOT

- **Not the UI.** The host renders persona cards, transcript
  bubbles, the clarify form, the exec-summary card, the artifact
  preview tiles. The orchestrator emits events; the UI consumes
  them.
- **Not the auth layer.** The host gates the session creation
  endpoint by `requireUser()` or equivalent.
- **Not the persona registry.** Personas come in from the caller;
  the orchestrator never reads from `personas/<slug>.md` itself.
- **Not the template router.** Templates come in too; multi-
  template products route by URL slug at the host layer.

## Design notes — why this shape

**Async generator yields events** — Pulling events out one at a
time lets the host pipe them straight to SSE without a queue
abstraction. Backpressure is the host's problem.

**Personas as data, not callbacks** — The orchestrator takes
`Persona[]` as plain data, not a registry. The host loads
personas however it wants (file-based / database / generated).

**Template as data, not workflow code** — The template is JSON
config. Adding a new template is a JSON file, not a code change.
Editing turn budgets is a numeric edit.

**Hooks for I/O** — `persistTurn` / `persistArtifact` /
`markStatus` are async hooks because every host's DB layer
differs. The orchestrator never imports a database client.

**Moderation as a callback** — Passing `moderateOutput` as input
lets you swap providers (OpenAI, Anthropic, self-hosted) without
touching the engine. Stub for tests; production wires the real
client.

## File layout for a reference implementation

```
lib/
├── orchestrator/
│   ├── conferring.ts          ← the engine (this contract)
│   ├── budget.ts              ← BudgetTracker
│   ├── events.ts              ← SessionEvent type definitions
│   └── resume-map.ts          ← in-memory awaitAnswer impl
├── personas/
│   └── load.ts                ← reads personas/*.md, validates,
│                                returns Persona[]
└── templates/
    └── load.ts                ← reads templates/*.json, validates,
                                  returns Template
```

This is one viable layout. Yours can differ.
