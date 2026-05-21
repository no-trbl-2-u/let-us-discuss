# Clarify-question format

> **What this constrains.** How lead personas shape questions to
> the user during the clarify phase of a discussion template. It
> sits on top of the template-level constraints
> (`lead_round_max_questions`, "1-word or 1-sentence answer"), not
> in place of them.
>
> Ported from nexus's `concepts/asking-well.md`. The dev-side
> framework uses these rules for every skill that asks the user
> a question; the runtime framework uses them for every clarify
> checkpoint inside a session.

## Scope

These rules apply to **clarify-phase lead-persona questions**:

- Questions a lead persona (`role: lead`, `lead: true`) emits to
  the user at the start of a session.
- A "checkpoint" is a single turn — one to four questions
  delivered together for the user to answer in one ballot.

These rules do **not** apply to:

- Persona-to-persona dialogue during the confer phase.
- The exec-summary checkpoint (which has its own shape: one
  accept/redirect ballot, no multi-option list).
- Internal reasoning inside a persona's system prompt.
- Specialist personas operating in later phases.

## Format rules

### 1. Batch size: 1–4 questions per checkpoint.

The user answers all questions in one ballot. Composes with the
template-level `lead_round_max_questions` setting (currently 4
for `templates/pitch-to-spec.json`). If a lead has more than
four questions to ask, the lead is doing too much — collapse,
combine, or defer.

### 2. Answer shape: 1 word or 1 sentence per question.

This is the existing template-level constraint, re-affirmed
here so the doc is self-contained. The user is in attention-
budget; questions that need a paragraph of reasoning to answer
should be reshaped as multi-choice (rule 3) or deferred.

### 3. Recommended option first (closed-choice questions).

When the question is a closed multi-choice (the lead believes
there are 2–4 sensible answers), list the options and **mark
one `(Recommended)`** with that exact literal marker:

```
- (Recommended) Option A — <one-line trade-off description>
- Option B — <one-line trade-off description>
- Option C — <one-line trade-off description>
```

The recommended option is listed first. The marker is the literal
string `(Recommended)`, capital R, in parentheses — not "rec",
not a unicode glyph, not bold. Pinning the marker as a literal
string keeps the runtime validator simple and matches the
nexus dev-side convention exactly.

Free-form questions (a project name; a one-line audience
description; "what's the simplest version that ships first?")
**skip this rule.** They are legitimate when the answer space
isn't reasonably enumerable.

### 4. Trade-off in option descriptions.

Each option's one-line description names **what it gets at the
cost of what it doesn't**. Not "Option A is fast"; "Option A —
faster but less flexible than Option B."

The trade-off is what makes a multi-choice question useful.
Without it the user has to model the decision themselves to
pick; with it they're voting on a pre-articulated trade-off.

### 5. Prose preamble: 2–4 sentences before the question.

Before the question (or batch of questions), 2–4 sentences of
context:

- What's being decided.
- Why it matters now (this checkpoint, not later).
- What the answer unlocks.

Not more. Clarify is not a conference talk; the user's attention
budget is set against starting the session, not against reading
a preamble.

## Why

The dev-side experience nexus distilled this from:

- **Free-form clarify checkpoints take ~45 seconds.** The user
  reads the question, models the answer space, picks, types.
- **Recommended-ballot checkpoints take ~15 seconds.** The user
  reads the preamble, scans 2–4 options with named trade-offs,
  picks one (usually the recommended one).

Three checkpoints in a typical clarify phase: 135 seconds of
attention spend vs 45. That's roughly the difference between
"fits the user's attention budget for the session" and
"doesn't." The runtime borrows the dev-side rule because the
attention math is identical at the user side of an LLM
session.

## What this does NOT constrain

- **Persona system prompts.** The system prompt is voice +
  identity + reasoning; the format rules only constrain the
  user-facing question text the persona emits.
- **Confer-phase dialogue.** Personas talk to each other in
  whatever shape the template defines. The format only
  applies when the audience is the user.
- **The exec-summary checkpoint.** Already has its own
  one-ballot accept/redirect shape; it doesn't get a
  recommended option because the persona ring's job is to
  present the spec, not to ballot on it.
- **Specialist-phase questions.** Specialists drill into the
  spec, not the user; if they need to escalate, they raise
  to lead, who reshapes the question per these rules.

## Worked example

### Bad — free-form when a recommended ballot would fit

> The user pitched a "newsletter for AI engineers." What kind of
> cadence should this newsletter operate on? Daily? Weekly?
> Monthly? Something else?

Problems: no preamble, no recommended option, no trade-off text.
The user has to model the trade-off (daily = more loyal
subscribers / harder to sustain; weekly = standard cadence /
less engagement spike; monthly = lower commitment / harder to
build habit) themselves.

### Good — recommended ballot

> The pitch frames the newsletter as a "regular cadence" but
> doesn't pin a frequency. Cadence shapes everything else: tone,
> length, automation, your weekly cost. We want to lock this now
> so the spec doesn't ship two contradictory assumptions.
>
> How often does the newsletter ship?
>
> - (Recommended) Weekly — standard reader expectation; one
>   solid issue per week is sustainable for a one-person
>   operation.
> - Daily — higher loyalty per subscriber, but you need a
>   content reservoir to draw from; risky for v1.
> - Monthly — lower commitment; harder to build a habit
>   loop; works if the issues are long-form.

### Good — free-form (legitimately skips rules 3 + 4)

> The pitch is unnamed; the working title in the message body is
> "the AI engineer newsletter," which is descriptive rather than
> branded. We'll need a working name to pin in the spec so later
> personas can refer to it consistently.
>
> What's the working name?

Free-form is fine when the answer space isn't enumerable — a
project name, a one-line audience description, a verbatim
quote of a constraint.

## Enforcement

Soft.

The runtime orchestrator runs a lightweight validator
(`lib/anthropic/clarify-validator.ts`) after each clarify-phase
turn finalizes:

- If the turn is multi-choice (has bulleted options) **and**
  is missing `(Recommended)` or the option descriptions lack
  trade-off text, the validator emits one structured log line
  via `logError('orchestrator', ..., { tag: 'clarify-format'
  })`.
- The orchestrator does **not** reject, retry, or re-stream
  the persona's turn. The format drift surfaces in the log
  drain; persona-side body copy + the spec doc are the
  primary enforcement surface.

Free-form questions are not flagged.

If log-drain data accumulates evidence that drift is high
(>10% of clarify turns), a follow-up phase can flip the
validator to hard-enforce (reject + retry). Until then,
soft-enforce trades a slightly looser format guarantee for a
cheaper happy path — and trusts the personas to follow the
format as documented.
