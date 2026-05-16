# bearings — boardroom

> Standing decisions the loop reads every phase. Treat this as
> the pin board: every entry is a decision already made; revisit
> only with a deliberate amendment. Phase briefs and the build
> plan live in `plan/` and arrive in Phase B (nexus adoption).

## Project token

- **`boardroom`** in code, configs, and copy. Repo directory
  remains `boardroom-breakdown`.

## Surface

- Web app. Browser-first, desktop-class viewport at v1 (no
  mobile-first commitment). The drag-and-drop board needs
  mouse-level precision; mobile is a later phase.

## Persona

- Solo builders, indie devs, and early-stage PMs new to
  multi-agent AI workflows. Every UX call defers to this user.

## Stack (placeholder — pinned in Phase B adoption)

- TBD in Phase B. Bias: a single full-stack TypeScript framework
  with a strong default story for streaming AI responses and
  managed-Postgres adapters.

## Data architecture

- **`hybrid-with-managed-postgres`.**
  - Repo holds: persona definitions, the v1 discussion template,
    prompt scaffolds.
  - Postgres holds: accounts, sessions, conversation transcripts,
    generated artifacts, audit/observability rows.

## Auth, identity, anti-abuse, moderation

- Pinned in Batch 2.

## Hosting, voice, cadence

- Pinned in Batch 3.

## Hard rules

- Any question put to the user accepts a 1-word or 1-sentence
  answer. Never more.
- No checkpoint surfaces more than **5** questions.
- The agents do the thinking. The user supplies the pitch and
  the occasional accept/redirect; they do not author prompts.
- v1 ships one discussion template and one output type
  (`spec.md` + exec summary + call-outs). Additional output
  types and user-authored templates are out of v1.
- File-as-source for personas, templates, and prompt scaffolds.
  Authoring those flows happens via PR until the product grows
  an in-product editor.
