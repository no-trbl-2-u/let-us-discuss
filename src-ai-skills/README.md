# `src-ai-skills` — boardroom-style multi-persona conferring

This directory is the portable, project-agnostic specification of
the **runtime AI workflow** that drives the boardroom product —
the part end-users interact with, not the dev-side build loop.

Each persona is an "AI-skill": a system prompt + identity + role
that an LLM session adopts. The discussion template is the
choreography (phases, turn budgets, escalation thresholds). The
orchestrator is the engine that walks the choreography, takes
turns among the persona cast, streams the output, and emits the
final artifacts.

This is sibling to but **distinct from** `src-skills/` at the repo
root. That directory holds the dev-side workflow (skills that
build apps); this one holds the runtime workflow (skills that
drive a conversation inside a deployed app).

---

## Executive summary

You're building a product where users get value from a **short,
opinionated AI conversation** with named personas, not from a
generic chatbot. The user supplies a pitch (or a research
question, or a screenplay arc, or a post-mortem starting note).
The product picks the cast and the template; the conversation
runs in 2–4 minutes; the user walks away with 1–3 concrete
artifacts they can hand off.

The pattern works for any domain where:

- The output is a **structured artifact**, not a chat transcript.
- Multiple **named viewpoints** matter (a "growth voice" and a
  "skeptical engineer" reach different conclusions, and the
  collision is the value).
- The user has **15 seconds of patience per question**, not 15
  minutes.
- You want the **same output shape** every time, varying only by
  what the personas surface.

Boardroom uses this pattern for **pitch → spec**: a fuzzy product
pitch becomes a `spec.md` + executive summary + call-outs file.
The same framework runs other conversations by swapping the
persona cast and the template.

---

## The three building blocks

Everything in this directory is one of three things:

| Building block | Where | What it is |
|---|---|---|
| **Personas** | `personas/<slug>.md` | The cast. One markdown file = one persona = one system prompt + identity + role. Always includes exactly one secretary. |
| **Templates** | `templates/<slug>.json` | The choreography. JSON config: phases, turn budgets, escalation thresholds. May opt into the cross-session wrapper phases. |
| **Orchestrator** | `ORCHESTRATOR.md` (spec) + reference impl in any product | The engine. Runs the conversation; emits SSE events; persists turns; gates moderation; tracks budget; reads/writes the cross-session retros file. |

The boundary is sharp on purpose:

- A persona doesn't know what template it's in.
- A template doesn't know which personas will be staffed.
- The orchestrator takes both as data and runs the loop.

You can ship a new product by swapping any two of the three and
keeping the third. Most products will swap the personas + the
template and reuse the orchestrator engine.

A single session produces up to **four artifacts**:

1. `spec.md` — the structured output.
2. Executive summary — short, share-friendly.
3. Call-outs — explicitly-deferred items.
4. `secretary-log.md` — the in-session four-taxonomy log.

…and updates a fifth **cross-session** artifact:

- `retros.md` (project-level, append-only) — one entry per
  concluded session, fed forward into the next.

---

## How a session runs

```
User staffs the table       ┌─────────────────────────┐
(picks 2-6 personas;   ───▶ │  pitch + personas[] +   │
secretary always         │  template            ───┼─▶  Orchestrator
included)                    └─────────────────────────┘            │
                                                                    ▼
   ┌────────────────────────────────────────────────────────────────┐
   │                                                                │
   │  PHASE 0 — Retro-review (CROSS-SESSION)  ◀── USER CHECKPOINT   │
   │    Orchestrator reads retros.md (last N sessions); surfaces    │
   │    unresolved "for next time" items. User picks zero/some;     │
   │    answers each in 1 sentence.                                 │
   │    Skipped silently if retros.md is empty (1st session).       │
   │                                                                │
   │  PHASE 1 — Clarify                                              │
   │    Lead personas circle once. Each asks 1-4 brief questions.   │
   │    User answers each with ≤1 sentence.                          │
   │                                                                │
   │  PHASE 2 — Confer                                               │
   │    Personas extrapolate, refine, push back. Auto turn-taking.  │
   │    Bounded by turn_budget.                                     │
   │    Secretary logs the 4 taxonomies at phase end.                │
   │                                                                │
   │  PHASE 3 — Executive summary  ◀── USER CHECKPOINT              │
   │    Team emits a 2-paragraph summary.                            │
   │    User: "accept" → continues to specialists.                  │
   │    User: "redirect (one sentence)" → loop back to Confer.       │
   │    Secretary logs at phase end.                                 │
   │                                                                │
   │  PHASE 4 — Specialists                                          │
   │    Domain personas drill in. Same shape as Confer.             │
   │    Secretary logs at phase end.                                 │
   │                                                                │
   │  PHASE 5 — Artifact                                             │
   │    Orchestrator (as moderator) compiles four outputs:           │
   │    spec.md + exec summary + call-outs + secretary-log.md.       │
   │                                                                │
   │  PHASE 6 — Retrospective (CROSS-SESSION)                        │
   │    Secretary in Mode 2: 3 bullets each of what went well /     │
   │    what didn't / for next time. Appended to retros.md.          │
   │                                                                │
   └────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    User downloads artifacts.
                    retros.md ready for next session's Phase 0.
```

The user's total attention budget is ~3 minutes:

- ~20s reviewing/picking retro-review items (if any)
- ~30s staffing the table + pasting the pitch
- ~45s answering clarify questions
- ~45s reading the exec summary, accepting or redirecting
- ~30s reviewing artifacts before download

The orchestrator's job is to fit a useful conversation inside
that window.

## The cross-session learning loop

The phase-0 retro-review and phase-6 retrospective are how
**the system gets better with use**. Each concluded session
appends an entry to a project-level `retros.md` file:

```markdown
## 2026-05-19T14:32:00Z — session abc123…

### What went well
- ...

### What didn't
- ...

### For next time
- ...
```

The next session's invocation reads recent retros, surfaces
"for next time" items to the user, and feeds the answers into
the clarify phase. **The tenth session starts with nine prior
retros' worth of context.** The first session runs blind;
subsequent sessions get smarter automatically.

The retros file lives at the project root (not in the
database) — that's deliberate. It survives DB resets, lives in
git, and is human-readable / human-editable. Treat it as a
textual artifact alongside `spec.md`.

See `ORCHESTRATOR.md` §Cross-session retros for the engine
contract; `PERSONA-FORMAT.md` §Role/secretary for the Mode-2
retrospective behavior; the reference `templates/pitch-to-spec.json`
for a template that opts into both wrapper phases.

---

## The hard product rules

Three rules that are non-negotiable across templates:

### 1. Every user-facing question accepts a 1-word or 1-sentence answer

If a persona writes a question that needs a paragraph to answer,
the orchestrator rejects it and rewrites it. The product is
optimized for users with 15 seconds of patience per question, not
15 minutes.

### 2. The user is never asked more than 5 questions in a single checkpoint

The clarify phase caps at `lead_round_max_questions × number_of_leads`
(4 × 2 = 8 max, but most templates set 1–2 per lead). The exec-
summary phase asks one question (accept or redirect). No phase
surfaces more than 5.

### 3. The agents do the thinking

The user supplies the pitch + the answers to clarifying questions
+ the accept-or-redirect decision. Everything else — the spec
structure, the trade-offs, the call-outs — comes from the
personas. The user does NOT author prompts.

These three rules are why this framework works for "users new to
multi-agent AI workflows": the product feels like a colleague
conversation, not a prompt-engineering exercise.

---

## What's in this directory

```
src-ai-skills/
├── README.md                   ← this file
├── PERSONA-FORMAT.md           ← how to write a persona file
├── TEMPLATE-FORMAT.md          ← how to write a discussion template
├── ORCHESTRATOR.md             ← engine contract + 5-phase pattern
├── personas/
│   ├── product-lead.md         ← reference persona (lead role)
│   ├── skeptical-engineer.md   ← reference persona (lead role)
│   ├── growth-voice.md         ← reference persona (specialist role)
│   ├── end-user-proxy.md       ← reference persona (specialist role)
│   └── secretary.md            ← side-channel record-keeper (secretary role)
└── templates/
    └── pitch-to-spec.json      ← reference template (5-phase classic)
```

**Format specs** (`*-FORMAT.md`) — define the schemas + conventions
for personas and templates. Read these to write your own.

**Orchestrator spec** (`ORCHESTRATOR.md`) — defines the engine's
contract. Read this to implement the engine in any language or to
adapt the boardroom TypeScript reference.

**Reference instances** (`personas/`, `templates/`) — the four
v1 boardroom personas + the pitch-to-spec template. Copy and
adapt them. They're tuned for software-product spec conversations;
fork them for your domain.

---

## Local testing

Two paths, depending on what "test" means to you:

### A) Run the boardroom product locally

The fastest path: clone boardroom-breakdown, run `pnpm dev`, hit
`/try`. You'll see the anonymous demo (one persona, three canned
turns) which exercises the UI without an LLM call. Sign in and
hit `/app` to get the full multi-persona orchestrator running
against real Anthropic API. This validates that the orchestrator
spec is implementable end-to-end.

```bash
git clone https://github.com/<YOUR_ORG>/<YOUR_REPO>
cd <YOUR_REPO>
cp .env.example .env  # populate ANTHROPIC_API_KEY, Supabase keys, etc.
pnpm install
pnpm dev
```

### B) Build a new product on the same framework

The portable path. Copy the four files (PERSONA-FORMAT.md +
TEMPLATE-FORMAT.md + ORCHESTRATOR.md + one reference each) into
your own project. Then:

1. **Author your personas** under `personas/<slug>.md`. Validate
   against the frontmatter schema in PERSONA-FORMAT.md.
2. **Author your template** under `templates/<slug>.json`.
   Validate against the schema in TEMPLATE-FORMAT.md.
3. **Implement the orchestrator** to the contract in
   ORCHESTRATOR.md. You can copy boardroom's
   `lib/anthropic/conferring.ts` (TypeScript) verbatim and adapt,
   or rewrite in any language that hits the same interface.
4. **Wire the host**: an HTTP endpoint that runs the orchestrator
   and streams the events to the client; an answer-routing
   channel; persistence hooks.

The four boardroom reference personas are starting points but you
will rewrite them for your domain. The boardroom-table metaphor
("you are at the table") is grounding language; rewrite to your
setting ("you are in the writers' room", "you are at the post-
mortem", etc.).

---

## Reference personas — when to use which

The four personas shipped here cover four orthogonal viewpoints
that recur across product-spec conversations. Staff at least one
lead + 1–2 specialists per session.

| Persona | Role | Voice | Pushes hardest on |
|---|---|---|---|
| **Product Lead** | lead | Concrete, decisive, scope-defending. | "what's the smallest first cut that proves the loop?" — cuts features ruthlessly to a first-release scope. |
| **Skeptical Engineer** | lead | Sharp-edged, evidence-first, hostile to magic. | Cost, latency, failure modes, the boring-and-correct alternative to elegance. |
| **Growth Voice** | specialist | Scrappy, channel-aware, indifferent to marketing fluff. | First-touch, first-value, first-share — the three growth moments. |
| **End-user Proxy** | specialist | Plain, curious, didn't-read-the-spec. | "what is this? what do I do next? what happens if I get it wrong?" — represents the user who landed cold. |
| **Secretary** | secretary | Quiet, append-only, taxonomy-driven. | Side-channel record-keeper. Doesn't argue or propose; harvests critiques / audits / out-of-scope call-outs / decisions into a structured log emitted at every phase boundary, compiled into a `secretary-log.md` artifact at the end. |

They're tuned to argue productively with each other. The Product
Lead defends scope; the Skeptical Engineer defends feasibility;
the Growth Voice defends the funnel; the End-user Proxy defends
the moment of first contact. A well-staffed session has at least
3 of these (or your domain equivalents) pulling in different
directions.

The **Secretary** is structurally different — it doesn't argue.
It runs alongside the conversation, harvesting four taxonomies
(critiques / audits / out-of-scope / decisions) at each phase
boundary and compiling a `secretary-log.md` artifact at the end.
Staff one secretary when you want the session's audit trail
preserved; skip it when the spec + exec-summary + call-outs are
enough. See `personas/secretary.md` for the reference impl and
`ORCHESTRATOR.md` §Secretary turns for the engine pattern.

---

## What this framework is NOT

- **Not a chatbot.** No turn-by-turn user dialogue. The user
  speaks at clarify + exec-summary checkpoints only.
- **Not a workflow tool.** No DAG of tasks, no agentic
  tool-calling. Personas reason; they don't act on external
  systems.
- **Not multi-turn memory across sessions.** Each session
  instantiates fresh persona contexts with the pitch +
  transcript. Sessions are independent.
- **Not a prompt-engineering interface.** Users staff the cast
  and write a pitch — that's it. They don't author or tweak
  prompts.
- **Not a generation pipeline.** It's a conversation engine. The
  artifacts are the byproduct of the conversation, not the
  primary axis.

If you want a multi-step agentic workflow with tool-calling,
external API calls, and unbounded turns, this is the wrong
framework. Look at LangGraph, AutoGen, or a custom orchestrator.
What this framework optimizes for is bounded conversation with
predictable artifacts — the spec-document use case, not the
research-agent use case.

---

## Customization knobs

Without changing any code, you can swap:

| Knob | Where | What it changes |
|---|---|---|
| Persona cast | `personas/*.md` | Who speaks in the session. Add, remove, rewrite. |
| Template phases | `templates/*.json` | The flow. Drop / repeat / insert / rename phases. |
| Turn budgets | `templates/*.json` `turn_budget` | How long each phase runs. |
| Convergence threshold | `templates/*.json` `escalation.convergence_min_agreement` | How quickly the orchestrator escalates to the user. |
| Token budget | `MAX_SESSION_TOKENS` env / config | Hard cap on per-session LLM tokens. |
| Moderation provider | host's `moderateOutput` callback | Swap OpenAI / Anthropic / self-hosted. |
| LLM provider | host's `client` parameter | Swap Anthropic SDK for any equivalent. |

With code changes, you can extend:

- New phase types (e.g., a `pre-mortem` phase) — implement in
  the orchestrator.
- Persona tools (e.g., a persona that searches docs) — the
  `tools` array on the frontmatter is reserved for this.
- Multi-session memory (e.g., a persona that remembers past
  conversations with this user) — out of v1, but the persona
  identity is stable enough to thread cross-session if you want.

---

## Versioning + provenance

This framework is the v1 shape extracted from the boardroom
build, post-build-plan-complete. The conventions here are tested:
they survived 18 phases of dev + 8 critique passes + multiple
oversight rounds. They are NOT the only viable shape — different
products in this domain will land on different conventions — but
they're a tested starting point.

If you fork this:

1. **Keep the persona frontmatter shape** — too many integrations
   depend on it.
2. **Keep the five-phase pattern** (with renaming if you like) —
   the clarify / confer / checkpoint / specialists / artifact arc
   is what makes the 3-minute attention budget work.
3. **Vary the personas + the template freely** — they're the
   easiest layer to rewrite per-product.
4. **Adapt the orchestrator's implementation** in whatever
   language fits your stack — the contract is what's portable,
   not the code.

The reference impl in boardroom-breakdown is a useful starting
point but is not the canonical implementation. Anyone hitting
ORCHESTRATOR.md's contract has a compliant implementation.

---

## Reading order

If you're encountering this directory cold:

1. **This README** — what you're looking at, the big idea.
2. **One reference persona** (e.g., `personas/product-lead.md`)
   — what a persona file actually looks like.
3. **The reference template** (`templates/pitch-to-spec.json`)
   — what a discussion template looks like.
4. **PERSONA-FORMAT.md** — schema + conventions for authoring
   your own.
5. **TEMPLATE-FORMAT.md** — same for templates.
6. **ORCHESTRATOR.md** — the engine contract for implementing
   (or adapting an existing impl of) the runtime.

If you're picking the framework apart to port it:

1. **ORCHESTRATOR.md** first — the contract is what matters.
2. **boardroom's `lib/anthropic/conferring.ts`** — the reference
   impl. Read top-to-bottom; the comments explain the design
   choices.
3. **boardroom's `lib/sessions/*.ts`** — the persistence layer
   that backs the orchestrator's hooks.
4. **boardroom's `app/api/sessions/route.ts`** — the host that
   wires the orchestrator into an HTTP+SSE endpoint.
