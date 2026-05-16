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

*Pinned by Batch 2 of the pre-spec interview.*

## Surface — hosting, visual system, voice, cadence

*Pinned by Batch 3 of the pre-spec interview.*
