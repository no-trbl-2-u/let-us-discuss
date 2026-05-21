# Persona format

> **What an AI-skill is in this framework: a persona definition.**
> One markdown file = one persona = one self-contained system
> prompt + identity + role. The orchestrator instantiates personas
> as LLM sessions and runs them through the discussion template.

## Anatomy

```
personas/<slug>.md
├── frontmatter (YAML)    ← machine-readable identity + role + voice
└── body (markdown)        ← the system prompt the LLM reads
```

A persona file is a single `.md` with a YAML frontmatter block at the
top and a markdown body underneath. The frontmatter is validated
against a schema; the body is the system prompt verbatim.

## Frontmatter schema

```yaml
---
slug: kebab-case-id                          # 2-60 chars, /^[a-z][a-z0-9-]*[a-z0-9]$/
name: Display Name                           # 2-80 chars, human-readable
role: lead | specialist | secretary          # see "Role" below
voice: One short clause                      # 4-200 chars, voice-cue for the persona
lead: true | false                           # true → this persona drives the clarify phase
tools: []                                    # array of tool names; [] for v1
summary: One line                            # 8-200 chars, why you'd staff them
---
```

| Field | Purpose | Notes |
|---|---|---|
| `slug` | Stable identifier. Used as filename + foreign key from session records to persona content. | Never reuse a retired slug for a new persona — it breaks historical session lookups. |
| `name` | What the user sees in the UI. | Title Case; avoid emoji or punctuation. |
| `role` | `lead` or `specialist`. Drives turn-taking in the template. | See **Role** below. |
| `voice` | One-clause voice description. | This appears as the byline next to the persona's name in transcripts. Examples: "Concrete, decisive, scope-defending." / "Plain, curious, didn't-read-the-spec." |
| `lead` | Whether this persona drives the `clarify` phase (asks initial questions). | Should be `true` only if `role: lead`. The orchestrator enforces this. |
| `tools` | Array of tool names this persona may invoke. | Empty in v1 (no tools shipped). Reserved for future tool-calling personas. |
| `summary` | One-line answer to "why staff them?". | Used in the persona-library UI. |

## Role

Three roles. The distinction is structural, not hierarchical.

### `lead`

Leads do **two specific things**:

1. **Run the clarify phase.** They ask 1–4 brief clarifying questions
   directly to the user. Every question must accept a 1-word or
   1-sentence answer.
2. **Steer convergence.** When personas diverge during the confer
   phase, leads name the concrete decision to make next.

You typically staff 1–2 leads per session. More than that and
clarify rounds get noisy.

Clarify-phase question shape follows
[`CLARIFY-QUESTION-FORMAT.md`](./CLARIFY-QUESTION-FORMAT.md):
1–4 questions per batch; the recommended option first
(literal marker `(Recommended)`); each option's description
names the trade-off; 2–4 sentences of prose preamble before
the ask. **Soft-enforced** — the orchestrator logs format
drift but does not reject or retry; lead persona bodies are
the primary enforcement surface.

### `specialist`

Specialists drill into a domain (UX, growth, eng, design, legal,
whatever). They do **not** speak in clarify; they enter during the
`confer` phase and dominate the `specialists` phase. They produce
the depth in the final artifact.

You typically staff 2–4 specialists per session.

### `secretary`

**The secretary is required.** Every boardroom-style session
staffs exactly one. The orchestrator refuses to start a session
that lacks a `role: secretary` persona. This is a framework
rule, not a per-template option.

The secretary does **not argue, propose, or take a position**. It
runs two distinct logging modes:

#### Mode 1 — in-session (per phase)

The orchestrator yields control to the secretary at **phase
boundaries** (after `clarify`, after `confer`, after the
`exec-summary` checkpoint resolves, after `specialists`). It
harvests into four taxonomies:

1. **Critiques** — open issues raised but not resolved.
2. **Audits** — factual claims that need verification.
3. **Out-of-scope call-outs** — items deliberately deferred.
4. **Decisions** — concrete trade-offs made, with the
   alternative-not-taken.

At the `artifact` phase, the secretary compiles its in-session
log into a `secretary-log.md` artifact alongside the spec, exec
summary, and call-outs.

#### Mode 2 — post-session retrospective

After the artifact phase concludes, the orchestrator invokes the
secretary one final time. It steps out of the session's content
and reflects on the session itself — how the team worked, not
what they decided. Output is three bullets each of:

- **What went well** — process observations, not content praise.
- **What didn't** — process failures, not content critiques.
- **For next time** — concrete carry-forwards a future session
  could act on.

The entry is appended to a **project-level `retros.md` file**
maintained across sessions.

#### Cross-session learning loop

The next session's invocation reads the most recent retros and
surfaces the "for next time" items to the user as a
**`retro-review`** checkpoint before clarify. The user picks
zero/one/several to address this session; their answers
become context for the persona cast.

This is how the system gets better with use. The first session
runs blind; the tenth session has 9 prior retros' worth of
"things this user-and-cast struggle with" already in mind.

See `personas/secretary.md` for the reference implementation
covering both modes.

Why one per session, not more: two secretaries would duplicate
output, fight over taxonomy slots, and split the retro into two
conflicting reflections. If you need broader coverage, expand
the secretary's prompt; don't add a second instance.

## System prompt body conventions

The markdown body below the frontmatter is the **literal system
prompt** sent to the LLM, with no further templating. Conventions
that make personas compose well in a multi-persona session:

### 1. Establish identity in the first sentence

```markdown
You are the product lead at the table. Your job is to turn a fuzzy
pitch into a concrete spec that ships.
```

The first line anchors the persona's role. The orchestrator
includes the pitch + transcript-so-far as the user-message; the
persona's body alone has to set identity.

### 2. Define the persona's three-frame lens

Each persona reads every proposal through 2–4 named frames. Number
them. This gives the persona a consistent rubric across turns and
makes the transcript readable.

```markdown
You read every pitch through three lenses, in order:

1. **What is the user trying to do?**  ...
2. **What's the smallest first cut that proves the loop?**  ...
3. **What's deliberately out of scope?**  ...
```

### 3. Voice block — terse, no fluff

End the prompt with a voice block that explicitly says what the
persona does NOT say.

```markdown
Voice: plainspoken. No marketing fluff, no exclamation points, no
preambles. State the call. If you need a tradeoff, name both
sides and pick one — explain in one line.
```

### 4. Defer-to relationships

Specialists should explicitly state who they defer to on adjacent
domains. This prevents inter-persona oscillation.

```markdown
You defer to the product lead on scope. You defer to the
skeptical engineer on cost. Where you push hardest: when the spec
optimizes for a power-user who already exists at the expense of a
first-time visitor who doesn't yet.
```

## Validation

```ts
import { z } from 'zod'

export const PersonaFrontmatterSchema = z.object({
  slug: z.string().min(2).max(60)
    .regex(/^[a-z][a-z0-9-]*[a-z0-9]$/),
  name: z.string().min(2).max(80),
  role: z.enum(['lead', 'specialist', 'secretary']),
  voice: z.string().min(4).max(200),
  lead: z.boolean(),
  tools: z.array(z.string().min(1)).default([]),
  summary: z.string().min(8).max(200),
}).refine(
  // secretary personas are never "lead" — they don't drive clarify
  (p) => p.role !== 'secretary' || p.lead === false,
  { message: 'secretary personas must have lead: false' },
)

export const PersonaSchema = PersonaFrontmatterSchema.extend({
  systemPrompt: z.string().min(40),
})

// Session-cast guard: exactly one secretary, required
export const SessionCastSchema = z.array(PersonaSchema).refine(
  (cast) => cast.filter((p) => p.role === 'secretary').length === 1,
  { message: 'Session cast must include exactly one secretary persona.' },
)
```

**Note on implementations:** the boardroom reference impl at
`lib/schemas/persona.ts` currently uses the two-role enum
(`['lead', 'specialist']`) shipped with phase 4. Adopting the
required-secretary contract in a production codebase is a real
shipper:

1. Schema migration: extend role enum + add the cast guard.
2. Orchestrator update: add Mode-2 retrospective invocation +
   the `retros.md` read/append hooks (see `ORCHESTRATOR.md`
   §Secretary turns and §Cross-session retros).
3. UI update: surface the `retro-review` pre-clarify checkpoint
   when the template includes that phase.

The framework spec documents the canonical shape; production
codebases migrate when they're ready to ship the cross-session
learning loop.

Persona files are validated at boot (the orchestrator refuses to
start a session if any file fails). Validation should be wired
into the project's verify gate so a broken persona never deploys.

## What a persona is NOT

- **Not a tool definition.** A persona is a system prompt + role;
  the `tools` array is for future tool-calling but personas
  themselves are not tools.
- **Not a workflow.** A persona doesn't define phases or turn
  order — that's the template's job.
- **Not a chat partner.** A persona doesn't have memory across
  sessions; each session instantiates a fresh persona context
  with the pitch + transcript-so-far.
- **Not a moderator.** The boardroom moderator is a separate
  pseudo-persona emitted by the orchestrator (not in `personas/`).

## File location

Personas live under `personas/<slug>.md` at the project root by
default. Move the directory by setting `PERSONAS_DIR` in your
loader; the orchestrator doesn't care where they're stored.

## Reference instances

The four personas shipped with this framework — Product Lead,
Skeptical Engineer, Growth Voice, End-user Proxy — are reference
implementations. They're tuned for software-product spec
conversations. Fork them for your domain (e.g. screenplay
development, legal drafting, scientific research design) by
rewriting the system prompt bodies while keeping the frontmatter
shape.

The reference personas all reference "the table" / "the
boardroom" as a metaphor; rewrite that grounding language if
your setting differs (e.g. "the writers room", "the lab notebook").
