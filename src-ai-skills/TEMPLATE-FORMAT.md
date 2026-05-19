# Template format

> **A discussion template is the choreography for one kind of
> conversation.** It names the phases, sets per-phase budgets, and
> declares the escalation rules that govern when the orchestrator
> hands control back to the user. Templates are project-scoped —
> you might ship one ("pitch-to-spec") or several
> ("research-design", "screenplay-arc", "post-mortem").

## Anatomy

```
templates/<slug>.json
{
  "slug": "<id>",
  "name": "<display name>",
  "description": "<one paragraph: what kind of conversation this runs>",
  "phases": [...],
  "escalation": {...}
}
```

A template is a single JSON file. JSON over markdown because
templates are machine-driven; the orchestrator iterates `phases`
in order and reads `escalation` thresholds at runtime.

## Top-level schema

```ts
{
  slug: string,              // kebab-case; 2-60 chars
  name: string,              // display name
  description: string,       // one paragraph
  phases: TemplatePhase[],   // min 2
  escalation: {
    exec_summary_checkpoint: boolean,
    convergence_min_agreement: number,  // 0..1
    user_redirect_max: number            // 0..5
  }
}
```

## Phase schema

```ts
{
  id: string,                        // kebab-case
  name: string,                      // display name
  description: string,               // what this phase does
  lead_round_max_questions?: number, // for clarify phase: 1-8
  turn_budget?: number,              // for confer/specialists: 1-60
  exec_summary_checkpoint?: boolean  // true on exec-summary phase
}
```

Each phase has a required `id`/`name`/`description` plus zero or
more **phase-type knobs** that the orchestrator reads based on
which canonical phase this is.

## Canonical phases

The orchestrator recognizes five phase types by `id`. You can
shorten, extend, or rename them per template, but the canonical
flow is:

### 1. `clarify`

Lead personas circle once, each asking 1–4 brief clarifying
questions. **Every question must accept a 1-word or 1-sentence
answer.** Hard product rule. The orchestrator surfaces the
questions to the user as a ClarifyPrompt; the user answers each
inline.

Knob: `lead_round_max_questions` — caps the per-lead count.

```json
{
  "id": "clarify",
  "name": "Clarify",
  "description": "Lead personas circle once...",
  "lead_round_max_questions": 4
}
```

### 2. `confer`

Personas extrapolate from the pitch + clarifying answers. They
refine the shape of the spec without escalating back to the user.
This is where most of the conversation happens.

Knob: `turn_budget` — max turns before the phase auto-advances.

```json
{
  "id": "confer",
  "name": "Confer",
  "description": "Personas extrapolate...",
  "turn_budget": 8
}
```

### 3. `exec-summary`

The team emits a short executive summary. **This is the single
user-facing checkpoint inside the loop.** The user accepts (one
button) or redirects (one sentence). On redirect, the orchestrator
re-runs the `confer` phase with the redirect appended to context.

Knob: `exec_summary_checkpoint: true` — marks this as the
checkpoint phase. The orchestrator pauses here for `awaitAnswer`.

```json
{
  "id": "exec-summary",
  "name": "Executive summary",
  "description": "The team emits a short executive summary...",
  "exec_summary_checkpoint": true
}
```

### 4. `specialists`

Specialist personas drill into the spec, contributing depth in
their domain. Leads can still speak but are deferential here. This
is where you get the actual technical content of the spec.

Knob: `turn_budget` — same shape as `confer`.

```json
{
  "id": "specialists",
  "name": "Specialist round",
  "description": "Specialist personas drill...",
  "turn_budget": 8
}
```

### 5. `artifact`

The orchestrator (acting as a "moderator" pseudo-persona) compiles
the three artifacts: `spec.md`, executive summary, call-outs. The
conversation ends here.

Knob: `turn_budget` — usually low (3–6); just enough to assemble
the artifacts in clean form.

```json
{
  "id": "artifact",
  "name": "Artifact",
  "description": "Render the three artifacts...",
  "turn_budget": 4
}
```

## Escalation block

Three knobs that govern when the orchestrator pauses for the user
vs. continues autonomously:

```json
"escalation": {
  "exec_summary_checkpoint": true,
  "convergence_min_agreement": 0.7,
  "user_redirect_max": 2
}
```

| Knob | Purpose | Notes |
|---|---|---|
| `exec_summary_checkpoint` | Whether to halt the loop at the exec-summary phase for user accept/redirect | Almost always `true`. Set `false` only for fully-autonomous templates (e.g. internal research, no human in the loop). |
| `convergence_min_agreement` | Threshold (0–1) below which the orchestrator emits a moderator turn naming the disagreement and asks the user to break the tie | 0.7 is the boardroom default. Higher = more user escalations; lower = the team converges on its own. |
| `user_redirect_max` | How many `exec-summary-redirect` rounds the user gets before the orchestrator wraps anyway | 2 in v1. Prevents infinite redirect loops. |

## The full reference template

See `templates/pitch-to-spec.json` for the canonical example. The
five-phase pattern (clarify → confer → exec-summary → specialists
→ artifact) is the boardroom default. You can:

- **Drop a phase** for a tighter conversation (e.g., no specialists
  round for short one-pitch sessions).
- **Repeat a phase** (e.g., two specialist rounds with different
  persona casts).
- **Insert new phases** (e.g., a `pre-mortem` phase between
  `confer` and `exec-summary`).
- **Rename for clarity** in your domain (e.g., `clarify` →
  `interview`; `artifact` → `outline`).

What you can't safely do:

- Skip the `exec-summary` phase if `exec_summary_checkpoint:
  true`. The user-checkpoint contract is load-bearing.
- Run more than 60 turns per phase (orchestrator hard cap; prevents
  runaway).

## Validation

```ts
import { z } from 'zod'

export const TemplatePhaseSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(2).max(80),
  description: z.string().min(8).max(400),
  lead_round_max_questions: z.number().int().min(1).max(8).optional(),
  turn_budget: z.number().int().min(1).max(60).optional(),
  exec_summary_checkpoint: z.boolean().optional(),
})

export const TemplateEscalationSchema = z.object({
  exec_summary_checkpoint: z.boolean(),
  convergence_min_agreement: z.number().min(0).max(1),
  user_redirect_max: z.number().int().min(0).max(5),
})

export const TemplateSchema = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]*[a-z0-9]$/),
  name: z.string().min(2).max(80),
  description: z.string().min(8).max(400),
  phases: z.array(TemplatePhaseSchema).min(2),
  escalation: TemplateEscalationSchema,
})
```

Templates validate at boot. A broken template fails the verify
gate.

## Design notes — why JSON, why these knobs

**JSON over markdown** — templates are configuration, not prose.
Editing one in production means changing a number, not rewriting a
document.

**Five phases, not more** — the user is paying attention through
~3 minutes of conferring before they lose patience. Five phases
fits inside that budget when each phase is bounded by
`turn_budget`. More phases = slower convergence = lost user.

**One user-checkpoint, not many** — every additional user-facing
question costs ~30 seconds of attention. The exec-summary
checkpoint is the only one because it's the only point where a
single user sentence ("yes, ship it" or "redirect like this") can
meaningfully change the rest of the conversation.

**Convergence as a threshold, not a yes/no** — the orchestrator
estimates agreement among the conferring personas via a simple
heuristic over the recent turn texts. Below 0.7 = escalate. This
is intentionally fuzzy; the worst that happens is one extra
user-redirect round.

## What a template is NOT

- **Not a script.** It doesn't say "now persona X speaks." That's
  the orchestrator's job (turn-taking among personas inside a
  phase).
- **Not a persona definition.** Templates pick the cast at runtime
  (the user staffs the table); the template specifies the
  choreography, not who's in it.
- **Not a UI definition.** The product surface — the boardroom
  table, the ClarifyPrompt, the TurnBubble — is rendered by the
  consuming app, not the template.

## File location

Templates live under `templates/<slug>.json` at the project root
by default. Multi-template products (post-v1) can route by URL
slug (e.g., `/template/pitch-to-spec`, `/template/post-mortem`).
v1 ships one template per product.
