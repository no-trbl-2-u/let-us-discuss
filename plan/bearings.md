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

- **Auth provider:** Supabase Auth (magic-link primary).
  Same Supabase project also fronts Postgres for v1.
- **Identity tiers:**
  - Anonymous → marketing pages + **one short demo session**
    (token/turn-capped, `sessionStorage` only, no download).
  - Authenticated → full sessions, DB persistence, artifact
    download.
- **Anti-abuse (layered):**
  - Per-account session quota (N/day; constant lives in config,
    revisable via `/oversight`).
  - Per-IP rate-limit on the anonymous demo path.
  - Per-session **token cap**; conversation wraps gracefully
    at the cap and emits whatever artifacts exist.
  - No CAPTCHA, no account-age gate at v1.
- **Moderation:**
  - AI pre-filter on user input *before* fan-out to persona
    prompts.
  - AI pre-filter on each persona output *before* render /
    persist.
  - Suspect → halt session, polite refusal, audit row in DB.
  - No human queue; no `/moderate` skill at v1.

## Hosting

- **Vercel.** Next.js app on Vercel; Supabase project external.
  Preview-deploy gates per nexus convention. AI streaming uses
  the Vercel AI SDK (or equivalent edge-runtime primitive).

## Visual system

- **Commissioned per-project.** v1 blocks on a `design/` tree
  produced by a separate design-focused Claude session.
- Authoritative location: `design/tokens.css` +
  `design/decisions.md`. **`design/` wins over `bearings.md`
  on conflict** (per
  `../nexus/customization/visual-system.md`).
- Commission prompt: `claude-design.prompt.md` (this repo).
- Working defaults (apply only when `design/` absent):
  - Mode: TBD by design session.
  - Type families: TBD by design session.
  - Single-accent palette; the board-room metaphor demands a
    physical-table feel (paper/ink defaults until proven
    otherwise).

## Voice

- **Baseline (product surface):** *Knowledgeable colleague
  who's been-there. Plainspoken, terse, no marketing fluff.
  Explains its reasoning when it makes a judgment call.*
- Persona voices layer on top; the baseline governs the
  product's own UI strings.

## Cadence

- No fixed cadence. `/iterate` drains audit findings as found.
  Persona-library and discussion-template changes ship via
  normal PR.

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
