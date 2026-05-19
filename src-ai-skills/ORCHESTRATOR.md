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

## The five-phase loop

```
┌───────────────┐
│   clarify     │  Leads ask 1-4 brief questions each.
│               │  User answers each in ≤1 sentence.
│               │  → emits ClarifyPrompt events; awaits answers
└───────┬───────┘
        ▼
┌───────────────┐
│    confer     │  Personas take turns; auto turn-taking by LLM.
│               │  Bounded by template.turn_budget.
│               │  → emits turn.begin / turn.delta / turn.end
└───────┬───────┘
        ▼
┌───────────────┐
│  exec-summary │  Orchestrator emits a moderator turn summarizing
│   (CHECKPOINT)│  the conferred shape. Pauses for user.
│               │  → user accepts → continue to specialists
│               │  → user redirects → loop back to confer
│               │     (max user_redirect_max rounds)
└───────┬───────┘
        ▼
┌───────────────┐
│  specialists  │  Specialist personas drill in. Same turn-budget
│               │  shape as confer.
└───────┬───────┘
        ▼
┌───────────────┐
│   artifact    │  Orchestrator (as moderator) assembles three
│               │  outputs: spec.md + exec summary + call-outs.
│               │  → emits artifact event
└───────────────┘
        ▼
   session.done
```

## Contract — what the engine must provide

The orchestrator is an **async generator** that yields SSE events
and accepts user input via an `awaitAnswer` callback. The full
TypeScript shape:

```ts
type RunConferringInput = {
  pitch: string
  personas: Persona[]
  template: Template
  hooks: ConferringHooks
  awaitAnswer(): Promise<AnswerInput>
  client?: LLMStreamClient        // Anthropic SDK by default
  moderateOutput?: (text: string) => Promise<ModerationCheck>
  onFlaggedOutput?: (text: string, verdict: unknown) => Promise<void>
}

type ConferringHooks = {
  persistTurn(turn: RecordedTurn & { idx: number }): Promise<void>
  persistArtifact(artifact: {
    specMd: string
    execSummary: string
    callouts: string
    tokensUsed: number
  }): Promise<void>
  markStatus(status: SessionStatus): Promise<void>
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
  | { type: 'turn.begin'; turnId: string; phase: SessionPhase;
      author: TurnAuthor; personaSlug: string | null;
      replyingTo: string | null }
  | { type: 'turn.delta'; turnId: string; delta: string }
  | { type: 'turn.end'; turnId: string; tokens: number }
  | { type: 'clarify.prompt'; questions: string[] }
  | { type: 'exec-summary'; body: string }
  | { type: 'artifact'; specMd: string; execSummary: string;
      callouts: string }
  | { type: 'session.error'; code: ErrorCode; message: string }
  | { type: 'session.done' }
```

The client renders `turn.delta` chunks into a live transcript
bubble; `clarify.prompt` and `exec-summary` events surface as
forms.

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
