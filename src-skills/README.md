# `src-skills` — the autonomous-loop skill set

This directory is the **portable, project-agnostic** version of the
skill set that drove the boardroom build from blank-repo to
18-phases-shipped to post-build steady state. Drop these into
`~/.claude/skills/` (or a project's `.claude/skills/`) and you have
an autonomous loop ready to run on any codebase.

The companion at the repo root, `skills/`, is the original
boardroom-specific version with concrete project references; this
`src-skills/` directory has those references stripped and the
files repackaged as the SKILL.md-per-folder format Claude Code's
skill loader expects.

---

## Executive summary

You're running a long-form project — a product build, a content
site, a research notebook, anything that ships in increments. You
want an AI agent that can:

- **Decide** what to do next from observed state, not from a
  prompt.
- **Drain** a queue of findings (user-spotted, externally-observed,
  audit-derived) into shipped fixes.
- **Plan + Ship + Verify + Deploy** one phase end-to-end without
  a checkpoint in the middle.
- **Notice** when the original plan no longer fits and propose
  adjustments — but **never** silently change the plan.
- **Pause for the user only when it genuinely needs to** — at one
  named checkpoint (`/oversight`), not scattered through every
  skill.

That's what these 11 skills are. Each one is a contract: it reads
specific files, performs a bounded action, writes specific files,
commits + pushes, exits. The contracts compose into a loop you can
let run overnight, point at a fresh project, or invoke skill-by-skill
under tight oversight.

The design is deliberately **file-first**: the loop's "memory" is a
handful of markdown files under `plan/` and `data/`. Nothing is held
in agent context across sessions; the next tick reads state and
proceeds. That makes the system durable, debuggable, and survivable
across model upgrades.

---

## The big idea — three queues + a dispatcher

The system has **one dispatcher** (`march`), **two intake skills**
(`triage`, `critique`), **two drainage skills** (`iterate`,
`ship-a-phase`), and a few specialty skills around them. The three
files in `plan/` carry the loop's state between ticks:

| File | Producer | Consumer | What it carries |
|---|---|---|---|
| `plan/AUDIT.md` | `iterate audit`, `triage`, `oversight` | `iterate` | Scored findings (`impact × ease / 10`) waiting to be shipped |
| `plan/CRITIQUE.md` | `critique`, `jot` | `iterate` | External-observer findings, severity-graded |
| `plan/PHASE_CANDIDATES.md` | `expand` | `oversight` (promotes) | Phase ideas surfaced from accumulated signals |
| `plan/steps/01_build_plan.md` | `oversight`, `bootstrap` | `ship-a-phase`, `march` | The phase ladder (status block + per-phase scope) |
| `plan/phases/phase_<N>_<topic>.md` | `plan-a-phase` | `ship-a-phase` | The brief for one phase: decisions locked, scope tight |
| `plan/bearings.md` | hand-authored, `oversight` | every skill | Standing context: voice, contracts, posture, conventions |
| `data/BACKLOG.md` | `triage`, `ship-data audit` | `ship-data` | Pending data layer work |
| `setup/NN_<service>.md` | `bootstrap`, hand-authored | `bootstrap`, operators | External-service runbooks (status: STUB / PARTIAL / OK) |

Every skill writes its findings to the appropriate file and commits
in a single push. Every skill reads the files at the start of its
run. **The git log IS the timeline.** "What did the loop do
overnight?" is `git log --oneline` over the relevant range.

---

## The 11 skills

### Outer dispatcher

#### `march` — *"do the right thing"*

The autonomous-beast entry point. Each tick:

```
unlabeled GitHub issues exist  →  /triage
ELSE critique window open      →  /critique
ELSE pending phase             →  /ship-a-phase
ELSE pending data backlog      →  /ship-data
ELSE expand window open        →  /expand
ELSE                           →  /iterate
```

Reads cheap signals first (issue count) and falls through to
deeper work. Run under `/loop 30m /march` for an overnight loop, or
invoke once for a single tick.

### Intake — fill the queues

#### `triage` — issues → backlog

Reads unlabeled GitHub issues. Classifies (bug / enhancement /
content / data / docs / seo / a11y / perf). Labels + comments +
routes to `plan/AUDIT.md` or `data/BACKLOG.md`. Cheap when idle
(zero issues → exit in <1s). Closes the loop when downstream
ships the fix via a `Closes #N` commit trailer.

#### `critique` — external observer

Spawns a `reader` sub-agent with browser tools, walks the live
site as a first-time visitor, returns findings as JSON. Main
agent self-assesses (drops duplicates, re-rates severity, filters
non-actionables) and files up to 6 rows to `plan/CRITIQUE.md`.
Rate-limited by `/march` (≥12 commits + ≥24h spacing + green
deploy + no pending HIGH).

#### `jot` — the user's quickfire

User spots something. Types `/jot <text>`. One row gets appended
to `plan/CRITIQUE.md` with `source: user` and a +0.5 score bump.
No questions back, no verify gate, no deploy gate. Targets <10s
end-to-end. The next `/iterate` tick almost certainly picks it up.

### Drainage — ship the work

#### `ship-a-phase` — ship one phase end-to-end

Reads `plan/steps/01_build_plan.md` for the next `[ ]` row and
`plan/phases/phase_<N>_<topic>.md` for the brief. Builds, writes
tests, runs the verify gate (`typecheck → test → data:validate →
build → e2e`), commits, pushes, runs `deploy:check`, posts the
phase mirror close-comment. If the brief is missing, falls through
to `/plan-a-phase` first.

#### `ship-data` — one data record

Reads `data/BACKLOG.md` for the next pending row. Pattern-agnostic
(GitHub-as-DB / external DB / SaaS / hybrid). Enforces a
**provenance marker** on every record (source / verified /
citations). AI-generated records require citation backfill via
`scout` before publish.

#### `iterate` — audit + ship one fix

Reads `plan/AUDIT.md` Pending + `plan/CRITIQUE.md` Pending + the
`triage:loop-queued` issue queue. Scores `impact × ease / 10`
(plus a +0.5 user-source bump). Ships the top finding through
the verify gate. Moves the row Pending → Done with the commit
hash. Falls through to `/expand` when no findings score ≥ 3.0
(bold posture) — the "make things brilliant when delivery is
not" path.

### Planning — refine + propose

#### `plan-a-phase` — refine a brief

Reads bearings + canonical sibling + design layer + spec. Writes
a comprehensive phase brief to `plan/phases/phase_<N>_<topic>.md`
with all decisions resolved upfront ("DO NOT ASK"). Does NOT
modify code. Output is what `ship-a-phase` reads next tick.

#### `expand` — propose new phases

Reads accumulated signals: audit findings clustered, critique
findings clustered, spec drift since last expand, design landings,
triage backlog patterns, data growth, commit-pattern signals.
Surfaces top 3 candidates (max) to `plan/PHASE_CANDIDATES.md`.
Posture-controlled in `plan/bearings.md`:

- `bold` (default) — files candidates; `/oversight` promotes
- `strict` — no-op, build plan stays exactly as authored
- `autonomous` — writes new phase rows directly to the build plan

### User-in-the-loop

#### `oversight` — pause, audit, ask, adjust

The only skill (besides `bootstrap`) that uses `AskUserQuestion`.
Reads recent commits, deploy state, all four pending queues, last
3 phase briefs, design tree. Brief-then-ask: 1–4 targeted questions
computed from observed flags (not pre-canned). Applies answers as
plan-file edits in a single commit. Promotes/rejects phase
candidates. Sets `Bias:` directions for the next `/iterate` pass.

### Setup

#### `bootstrap` — tokens-in → ticking loop

Provisions external services from tokens-in to green-deploy +
cloud loop running. Reads `setup/NN_<service>.md` runbooks; writes
secrets to `.env` / GitHub Actions / hosting env. May pause via
`AskUserQuestion` on inherent-human handoffs (CLI auth, OAuth
approvals, DNS). NOT invoked under `/loop` or `/march`.

---

## How they compose

A typical day in the loop's life:

```
                              ┌──────────────┐
  User files GitHub issue ──> │   /triage    │ ──┐
                              └──────────────┘   │
                                                 ▼
                                       plan/AUDIT.md
                                       data/BACKLOG.md
                                                 │
                              ┌──────────────┐   │
  Build deploy green     ──>  │  /critique   │ ──┤
  + 12 commits passed         └──────────────┘   │
                                                 ▼
                                       plan/CRITIQUE.md
                                                 │
  User spots something   ──>  /jot ─────────────>┤
                                                 │
                              ┌──────────────┐   │
                              │   /march     │   │
                              │  (dispatch)  │   │
                              └──────┬───────┘   │
                                     │           │
              ┌──────────────────────┼───────────┘
              │                      │
              ▼                      ▼
  ┌──────────────────┐    ┌──────────────────┐
  │  /ship-a-phase   │    │    /iterate      │
  │ (phase pending)  │    │  (drain queue)   │
  └──────┬───────────┘    └──────┬───────────┘
         │                       │
         ▼                       ▼
   Phase ships           One fix ships
   plan/steps ✓          AUDIT/CRITIQUE row Done
         │                       │
         └────────────┬──────────┘
                      ▼
                ┌─────────┐
                │ /expand │  (when iterate finds nothing actionable
                │         │   and posture is bold)
                └────┬────┘
                     ▼
            plan/PHASE_CANDIDATES.md
                     │
                     ▼
              ┌─────────────┐
              │ /oversight  │  (user reviews, promotes, rejects)
              └─────────────┘
```

The dispatcher is the only place that knows the order. Each skill
is local: it reads state, does its bounded thing, writes state,
exits. You can replace any skill with a fresh implementation
without touching the others.

---

## Installation

### Option A — user-global (recommended for testing across projects)

```bash
mkdir -p ~/.claude/skills
cp -r src-skills/* ~/.claude/skills/
```

Now every Claude Code session, in any project, has all 11 skills
available. Verify with `claude --list-skills` or by typing `/march`
in any project.

To pick up changes you make to `src-skills/`, re-run the `cp`. Or
symlink each skill folder so edits are live:

```bash
for s in march iterate ship-a-phase plan-a-phase ship-data \
         critique triage expand oversight jot bootstrap; do
  ln -sf "$(pwd)/src-skills/$s" "$HOME/.claude/skills/$s"
done
```

### Option B — project-local

```bash
mkdir -p .claude/skills
cp -r src-skills/* .claude/skills/
```

Project-local skills shadow user-global ones with the same name.
Useful for testing a skill variant on one project without polluting
the rest.

### Verify the install

```bash
claude --print "/march" 2>&1 | head -5
```

If you see the `/march` skill body loaded into Claude's context,
the install worked. The skill name is the kebab-case folder name
under `src-skills/`.

---

## First-run setup on a fresh project

The skills assume a specific file convention. Before invoking
anything autonomous, seed these files:

```
your-project/
├── plan/
│   ├── bearings.md           # standing context (see below)
│   ├── AUDIT.md              # ## Pending + ## Resolved blocks
│   ├── CRITIQUE.md           # ## Pending + ## Done blocks
│   ├── PHASE_CANDIDATES.md   # ## Pending + ## Promoted + ## Rejected + ## Considered
│   ├── steps/
│   │   └── 01_build_plan.md  # Status (at-a-glance) + Per-phase scope
│   └── phases/               # phase_<N>_<topic>.md briefs as they're written
├── setup/
│   ├── 00_files.md           # external-services index
│   └── NN_<service>.md       # one runbook per external service
├── data/
│   └── BACKLOG.md            # pending data work (omit if no data layer)
├── .env                      # GH_TOKEN, deploy provider tokens, etc.
├── .env.example              # documented expected keys
└── scripts/
    └── deploy-check.mjs      # post-push deploy gate (provider-specific)
```

### `plan/bearings.md` — the contract file

Every skill reads this at the top of its run. Minimum sections:

```markdown
# Bearings — <project>

## What we're building
<1-3 paragraphs; project token in code/config; canonical production URL>

## Stack (locked — do not re-litigate)
<table of layer / choice / why>

## External services
<table of #/service/runbook/status/last verified/dashboard>

## URL contract (locked)
<every URL the project commits to; phases add to it via oversight>

## Plan expansion posture
- Mode: **bold** (default) | **strict** | **autonomous**

## Hard rules
<commit/push as atomic, no Co-Authored-By, no emojis, etc.>

## Verify gate
<the commands a phase ship must pass>
```

The `Auth:` and `Surface:` fields drive `/critique`'s reader. The
`Posture` line drives `/expand`. The `Hard rules` block is what
every skill cites when it explains why it did or didn't do
something.

### Sample minimal `01_build_plan.md`

```markdown
# 01 — Build plan

## Status (at-a-glance)

- [ ] Phase 1 — Bootstrap (Next.js scaffold + verify gate + deploy gate)
- [ ] Phase 2 — <next phase>
- [ ] Phase 3 — <next phase>
...

## Per-phase scope

### Phase 1 — Bootstrap
<2-4 paragraphs of scope>

### Phase 2 — <topic>
<scope>

## Carry-overs / known gaps
<items that span phases>

## Phase log (commit hashes)
<one row per shipped phase, populated as they land>
```

---

## Posture knobs

`plan/bearings.md` carries a small set of knobs that change skill
behavior without touching code:

### `Plan expansion posture`

```markdown
## Plan expansion posture
- Mode: **bold** (default)
```

| Mode | `/expand` behavior | `/iterate` fallthrough |
|---|---|---|
| `bold` | Files candidates to PHASE_CANDIDATES.md; oversight promotes | When top score < 3.0, dispatches to /expand |
| `strict` | No-op (exits 0). Build plan stays exactly as authored | Stops with "site is well-iterated" |
| `autonomous` | Writes phase rows directly to 01_build_plan.md, no oversight | Same as bold |

Use `strict` when you've decided what's in scope and don't want the
loop second-guessing. Use `autonomous` only when the loop is deeply
trusted on a spec that's stable.

### `Bias` lines (set via `/oversight`)

`/oversight` can prepend a bias header to `plan/AUDIT.md`:

```markdown
> Bias: a11y (set via oversight 2026-05-18)
```

`/iterate` multiplies scores in that category by 1.5. Useful for
"sweep all the a11y findings before going back to general drain."

### `[operator]` rows

Findings in `plan/AUDIT.md` tagged `[operator]` are skipped by
`/iterate` by design. They surface in `/oversight` briefs but
never auto-fix. Use for "the operator needs to populate this env
var" or "this needs an Anthropic API key set in prod."

---

## Customization — what's project-specific vs convention

When you drop these skills into a new project, the **conventions**
travel with them (the plan/* file shapes, the verify/deploy gate,
the queue contracts). The **specifics** you author yourself.

| Concept | Convention (in the skills) | You author |
|---|---|---|
| File paths | `plan/`, `setup/`, `data/`, `.env` | The file *contents* |
| Verify gate | `pnpm verify` runs the gate | The gate commands themselves (package scripts) |
| Deploy gate | `scripts/deploy-check.mjs` polls a provider | The provider integration (Vercel/Netlify/etc.) |
| URL contract | `plan/bearings.md` "URL contract" block | The actual URLs your product commits to |
| Critique reader | a sub-agent named `reader` with browser tools | The sub-agent definition under `.claude/agents/` |
| Triage labels | `triage:*` + category labels | The label colors + descriptions on your repo |

The skills are agnostic about stack — they reference `pnpm` only as
the convention name; if your project uses `npm` or `yarn` or `bun`,
search-and-replace in your local copy. Same for `gh` (used for
GitHub issues) — most projects use it, but if yours uses a
different forge, the skills emit clear errors so you can swap.

The `customization/` doc tree (referenced in several skills as
`../../nexus/customization/<name>.md` or `../customization/<name>.md`)
holds the longer-form docs for patterns the skills assume:

- `external-services.md` — runbook shape + status legend
- `data-layer.md` — the four patterns ship-data supports
- `verify-gate.md` — the hermetic verify contract
- `hermetic-e2e.md` — how to set up Playwright against a built app
- `auth-aware-critique.md` — anonymous vs authenticated critique passes

If you're testing the skills standalone, you can ignore those —
they're nice-to-have references, not load-bearing.

---

## Local testing path

Quickest path to validate the workflow works:

1. **Install** to `~/.claude/skills/` (Option A above).
2. **Pick a small project** with a git repo, a deploy gate (even a
   trivial `vercel deploy` or `netlify deploy`), and a verify gate
   (`pnpm verify` or equivalent).
3. **Seed `plan/bearings.md`** — 50 lines max for testing. Include
   `Plan expansion posture: bold`.
4. **Seed `plan/steps/01_build_plan.md`** with 3 small phases.
5. **Seed empty `plan/AUDIT.md` + `plan/CRITIQUE.md`** (with the
   header and `## Pending` / `## Done` blocks).
6. **Invoke `/march`** in Claude Code. The dispatcher reads state,
   finds the pending phase, dispatches to `/ship-a-phase`, which
   finds the brief missing, dispatches to `/plan-a-phase`, drafts
   the brief, exits.
7. **Invoke `/march` again.** This time the brief is current; ship
   the phase end-to-end.
8. After the phase ships: invoke `/critique` manually to seed
   `plan/CRITIQUE.md` with findings.
9. **Invoke `/iterate`** — it drains the top finding.

You've now run the four core paths of the loop. Layer in `/triage`
by filing a GitHub issue with no label; `/expand` by waiting for
its rate-limit window; `/oversight` whenever you want to redirect.

---

## What's deliberately NOT in scope

These skills don't try to be everything. They're aggressively
file-first; they assume git is the durable substrate; they assume
GitHub for issues. If your stack differs:

- **No git** → most of the durability assumption breaks. Skills
  could be adapted but you'd lose the "git log is the timeline"
  property.
- **No GitHub** → `/triage` doesn't apply; the rest still does.
  Adapt the issue-tracker integration in `/triage` and remove the
  dependency from `/march`'s gate.
- **No deploy gate** → `/ship-a-phase` will fail at step 12; you
  can either stub `scripts/deploy-check.mjs` to always exit 0
  (lose the post-push verification) or remove the step.
- **No verify gate** → same as above with step 9. Removing this
  one gives up a lot of safety; not recommended.

---

## Versioning + updates

This is a snapshot from boardroom-breakdown's `skills/` directory
at the moment the project hit 18 phases + post-build steady state.
The skills evolved through the build; what you see here is the
post-stabilization shape. If you find a rough edge:

1. **Edit your local copy** under `~/.claude/skills/<name>/SKILL.md`.
2. **Test on a real project** — most issues only surface mid-tick.
3. **Diff against the original** (`diff src-skills/.../SKILL.md
   skills/<name>.md`) to confirm you're not re-introducing
   project-specific bleed.

The conventions (plan file shapes, posture knobs, gate contracts)
are the most stable part — change those last. Behavior tweaks
inside each skill are the easiest to safely vary.

---

## Index

```
src-skills/
├── README.md              ← this file
├── march/SKILL.md         ← outer dispatcher
├── triage/SKILL.md        ← GH issues → labels + backlog routing
├── critique/SKILL.md      ← external observer pass → CRITIQUE.md
├── jot/SKILL.md           ← user quickfire → CRITIQUE.md
├── ship-a-phase/SKILL.md  ← ship one phase end-to-end
├── ship-data/SKILL.md     ← ship one data record (pattern-agnostic)
├── iterate/SKILL.md       ← drain audit/critique queue
├── plan-a-phase/SKILL.md  ← refine/generate one phase brief
├── expand/SKILL.md        ← propose new phase candidates
├── oversight/SKILL.md     ← user-in-the-loop course-correction
└── bootstrap/SKILL.md     ← provision external services
```

Each `SKILL.md` opens with YAML frontmatter (`name`, `description`)
that Claude Code uses to match the skill to a user request, followed
by the full procedure document. Read any of them top-to-bottom and
you have everything you need to invoke that skill correctly.
