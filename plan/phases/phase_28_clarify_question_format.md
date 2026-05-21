# Phase 28 — `CLARIFY-QUESTION-FORMAT.md` (nexus's "asking-well" rules for runtime leads)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

1. **A new portable-spec doc at
   `src-ai-skills/CLARIFY-QUESTION-FORMAT.md`** that
   formalizes how lead personas should shape clarify
   questions: 1–4 questions per batch, a recommended option
   first (marked `(Recommended)`), each option's description
   names the trade-off, and 2–4 sentences of prose framing
   before the question. Mirrors nexus's
   `concepts/asking-well.md` for the runtime side.
2. **`PERSONA-FORMAT.md` Role/lead section references the
   new doc** so the framework spec stays coherent.
3. **A one-paragraph reminder in each lead persona body**
   (`personas/product-lead.md`,
   `personas/skeptical-engineer.md`, plus their
   `src-ai-skills/personas/` siblings) points at the format
   without re-deriving it.
4. **A lightweight orchestrator-side soft-enforcement
   validator** — `lib/anthropic/clarify-validator.ts` — that
   inspects a clarify prompt's text and emits a structured
   log (`logError('orchestrator', ...)` with a
   `clarify-format` advisory tag) when the question is
   missing a `(Recommended)` marker or a trade-off
   description. **Soft-enforcement only**: the orchestrator
   does not retry or reject; it logs and proceeds. The hard
   vs soft decision is resolved here (see Decisions).
5. **`plan/AUDIT.md`'s `[needs-user-call]` row for the three
   framework-spec questions** is updated: Q2 (hard vs soft
   enforcement) is marked resolved with a pointer to this
   phase's commit. Q1 (bearings.md scope) and Q3 (autonomy
   spectrum) remain pending — each gates a different
   candidate.

## Prerequisite

Phases 1–27 shipped. `lib/anthropic/conferring.ts` exists
with a clarify phase already gated by
`lead_round_max_questions` and the "≤1 sentence answer"
template constraint. The runtime persona files
(`personas/<slug>.md`) are loaded via `loadPersonas`. The
src-ai-skills/ framework spec is the **single source of
truth** per phase 20.

**Scout pass not required.** Source material lives in the
phase-candidate row (`plan/PHASE_CANDIDATES.md` Promoted
section, Idea 1) and in the project's existing
clarify-template constraints. Everything needed to write the
doc is in-repo.

## Dependencies (operator action required for runtime)

- **None.** This phase is pure docs + a soft-enforcement
  log line. No new env vars, no migration, no operator
  action. The verify gate alone gates the ship.

## Routes / endpoints (locked from bearings)

**No new URLs.** No edits to the URL contract.

## Library / helpers (new code)

**Created:**

- `src-ai-skills/CLARIFY-QUESTION-FORMAT.md` — 80–120
  lines. Sections:
  - **What this constrains.** Sets scope: clarify-phase
    lead personas asking questions to the user. Not
    persona↔persona dialogue; not the exec-summary
    checkpoint (which already has its own shape).
  - **Format rules** (numbered):
    1. **Batch size**: 1–4 questions per checkpoint.
       Composes with the template-level
       `lead_round_max_questions` (currently 4).
    2. **Answer shape**: every question accepts a 1-word
       or 1-sentence answer. (Reaffirms the existing
       template constraint.)
    3. **Recommended option first**: when the question is
       a closed multiple-choice, list 2–4 options; mark
       one `(Recommended)` and put it first. Free-form
       questions (project name, audience description)
       skip this rule.
    4. **Trade-off in option descriptions**: each option's
       one-line description names what it gets at the cost
       of what it doesn't. Not "Option A is good"; "Option
       A — faster but less flexible."
    5. **Prose preamble**: 2–4 sentences of context
       before the question. Names what's being decided
       and why it matters now. No more — clarify is not a
       conference talk.
  - **Why** (one paragraph). The nexus dev-side experience
    pinned 45s/checkpoint for free-form vs 15s/checkpoint
    for ranked-ballot questions — roughly the difference
    between "fits the user's attention budget" and
    "doesn't." Boardroom borrows that lesson for the
    runtime.
  - **What this does NOT constrain.** Persona-internal
    reasoning (the body of the system prompt). Confer-phase
    persona-to-persona dialogue. Exec-summary checkpoint
    (separate shape; one accept/redirect ballot, no
    multi-options).
  - **Worked example.** One concrete clarify question
    rewritten from free-form to the new format. Two
    versions: a multi-choice rewrite + a free-form
    question that legitimately skips rules 3 + 4.
  - **Enforcement.** Soft. The orchestrator logs missing
    `(Recommended)` / trade-off via
    `logError('orchestrator', ..., { tag: 'clarify-format' })`
    but does not reject or retry. The personas are trusted
    to follow the format; the validator surfaces drift in
    the log drain so we can tighten if needed.
- `lib/anthropic/clarify-validator.ts` — server-only,
  pure-function module.
  - `validateClarifyFormat(text: string): ClarifyFormatReport`
    — scans the text for `(Recommended)` substring and for
    at least one `—` or `:` delimited option line; returns
    `{ hasRecommended: boolean; hasTradeoffOptions:
    boolean; isFreeForm: boolean }`. `isFreeForm` is a
    heuristic: true when the text lacks any bulleted /
    numbered list AND ends in a question mark.
  - `logClarifyFormatIssues(report: ClarifyFormatReport,
    context: { sessionId: string; personaSlug: string |
    null }): void` — emits one structured log line via
    `logError('orchestrator', new Error(message), { tag:
    'clarify-format', ... })` when `!isFreeForm &&
    (!hasRecommended || !hasTradeoffOptions)`. No-op
    otherwise.
  - Pure / synchronous; no SDK dependencies.
- `lib/anthropic/__tests__/clarify-validator.test.ts` —
  covers:
  - `validateClarifyFormat` detects `(Recommended)` /
    absence.
  - detects bulleted options with trade-off text vs
    bulleted options without.
  - flags `isFreeForm = true` on a single-paragraph
    question.
  - `logClarifyFormatIssues` is silent on free-form
    questions even when no `(Recommended)` is present.
  - `logClarifyFormatIssues` is silent on a fully
    well-formed multi-choice question.
  - `logClarifyFormatIssues` emits exactly one line on a
    malformed multi-choice question.

**Edited:**

- `src-ai-skills/PERSONA-FORMAT.md` — under the
  `### lead` heading, add one bullet:
  - "Clarify-phase questions follow
    `CLARIFY-QUESTION-FORMAT.md`. Soft-enforced — the
    orchestrator logs format drift but does not reject."
- `personas/product-lead.md` — one paragraph appended
  near the end of the body (before any "## Tone"
  section if present): "When you run the clarify
  phase, follow `CLARIFY-QUESTION-FORMAT.md`: 1–4
  questions, the recommended option first, each option
  names its trade-off, and 2–4 sentences of context
  before the ask."
- `personas/skeptical-engineer.md` — same paragraph,
  with one sentence's adaptation (skeptical-engineer
  pushes on cost / failure-mode trade-offs, so the
  paragraph names that domain).
- `src-ai-skills/personas/product-lead.md` — same
  edit as the runtime copy.
- `src-ai-skills/personas/skeptical-engineer.md` —
  same edit as the runtime copy.
- `lib/anthropic/conferring.ts` — invoke
  `validateClarifyFormat` + `logClarifyFormatIssues`
  after each clarify-phase turn lands. Single call
  site, single line, sub-microsecond cost. No retry
  logic — soft-enforce only.
- `plan/AUDIT.md` — the `[needs-user-call]` row "Three
  framework-spec questions raised by the distilled
  nexus-porting analysis" gets a "Pass-resolved: Q2
  resolved by phase 28 (`<commit-hash>` — soft-enforce
  picked over hard-enforce; see brief Decisions)." line
  appended. Q1 + Q3 stay pending. Row remains
  `[needs-user-call]` until Q1 and Q3 are resolved
  (when Ideas 2 and 7 are promoted).

**No new shipped client-side dependencies.** Pure
markdown + a tiny pure-function module.

## Constants

`lib/anthropic/clarify-validator.ts`:
```ts
export const RECOMMENDED_MARKER = '(Recommended)'
export const CLARIFY_FORMAT_TAG = 'clarify-format'
```

## Cross-links

**In** (verify still wired):
- `lib/observability/log.ts` `logError` — soft-enforce
  surface.
- `lib/anthropic/conferring.ts` — clarify-phase turn
  emit point. Adding one line.

**Out** (ship):
- `src-ai-skills/CLARIFY-QUESTION-FORMAT.md` — new
  spec doc.
- `lib/anthropic/clarify-validator.ts` —
  `validateClarifyFormat` + `logClarifyFormatIssues`.

**Retro-fit:**
- `src-ai-skills/PERSONA-FORMAT.md` — one bullet under
  the `lead` heading.
- `personas/*.md` (lead pair) — one appended paragraph
  each.
- `src-ai-skills/personas/*.md` (lead pair) — same
  edit.
- `lib/anthropic/conferring.ts` — one call site for
  the soft-enforce logger.
- `plan/AUDIT.md` — partial-resolve note on the
  framework-spec questions row.

## SEO / metadata

N/A. No new URL surfaces.

## Hero / body / sub-section composition

N/A. No new UI surfaces.

## Empty / loading / error states

- **Free-form clarify question (no options at all):**
  validator's heuristic flags it as `isFreeForm = true`;
  no log line. Personas legitimately ask free-form
  questions ("What's the working name for this?") and
  those should not be flagged.
- **Multi-choice question missing `(Recommended)`:** log
  line emits with `tag: 'clarify-format'` +
  `missing: 'recommended'`. Session continues.
- **Multi-choice question with options but no trade-off
  text:** log line emits with
  `missing: 'tradeoff-descriptions'`. Session continues.
- **Both missing:** one log line, `missing:
  'recommended-and-tradeoff'`.
- **Persona system prompt fails to follow the format
  consistently:** acceptable in v1 (soft-enforce). The
  log drain is the signal; if drift is high, the next
  /iterate tick can tighten persona body copy.

## Decisions made upfront — DO NOT ASK

- **Soft-enforce, not hard-enforce.** The
  candidate row + AUDIT `[needs-user-call]` Q2 explicitly
  posed this trade-off. Hard-enforce would reject the
  persona's clarify output and retry; that adds latency
  on every malformed turn and turns one persona drift
  into a full re-stream. Soft-enforce ships a doc +
  persona-body reminder + a log line that surfaces drift.
  If drift becomes a real signal in the log drain after a
  few weeks of use, hard-enforce is a follow-up. The
  v1 trade-off is: cheaper happy path, slightly looser
  format guarantee. We accept that.
- **`(Recommended)` is the literal marker.** Not "rec",
  not a unicode glyph. Pins to the nexus dev-side
  convention exactly so the doc reads as a port, not a
  reinvention.
- **The validator runs once per clarify-phase turn**,
  not per token or per stream chunk. The orchestrator
  has the full text after the turn finalizes.
- **The validator is pure**, not async. No I/O, no SDK.
  Calling it on every clarify turn costs sub-microseconds.
- **Doc lives in `src-ai-skills/`, not in `plan/`.** The
  framework spec is the single source of truth; nexus's
  asking-well.md sits in `concepts/`, so the boardroom
  equivalent lives in the framework spec dir. The
  related AUDIT question Q1 (bearings.md as portable
  spec vs product-only) stays out of scope here — that
  gates Idea 2.
- **Personas keep their existing voice.** The appended
  paragraph names the format briefly and points at the
  doc; we do not re-derive the rules in each persona
  body. (Mirrors the existing pattern where personas
  don't re-state the template constraints.)
- **Both runtime and framework persona copies are
  edited in this phase.** Phase 20's "src-ai-skills as
  single source of truth" implies the framework copy
  is authoritative, but the runtime copy is what
  `loadPersonas` reads at session-create. Keeping both
  in sync within this phase avoids drift; a future
  phase could collapse them via a build step (filed as
  follow-up).
- **No persona-test changes.** Phase 20's vitest harness
  validates schema shape, not body content. The new
  paragraph is body markdown; no schema change.
- **No update to `templates/pitch-to-spec.json`.** The
  template already pins `lead_round_max_questions` +
  "1-word or 1-sentence answer" copy. The new doc adds
  shape/quality rules on top — no template-level field
  to add.
- **`isFreeForm` heuristic** is intentionally simple:
  text has no `\n- ` or `\n1. ` lines AND ends with
  `?`. False negatives (we under-flag free-form) are
  fine. False positives (we over-flag) would cause
  noisy logs; the heuristic errs on the under-flag
  side.
- **The log tag is `'clarify-format'`** so the
  observability layer can filter without grepping the
  message body.
- **No new `LogScope` value.** We reuse `'orchestrator'`
  since this is an orchestrator-side observation. The
  `tag: 'clarify-format'` context field is the slice.

## Mobile reflow / responsive

N/A.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/anthropic/clarify-validator.ts` | `(Recommended)` detection; trade-off-options detection; `isFreeForm` heuristic; `logClarifyFormatIssues` silent on free-form / well-formed; emits one line on malformed | — |
| `src-ai-skills/CLARIFY-QUESTION-FORMAT.md` | none — pure docs | — |
| `personas/*.md` body edits | existing persona schema test still passes | — |
| `lib/anthropic/conferring.ts` clarify call-site | existing conferring tests still pass; no new test (the soft-enforce log line is observability, not behavior) | — |

## Hermetic e2e registration

No new hermetic e2e. The orchestrator's clarify path is
already exercised; this phase only adds a
non-behaviorally-significant log emit.

## Verify gate

```bash
pnpm verify
```

Runs typecheck → test:run → data:validate → build → e2e.
**Each leg is a hard gate.**

## Commit body template

```
feat: CLARIFY-QUESTION-FORMAT.md + soft-enforce validator — phase 28

- src-ai-skills/CLARIFY-QUESTION-FORMAT.md: nexus's "asking-well"
  rules ported to the runtime clarify phase. 1-4 questions per
  batch; (Recommended) option first; option descriptions name
  the trade-off; 2-4 sentences of prose preamble. Composes with
  the existing template-level lead_round_max_questions + "1-word
  / 1-sentence answer" constraint rather than replacing them.
- lib/anthropic/clarify-validator.ts: validateClarifyFormat
  (pure) + logClarifyFormatIssues (soft-enforce log line via
  logError('orchestrator', ..., { tag: 'clarify-format' })).
  No retry, no reject. Runs once per clarify-phase turn.
- lib/anthropic/__tests__/clarify-validator.test.ts: covers
  (Recommended) detection, trade-off-options detection,
  isFreeForm heuristic, silent on free-form / well-formed,
  emits one line on malformed.
- lib/anthropic/conferring.ts: one new call site after each
  clarify turn finalizes. Sub-microsecond cost.
- src-ai-skills/PERSONA-FORMAT.md: lead-role section gets one
  bullet pointing at CLARIFY-QUESTION-FORMAT.md.
- personas/product-lead.md + personas/skeptical-engineer.md +
  src-ai-skills/personas/{product-lead,skeptical-engineer}.md:
  one appended paragraph naming the format. Body markdown;
  no schema change.
- plan/AUDIT.md: [needs-user-call] "Three framework-spec
  questions" row gets a Pass-resolved note for Q2 (hard vs
  soft enforcement). Q1 + Q3 stay pending.

Decisions:
- Soft-enforce, not hard. Resolves AUDIT [needs-user-call]
  Q2. Hard-enforce adds retry latency on every malformed
  turn; soft-enforce ships a doc + log line that surfaces
  drift in the drain. If drift becomes a real signal, the
  follow-up phase can flip the validator to hard-enforce.
- `(Recommended)` is the literal marker, matching nexus's
  asking-well.md convention.
- Validator is pure + synchronous + runs once per clarify
  turn.
- Doc lives in src-ai-skills/, not plan/ — framework spec
  is single source of truth per phase 20.
- Both runtime + framework persona copies edited in this
  phase. Collapsing them via a build step is a follow-up.
- isFreeForm heuristic errs on under-flag (false negatives
  are fine; over-flag would noise the log drain).
- Log tag `clarify-format` reuses the `orchestrator` scope.
- No template change; lead_round_max_questions + "1-word"
  copy already pin the answer shape.

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 28's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash.

Update `plan/AUDIT.md`'s `[needs-user-call]` row to
note Q2 resolved; row stays pending (Q1, Q3 remain).

## Follow-ups (out of scope this phase)

- **Hard-enforce if drift is high.** Once a few weeks of
  log-drain data accumulates, /iterate audits the
  `tag: 'clarify-format'` lines. If >10% of clarify turns
  drift, file a phase that flips the validator to reject +
  retry. Until then, soft-enforce is enough.
- **Collapse runtime + framework persona copies via build
  step.** `loadPersonas` reads `personas/`; the framework
  spec sits at `src-ai-skills/personas/`. A small build
  step that copies one direction (or a symlink in dev)
  removes the dual-source drift risk. Not urgent —
  phase 20's vitest harness catches schema drift if it
  ever appears.
- **Free-form heuristic upgrade.** If the log drain shows
  the heuristic over-flagging well-formed free-form
  questions, tighten it. Possible upgrades: explicit
  persona-side marker ("FREE-FORM:") at the start of the
  prompt; AST-style markdown parse.
- **Per-persona format opt-out.** Some specialist personas
  may legitimately ask in a different shape during a
  later phase. The current scope is clarify only; if
  cross-phase format rules accumulate, a per-persona
  override field is the natural shape.
- **CLARIFY-QUESTION-FORMAT.md ported back to nexus.**
  This phase is itself a port from nexus's
  `concepts/asking-well.md`. If the boardroom rendition
  develops sharper rules, a future `/lessons-pr` could
  port the boardroom-side learnings back upstream. Track
  in `NEXUS_LESSONS.md` if the pattern matures.
