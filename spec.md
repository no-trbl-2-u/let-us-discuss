# boardroom — spec v0

> **One-line pitch.** A drag-and-drop "board room" simulator that
> turns a loose pitch into a concrete spec by orchestrating a
> short, opinionated conversation between AI personas — so users
> new to multi-agent workflows can get a usable artifact without
> learning prompt engineering first.

**Working token:** `boardroom` (used in code/config). Repo
directory stays `boardroom-breakdown`.

**Pre-spec carve-out.** This document was drafted via the nexus
pre-spec interview on 2026-05-16. `AskUserQuestion` was
permitted under the pre-spec carve-out. From the final pre-spec
commit forward, autonomy resumes — only `/oversight` may ask.

---

## Audience (v1)

**Solo builders, indie devs, and early-stage PMs who are new to
multi-agent AI workflows.**

They have an idea but no spec. They've heard "multi-agent" and
"agent orchestration" thrown around, may have tried a single
ChatGPT thread for spec work, and bounced off the friction of
hand-rolling personas, prompts, and turn-taking. They want a
short guided session that produces a usable spec they can
hand off (or paste into a tool like nexus). Time budget: 15–30
minutes of attention; not a full afternoon.

This persona drives two hard product calls:

1. The user is **never** asked more than a handful of questions,
   and each answer fits in one word or one sentence.
2. The agents do the thinking. The user supplies the pitch and
   the occasional checkpoint nudge.

## v1 scope

In v1, the product ships a single end-to-end loop with one
output type.

- **Single discussion template:** "pitch → spec." One opinionated
  multi-phase flow; the user does not pick or compose templates.
- **Pre-built persona library:** A small, curated set of personas
  (e.g. product lead, skeptical engineer, growth voice, end-user
  proxy). The user drags personas onto the board to staff the
  session.
- **One output type:** `spec.md` (plus an executive summary and
  a "call-outs" file for items the conversation surfaced but
  decided out-of-scope).
- **Session loop:**
  1. User drops personas onto the board, enters a loose pitch.
  2. "Lead" personas circle once with 1–4 brief clarifying
     questions ("I don't know" is a valid answer).
  3. Personas confer, extrapolate, refine; produce a short
     executive summary for the user to accept or redirect.
  4. Specialists confer; only escalate back to the user if the
     personas can't converge.
  5. Final UI presents: executive summary, the spec, and
     call-outs. User downloads the artifacts.
- **Anonymous read, authenticated write.** A user can land,
  watch a demo session, and try one short session without an
  account; a signed-in account is required to persist or
  download artifacts (auth details land in Batch 2).
- **Hardline UX rules:**
  - Any question put to the user expects a 1-word or
    1-sentence answer.
  - No checkpoint surfaces more than 5 questions.
  - The personas do the thinking; the user does not author
    prompts.

## Out of v1 (named, not forgotten)

- **User-created personas.** Questionnaire- or document-upload
  flows for custom personas. (Note in `notes.md` future ideas.)
- **Alternative output types.** Chapter outlines, presentation
  outlines, questionnaires, brand briefs. The architecture
  should leave room; the v1 ships spec only.
- **Spec-as-input.** Uploading an existing spec to refine or
  build a dependent spec.
- **User-composed discussion templates.** v1 ships one curated
  template; template authoring is a later phase.
- **Public sharing / multi-user sessions.** Single-user
  sessions only in v1.
- **Skill-pack export** (downloading the session as
  `SKILL.md`-shaped files for paste-into-nexus). Hinted at in
  notes; deferred.

## Data architecture

**`hybrid-with-managed-postgres`.**

- **In the repo (file-as-source):**
  - Persona definitions (system prompt, voice, role, tools).
  - The v1 discussion template (phase list, turn-taking rules,
    convergence/escalation heuristics).
  - Prompt scaffolds and constants the agents read at runtime.
  - These are git-reviewable so personas can evolve via PR.
- **In managed Postgres** (Supabase / Neon / Turso — pinned in
  Batch 2):
  - User accounts and session state.
  - Conversation transcripts (per-session message log).
  - Generated artifacts (spec.md, exec summary, call-outs) and
    their export records.
  - Audit + observability rows (token usage, cost per session,
    moderation flags).

Migration to `pure-db` later is cheap if persona authoring moves
into the product. Migration the other direction is not planned.

---

## Spine — auth, identity, abuse, moderation

### Auth provider

- **Supabase Auth** with magic-link as the primary flow.
- Pairs with the `hybrid-with-managed-postgres` data call —
  Supabase covers identity *and* Postgres in one wired surface,
  which collapses two pre-flights into one for the v1 phases.
- One external service to pre-flight (env vars, RLS policies,
  email-sender domain).

### Identity tiers

- **Anonymous** users can:
  - Land on the marketing surface.
  - Read documentation about how a boardroom session works.
  - Run **one short demo session** (capped at a small token /
    turn budget) without signing in. The demo persists to
    `sessionStorage` only, evaporates on tab close, and cannot
    be downloaded as files.
- **Authenticated** users (magic-link signed-in) can:
  - Run full sessions with the standard token / turn budget.
  - Persist session transcripts and generated artifacts to the
    database.
  - Download `spec.md`, the exec summary, and the call-outs
    file.
- The demo cap exists to let the persona ("new to multi-agent
  AI") *feel* the loop before paying with their email.

### Anti-abuse posture

Three lightweight controls, layered:

- **Per-account session quota.** Authenticated users get N
  sessions/day (initial N pinned in a config file; revisitable
  in `/oversight`).
- **Per-IP rate limit** on the anonymous demo path so a single
  bad actor can't grind the demo for free LLM calls.
- **Per-session token cap.** Every session has a hard token
  ceiling; the conversation gracefully wraps at the cap with
  the artifacts produced so far, even if the personas haven't
  fully converged.
- Cost-of-abuse is bounded by all three. No CAPTCHA, no
  account-age gate — those tax the persona without addressing
  the real failure mode (cost runaway).

### Moderation flow

- **AI pre-filter, two-sided.** OpenAI moderation endpoint (or
  the equivalent of whichever provider we pin in Phase B) runs
  twice per turn:
  1. On the **user's pitch / typed input** before it is fanned
     out to persona prompts.
  2. On **each persona output** before it is rendered or
     persisted.
- Clean → continue normally. Suspect → halt the session,
  surface a polite refusal in the UI, and log the flag row to
  Postgres for audit. No human moderation queue at v1; sessions
  are single-user and not published anywhere.
- A `/moderate`-style skill becomes worth adding only if v1
  shows a non-trivial flag rate.

## Surface — hosting, visual system, voice, cadence

### Hosting

- **Vercel.** Pairs cleanly with a Next.js full-stack TS app and
  the Vercel AI SDK's streaming primitives. Production deploys
  ride preview-deploy gates per nexus convention.
- Supabase project lives outside Vercel; only env vars cross
  the boundary.

### Visual system

- **Commissioned per-project.** v1 ships only after a
  design-focused Claude session lands a `design/` tree
  (`tokens.css`, `primitives/`, `compositions/`, `decisions.md`,
  `INDEX.md`). The board-room metaphor is load-bearing for the
  product — a generic shadcn theme would undersell the
  drag-and-drop affordance.
- Prompt for the design session lives at
  `claude-design.prompt.md` (committed alongside this spec).
- Per nexus rule: `design/` wins over `bearings.md` on visual
  conflict.

### Voice

- **One sentence, baseline:** *Knowledgeable colleague who's
  been-there. Plainspoken, terse, no marketing fluff. Explains
  its reasoning when it makes a judgment call.*
- This baseline governs the **product surface** (UI copy,
  errors, empty states). Each **persona** in the board-room
  library has its own voice on top of this baseline — the
  baseline is what the *product itself* sounds like when it
  isn't speaking as a persona.

### Cadence

- **No fixed cadence.** boardroom is not editorial; it doesn't
  publish pages on a schedule. `/iterate` drains audit findings
  as they surface. Volume is a function of audit depth, not a
  calendar. Persona library and discussion-template changes
  flow through normal PRs.

---

## See also

- `plan/bearings.md` — standing decisions pinned for every
  phase to read.
- `claude-design.prompt.md` — paste-into-a-fresh-session prompt
  that commissions the v1 visual system.
- `NEXUS_LESSONS.md` — gaps noticed in the nexus playbook
  during the pre-spec interview (for a later `/lessons-pr`
  pass back).
