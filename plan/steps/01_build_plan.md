# 01 — Build plan

> Style guardrails for every phase below. Always ship unit tests
> alongside code — never "add tests later". Break work into
> small, focused components in folders. Pure helpers go in their
> own modules with their own tests. Prefer 5 small files with
> clear names over 1 dense file.

## Status (at-a-glance)

`/march`, `/ship-a-phase`, and (transitively) `/loop` read this
block to find the next phase. Format: `[ ]` pending → `[x]`
shipped (with commit hash). Tick in this file in the same
commit that ships the phase.

**Substrate (phases 1–5):**
- [x] Phase 1 — Bootstrap (Next.js 15 + Tailwind + Biome,
      verify gate green, deploy gate functional, marketing
      landing renders) — `c37471b`
- [x] Phase 2 — Supabase wired (project linked, env example,
      typed client, `setup/03_supabase.md` upgraded from STUB) — `626e61c`
- [x] Phase 3 — Auth (magic-link sign-in, `/signin`,
      `/auth/callback`, session-aware server actions, anon vs.
      authed middleware) — `eb5e302`
- [x] Phase 4 — Persona + template substrate (markdown/JSON
      under `personas/` and `templates/`, Zod schemas,
      `pnpm data:validate` green, persona library renders
      read-only) — `1db4a2f`
- [x] Phase 5 — Boardroom canonical surface (the drag-and-drop
      board, persona-card primitives, empty/active/in-progress
      states; **canonical sibling** — every later in-app
      surface mirrors its shape) — `6123320`

**Feature surfaces (phases 6–13):**
- [x] Phase 6 — Anonymous demo loop (`/try` — capped session,
      sessionStorage only, no DB write; happy-path end-to-end
      with one persona for the smoke test) — `38fb53f`
- [x] Phase 7a — Sessions API scaffold + DB schema
      (sessions/turns/artifacts migration with RLS;
      /api/sessions route shell that returns
      session.error code=not-implemented end-to-end; shared
      SSE event types, repo helpers, budget tracker,
      AnthropicConfigError factory; session-side reducer +
      stream hook wired to the Start button; no LLM calls) — `3ff025a`
- [x] Phase 7b — Multi-persona conferring loop (Anthropic
      orchestrator replaces the not-implemented return;
      clarify → confer → exec-summary checkpoint →
      specialists → artifact rounds; LiveTranscript +
      ClarifyPrompt + ExecSummaryCard + ArtifactPreviewGrid
      light up). The product's core gameplay; budget extra
      care. Requires ANTHROPIC_API_KEY populated. — `305bb25`
- [x] Phase 8 — Moderation gates (input + output pre-filter
      via OpenAI omni-moderation; halt-and-refuse UX;
      `flag_audit` table) — `41803c4`
- [x] Phase 9 — Anti-abuse limits (per-account session quota,
      per-IP demo limit, per-session token cap, graceful wrap
      UX) — `f82f35a`
- [x] Phase 10 — Artifact render + download (spec.md, exec
      summary, call-outs; client-side download; cleanly
      typeset preview tiles) — `18277f2`
- [x] Phase 11 — Past-session surface (`/app/sessions`,
      `/app/sessions/[id]`, `/app/sessions/[id]/transcript`) — `f017ff9`
- [x] Phase 12 — About + legal (`/about`, `/legal/privacy`,
      `/legal/terms`) — `6f32cb8`
- [x] Phase 13 — `/api/health` + smoke-walker integration into
      hermetic e2e — `93c57ff`

**Cross-cutting (phases 14–17):**
- [x] Phase 14 — A11y + keyboard sweep (drag-drop has a
      keyboard equivalent; transcript is screen-reader
      navigable) — `728595b`
- [x] Phase 15 — Performance + meta (RSC streaming smooth,
      Lighthouse meta complete, OG image rendered) — `8f39b59`
- [x] Phase 16 — Observability (token-usage + cost-per-session
      surfaced in `/app/sessions/[id]`; basic error logging to
      Vercel's surface) — `7171206`
- [x] Phase 17 — Polish (404, error boundaries, empty states,
      transitions per `design/decisions.md` motion stops) — `09e85c2`

**Post-build additions (promoted by `/oversight`):**
- [x] Phase 18 — Account deletion + data wipe (settings
      route to close an account; server action that cascades
      delete across `sessions`/`turns`/`artifacts`/`flag_audit`
      + Supabase `auth.deleteUser`; closes the privacy-policy
      promise from phase 12) — `e2c10eb`
- [x] Phase 20 — Framework engine refactor + standalone test
      harness (move orchestrator schemas to
      `src-ai-skills/schemas/` as the single source of truth;
      boardroom imports from there; vitest suite in
      `src-ai-skills/__tests__/` validates reference personas +
      template + orchestrator behavior against a stub LLM
      client. Closes the framework-vs-impl-drift risk before
      phases 21–22 ship the secretary work.) — `358c84d`
- [x] Phase 21 — Secretary persona + Mode 1 (in-session)
      (extend persona role enum to include `secretary` with a
      cast guard requiring exactly one; ship the secretary.md
      persona to `personas/`; orchestrator invokes secretary
      at every phase boundary with the 4-taxonomy structured-
      log prompt; compile into a `secretary-log.md` fourth
      artifact at the artifact phase; authed e2e walks one
      secretary turn end-to-end) — `fada1d9`
- [x] Phase 22 — Secretary Mode 2 + cross-session retros
      (orchestrator invokes secretary one final time after
      the artifact phase to write a retrospective entry;
      `loadRetros()` / `appendRetro()` hooks back the project-
      level `retros.md` file; add the `retro-review` checkpoint
      phase to the template + the UI that surfaces past
      "for next time" items before clarify; the user picks
      zero/some, their answers feed into clarify context) — `3465e5c`
- [x] Phase 23 — Admin / dev dashboard (read-only `/admin`
      route, env-gated via `ADMIN_EMAILS`; surfaces
      sessions/day, tokens/day, top-cost sessions, flag rate,
      error rate as monospace tiles. Adds `/admin` to the
      bearings URL contract in the same PR. No write actions
      in v1; reads from phase 16's existing observability
      columns + the `flag_audit` table. Closes phase 16's
      filed follow-up "per-account aggregate dashboard.") — `1a6bcf0`
- [x] Phase 24 — Model picker for the boardroom session
      (user-selectable model used by all personas in a
      session; `AVAILABLE_MODELS` allowlist in
      `lib/anthropic/models.ts`; `<ModelPicker>` in the
      boardroom shelf; `/api/sessions` accepts + validates
      `model` on create with allowlist fallback. Authed-only
      so phase 9's auth boundary bounds cost runaway;
      per-model caps deferred. Per-persona model selection
      is a later follow-on.) — `d0ba0f0`
- [x] Phase 25 — Loose usage estimator (pre-session forecast
      tile in the boardroom shelf reads phase 24's selected
      model + a hand-pinned "typical session" range; renders
      `~X–Y tokens · ~$A–$B (rough estimate)` with locked
      disclaimer copy. Cross-session aggregate
      `getUserUsageSummary(userId, window)` tile on `/app`
      or `/app/settings` for `today | 7d | 30d`. Explicitly
      excludes the per-session footer already shipped by
      phase 16; the brief calls that out to prevent scope
      leak.) — `740d7ad`
- [x] Phase 26 — BYO Anthropic API key (foundation:
      encrypted-key schema via Supabase Vault or pgsodium;
      `lib/byok/encrypt.ts` + `decrypt.ts` server-only;
      `/app/settings/api-key` UI to paste/rotate/revoke;
      audit trail of add/rotate/revoke events. Adds
      `/app/settings/api-key` to the bearings URL contract.
      Scout pass during brief generation confirms Vault vs.
      application-level KMS choice. Ship before phase 27 —
      phase 27 reads the encrypted key.) — `c162ed8`
- [ ] Phase 27 — BYO Anthropic API key (orchestrator
      integration: active session reads the user's key when
      present and instantiates a second Anthropic client;
      falls back to the project key when absent; per-session
      log records *which* key was used for honest accounting;
      "you're paying now" banner on the boardroom shelf for
      user-key sessions. Polish (model-allowlist intersection
      with user's account permissions, per-key spend tile,
      first-run warning checkbox) folded into /iterate after
      this ships.)
- [ ] Phase 28 — `CLARIFY-QUESTION-FORMAT.md` (nexus's
      "asking-well" rules for runtime leads: 1–4 questions
      per batch, recommended option first, descriptions
      name the trade-off, 2–4 sentences of prose before
      asking). New
      `src-ai-skills/CLARIFY-QUESTION-FORMAT.md`; referenced
      from `PERSONA-FORMAT.md §Role/lead`; one-paragraph
      reminder in each lead persona body
      (`product-lead.md`, `skeptical-engineer.md`).
      Optional lightweight orchestrator-side validator on
      clarify-prompt outputs — hard-vs-soft enforcement
      resolved in the brief per AUDIT
      `[needs-user-call]` "Three framework-spec
      questions" Q2. Promoted by `/oversight` 2026-05-20
      (round 16) from `plan/PHASE_CANDIDATES.md`
      `[7.0] Idea 1`. Sequenced after BYOK (26 + 27) per
      the candidate's own note.

> **Phase numbering note:** Phase 19 (Quota visibility) was
> promoted in round 7 but never shipped; oversight round 10
> demoted it back to deferred in
> `plan/PHASE_CANDIDATES.md`. The phase number 19 stays
> reserved as a marker for "this slot was once promoted";
> phases 20+ continue the post-build sequence. If quota
> visibility is re-promoted later it'll get a new number,
> not phase 19.

> **After phase 17 (and any later promoted phases):** the loop
> transitions to `/iterate` — persona-library refinement,
> template tuning, fresh-eyes critique findings, audit-driven
> repairs. `/march` makes that transition automatic. Phases
> promoted via `/oversight` after phase 17 are shipped in
> order via the standard `/ship-a-phase` flow before iterate
> resumes.

> **Note on deploys before phase 1 ships:** auto-deploys to
> Vercel will fail until the bootstrap lands. The deploy gate
> reports clearly; phase 1's first push trips it; the patch
> loop within phase 1 iterates to a green deploy.

---

## Per-phase scope

Each row above corresponds to one phase. The detailed brief
lives at `plan/phases/phase_<N>_<topic>.md`. If a brief is
missing when the loop reaches its phase, the loop generates one
from the scope below + canonical sibling + any
`design/<family>/` export.

### Phase 1 — Bootstrap

Stand up Next.js 15 App Router, TypeScript strict, Tailwind,
Biome, Vitest, Playwright. Single page at `/` renders a
marketing-shaped landing. Wire `pnpm verify` end-to-end
(typecheck, unit, build, e2e — `data:validate` is a no-op
until phase 4). Wire `pnpm deploy:check` for Vercel. **Detailed
brief:** `plan/phases/phase_1_bootstrap.md`.

### Phase 2 — Supabase wired

Link the Vercel project to a Supabase project. Add typed
client (`lib/supabase/server.ts`, `lib/supabase/client.ts`).
Update `.env.example` with `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`. Upgrade `setup/03_supabase.md`
from STUB → PARTIAL (project URL + keys path, but no auth or
schema yet). Smoke test: server component reads `select 1` and
renders the result on a `/_diag` page (gated by env so it's
not public in prod).

### Phase 3 — Auth (magic-link)

Supabase Auth with magic-link only. `/signin` form, server
action that triggers `signInWithOtp`, `/auth/callback` handler.
Middleware that splits anon vs. authed routes (`/app/*`
requires session; `/`, `/try`, `/about`, `/legal/*` public).
Email template configured in Supabase dashboard with the
production sender domain noted in `setup/03_supabase.md`.
Tests: unit-test the middleware route table; e2e walks the
sign-in flow using a test inbox (Mailosaur or equivalent —
selected and pinned in this phase's brief).

### Phase 4 — Persona + template substrate

Author the v1 persona library as markdown files under
`personas/` (one per persona; frontmatter for role/voice/tools,
body for the system prompt). Author the single v1 discussion
template under `templates/pitch-to-spec.json` (phase list,
turn-taking heuristics, escalation thresholds). Define Zod
schemas under `lib/schemas/`. `pnpm data:validate` reads every
file, parses against the schema, fails on the first invalid
file. Persona library renders read-only at `/about/personas`
so the user can preview before staffing a session.

### Phase 5 — Boardroom canonical surface (CANONICAL SIBLING)

The drag-and-drop board. This is the structural template every
later in-app surface mirrors. **Spend extra care; budget 2x.**
Outputs: `app/app/page.tsx` (the board itself),
`components/boardroom/board.tsx` +
`components/boardroom/board-client.tsx` (the dnd-kit island),
`components/boardroom/persona-shelf.tsx`,
`components/boardroom/boardroom-surface.tsx`,
`components/boardroom/pitch-input.tsx`,
`components/boardroom/start-session-button.tsx`,
`components/boardroom/use-board-state.ts` +
`use-board-persistence.ts`. States: empty (no personas
staffed), staffed (personas on the table, no pitch), ready
(personas + pitch, "start session" button live), running
(read-only board with the active transcript placeholder
inline; phase 7 wires the real conferring). Persistence hook:
in this phase the board state lives in URL params +
sessionStorage; phase 6 ships the DB persist for authed users.
DnD library: `@dnd-kit/core` + `@dnd-kit/sortable` (pinned by
`/oversight` 2026-05-16). Design primitives consumed directly
from `design/primitives/`. **Detailed brief:**
`plan/phases/phase_5_boardroom_canonical.md`.

### Phase 6 — Anonymous demo loop

`/try` — anonymous, capped: pre-staffed with two personas
(can't change), 8-turn cap, sessionStorage only, no DB write,
no download (just a "sign in to keep this" CTA on the results
screen). Walk the streaming response, the moderation gates,
and the artifact render end-to-end against a single persona.
Smoke test the whole gameplay loop before phase 7 wires the
full multi-persona conferring.

### Phase 7 — Multi-persona conferring loop

The product's core gameplay. Lead-persona ring asks 1-4
clarifying questions (user answers in 1 word / 1 sentence
each). Personas confer (model-driven turn-taking), emit an
exec summary, await user accept/redirect. Specialist round
drills into the spec. Convergence heuristic; only escalate
back to the user if personas can't agree. Final artifact
render. Budget extra care — every later improvement to the
personas or the template lands here first.

### Phase 8 — Moderation gates

OpenAI omni-moderation pre-filter on user input *before*
fan-out; on each persona output *before* render/persist. Halt
session and surface a polite refusal on suspect verdict.
`flag_audit` table; row per suspect verdict with the offending
text + the verdict payload + timestamp + session id.

### Phase 9 — Anti-abuse limits

Per-account session quota (10/day initial; pinned in
`config/limits.ts`). Per-IP demo rate-limit (3/IP/day on
`/try`). Per-session token cap (60k initial); session
gracefully wraps at cap and emits whatever artifacts exist.
UX: when wrapped early, the results screen shows a clear
"session ended early — here's what we have" notice with the
partial spec.

### Phase 10 — Artifact render + download

Render the three artifacts as cleanly-typeset preview tiles
(consume `artifact-tile.tsx` from `design/primitives/`).
Client-side download as `.md` files (no server round-trip).
Filenames include the session token + ISO date.

### Phase 11 — Past-session surface

`/app/sessions` lists the user's past sessions (10/page; most
recent first). `/app/sessions/[id]` shows the results screen
again with re-download. `/app/sessions/[id]/transcript` shows
the full conversation transcript, persona-labelled, scrollable.

### Phase 12 — About + legal

`/about` explains what boardroom is and isn't; links to nexus
("how this project itself was built"). `/legal/privacy` covers
data retention (sessions kept indefinitely while account
active; deletion on account close). `/legal/terms` covers
acceptable use (refusal verdicts, account-quota policy).

### Phase 13 — `/api/health` + smoke walker

`/api/health` returns `{ ok: true, ts: <iso> }`. Hermetic e2e
smoke walker hits every locked URL contract route, asserts no
500s, and visits one happy-path session run end-to-end. Wire
into `pnpm e2e`.

### Phase 14 — A11y + keyboard sweep

Drag-and-drop has a keyboard equivalent (Tab to a persona,
Space to pick up, arrow keys to navigate slots, Space to drop).
Transcript bubbles are landmarked for screen readers. Color
contrast verified against the design palette.

### Phase 15 — Performance + meta

RSC streaming smooth on slow networks. Lighthouse meta
complete (title, description, og:image, twitter:card,
favicon). One static OG image (the boardroom metaphor) until
demand justifies per-page renders. (When/if it does, that's
when `/ship-asset` adoption gets weighed.)

### Phase 16 — Observability

`token_usage` rows per session (model, prompt-tokens,
completion-tokens, cost-estimate). Surface as a small footer
on `/app/sessions/[id]`. Wire basic error logging via Vercel's
log drain (no third-party APM at v1).

### Phase 17 — Polish

404 page, error boundaries on every route segment, empty
states for every list, transitions per `design/decisions.md`
motion stops. Sweep for the "small thing wrong" findings that
`/iterate` would have surfaced later anyway.

### Phase 19 — Quota visibility

Promoted by `/oversight` 2026-05-18 (round 7) from
`plan/PHASE_CANDIDATES.md` `[4.0] Quota visibility`. Phase 9
ships a 10-sessions/day per-account quota with graceful-wrap
UX, but users only learn about it by hitting it. This phase
surfaces remaining quota proactively as a small monospace
tile on the authed boardroom shelf (or on `/app` adjacent
to the existing Settings link): `N/10 sessions left today ·
resets at midnight UTC`. Reads from the same
`countSessionsLast24h` helper phase 9 already uses; no new
schema; no new dependencies. Composes with phase 16's
SessionUsageFooter (different surface — quota is on the
active boardroom; usage is on past sessions). Unit test
covers the count + reset boundary; no e2e (authed-only
surface; existing `/app` redirect test continues to cover
the route's auth gate).

### Phase 18 — Account deletion + data wipe

Promoted by `/oversight` 2026-05-18 (round 6) from
`plan/PHASE_CANDIDATES.md` `[5.0] Account deletion + data
wipe`. Phase 12's privacy policy commits to "deletion on
account close" with email as the manual fallback; this phase
ships the mechanism so the promise can be kept
self-service. Scope: `/app/settings/delete-account` (or a
modal off a settings menu); server action that wraps a
single transaction cascading delete across `sessions`,
`turns`, `artifacts`, `flag_audit`, plus the per-account
quota counter rows from phase 9; followed by
`auth.deleteUser` via the Supabase admin client; sign-out
redirect to `/`. Unit test with a seeded session; e2e
covers the redirect-on-success path. RLS already pins
session rows to the owning user; cascade-delete relies on
the existing FK on-delete-cascade chains plus an explicit
sweep of any rows lacking that chain.

### Phase 20 — Framework engine refactor + standalone test harness

Promoted by `/oversight` 2026-05-19 (round 10). Closes the
framework-vs-impl drift before the secretary work lands in
phases 21 + 22.

Two halves:

**(a) Shared schemas.** Move the Zod schemas currently at
`lib/schemas/persona.ts` and `lib/schemas/template.ts` into
`src-ai-skills/schemas/` (new). The framework spec docs
(PERSONA-FORMAT.md, TEMPLATE-FORMAT.md) reference these as
the canonical schemas. Boardroom imports from
`src-ai-skills/schemas/` going forward (one `@/lib/schemas`
re-export alias to avoid churning all the existing imports).
This makes src-ai-skills/ the **single source of truth** for
the framework contract; any future schema change happens
once and propagates.

**(b) Standalone test harness.** Add
`src-ai-skills/__tests__/` with vitest specs that exercise
the framework alone:

- `personas.test.ts` — validate each reference persona under
  `src-ai-skills/personas/` parses against the schema.
- `templates.test.ts` — validate the reference template.
- `orchestrator.test.ts` — run the orchestrator engine
  (extracted as a pure function, no boardroom imports)
  against a stub LLM client that echoes a small fixture
  transcript; assert the SSE event stream matches the
  documented shape (turn.begin / turn.delta / turn.end /
  clarify.prompt / exec-summary / artifact / session.done).
- `secretary-mode.test.ts` — placeholder spec, skipped, to
  light up in phase 21.
- `retros.test.ts` — placeholder spec, skipped, to light up
  in phase 22.

The harness runs under `pnpm test:run src-ai-skills` and is
also included in the verify gate. Drift between the
framework spec and what the engine actually does trips the
gate.

No user-facing change. No new routes, no migrations. Builds
the foundation for 21 and 22 to land cleanly.

### Phase 21 — Secretary persona + Mode 1 (in-session)

Promoted by `/oversight` 2026-05-19 (round 10). The first
half of the secretary contract: in-session structured
logging at phase boundaries.

Scope:

- Extend `PersonaRoleSchema` in `src-ai-skills/schemas/`
  to include `'secretary'` plus the cast-guard `refine`
  (exactly one secretary per session; secretary always has
  `lead: false`).
- Copy `src-ai-skills/personas/secretary.md` to
  `personas/secretary.md` (boardroom runtime location).
- Update the orchestrator at `lib/anthropic/conferring.ts`
  (now consuming `src-ai-skills/schemas`) to:
  - Validate cast on session start; emit
    `session.error code=cast-invalid` if no secretary.
  - Yield to the secretary at each phase boundary
    (after clarify, confer, exec-summary, specialists).
  - Stream the secretary's turn with `author: 'secretary'`.
- Update the `artifact` event to include `secretaryLog`
  (compiled cumulative log).
- UI: render secretary turns in a collapsed/secondary
  panel on `/app` so the conferring transcript stays
  readable.
- E2E (operator-gated, behind Mailosaur): authed session
  walk that fires one full conferring loop, asserts a
  secretary turn at the end of `confer` phase.
- Unit tests in `src-ai-skills/__tests__/secretary-mode.test.ts`
  light up (no longer skipped).

Does NOT yet add Mode 2 or retros.md; that's phase 22.

### Phase 22 — Secretary Mode 2 + cross-session retros

Promoted by `/oversight` 2026-05-19 (round 10). The second
half of the secretary contract: post-session retrospective
+ cross-session learning loop.

Scope:

- Orchestrator: after the `artifact` phase, invoke the
  secretary in Mode 2. Stream the retrospective turn;
  parse the structured output into a `Retro` object.
- New hooks: `loadRetros()` / `appendRetro(entry)`.
  Implementation reads / appends to a project-root
  `retros.md` file via the Node fs API (server-only).
  The file lives at the repository root in dev; in prod
  it lives in a mounted volume or a Supabase Storage
  bucket (operator decides; the hook abstraction lets
  either work).
- Update the template loader to recognize the new
  `retro-review` (first) and `retrospective` (last)
  phases.
- Add the `retro-review` checkpoint UI: a small panel
  shown before clarify on `/app`, listing up to 6 recent
  "for next time" items. User picks zero/one/several,
  each pick gets a 1-sentence response. Picks feed into
  clarify context.
- Emit `retro-review.prompt` and `retrospective.complete`
  SSE events per the spec.
- E2E (operator-gated): authed walk that completes a
  session, verifies a row appended to retros.md, and
  re-runs to verify the next session surfaces it.
- Unit tests in `src-ai-skills/__tests__/retros.test.ts`
  light up.

After phase 22 ships, the framework spec and boardroom
implementation are in sync. Future framework changes get
their own phase pairs (spec edit + impl ship); the
src-ai-skills/__tests__/ harness catches drift if either
side moves alone.

---

## Carry-overs / known gaps (update as phases ship)

- [x] Phase 1 — deploy gate verified end-to-end. Resolved at
      `c37471b` once the operator populated `VERCEL_TOKEN` /
      `VERCEL_PROJECT_ID`; every subsequent phase ship + post-
      build /iterate tick has run `pnpm deploy:check` green
      (60+ consecutive successes). `setup/02_vercel.md` status
      is now `OK`.

## Phase log (commit hashes)

- phase 1 — c37471b — bootstrap (Next.js 15 + Tailwind + Biome +
  Vitest + Playwright; marketing landing + /api/health; verify gate
  green; deploy gate wired but unverified pending .env)
- phase 2 — 626e61c — supabase wired (@supabase/ssr + supabase-js;
  lib/supabase/{env,server,client,diag,database.types}.ts; /diag
  DIAG_ENABLED-gated probe; db/migrations + stub scripts;
  setup/03_supabase.md upgraded STUB → PARTIAL)
- phase 3 — eb5e302 — magic-link auth (/signin server-rendered
  form + sent/error states; /auth/callback code-exchange handler;
  middleware.ts + /app/layout.tsx double-gate /app/*; lib/auth
  helpers + lib/supabase/auth.ts; Header retrofit; 72 unit tests +
  14 e2e green)
- phase 4 — 1db4a2f — persona + template substrate (4 personas in
  personas/ + 1 template; Zod schemas in lib/schemas; cached
  loaders + lib/limits.ts; /about/personas read-only library;
  scripts/validate-data.ts replaces the no-op stub via tsx;
  gray-matter + tsx added)
- phase 5 — 6123320 — boardroom canonical surface (drag-and-drop
  /app with 6-seat oval table, persona shelf, pitch input,
  start-session button gated on a 4-state reducer; @dnd-kit/core
  + utilities; URL-params + sessionStorage persistence; design
  v1 primitives consumed; components/boardroom/ is the canonical
  shape every later authed surface mirrors)
- phase 6 — 38fb53f — anonymous demo loop (/try with product-lead
  pre-staffed; canned 3-turn transcript through TurnBubble +
  ArtifactTile previews with sign-in CTAs; DEMO_PITCH_WORDS=100;
  sessionStorage one-tab cap; PitchInput gained an optional max
  prop; ArtifactTile gained downloadable=false; landing CTA
  retro-fitted to link to /try; no AI calls in this phase)
- phase 7a — 3ff025a — sessions API scaffold + DB schema
  (sessions/turns/artifacts migration with RLS; /api/sessions
  route shell returning session.error code=not-implemented end-
  to-end; shared SSE event types; repo helpers; budget tracker;
  AnthropicConfigError factory; session-side reducer + stream
  hook wired to the Start button; no LLM calls yet)
- phase 7b — 305bb25 — multi-persona conferring loop (Anthropic
  orchestrator replaces the not-implemented return; clarify →
  confer → exec-summary checkpoint → specialists → artifact
  rounds; LiveTranscript + ClarifyPrompt + ExecSummaryCard +
  ArtifactPreviewGrid light up; requires ANTHROPIC_API_KEY)
- phase 8 — 41803c4 — moderation gates (OpenAI omni-moderation
  pre-filter on user input + persona output; halt-and-refuse
  UX; flag_audit table with RLS; documented unset-key
  fall-through path)
- phase 9 — f82f35a — anti-abuse limits (per-account
  10-sessions/day quota derived from sessions table;
  per-IP 3-demo/day via ip_rate_limits service-role table;
  per-session 60k-token cap; graceful-wrap UX with partial
  artifacts on cap-hit)
- phase 10 — 18277f2 — artifact render + download (spec.md,
  exec summary, call-outs rendered as cleanly-typeset preview
  tiles via design/primitives/artifact-tile.tsx; client-side
  download; filenames include session token + ISO date)
- phase 11 — f017ff9 — past-session surface
  (/app/sessions list 10/page most-recent-first;
  /app/sessions/[id] reuses ArtifactPreviewGrid with re-download;
  /app/sessions/[id]/transcript renders LiveTranscript against
  persisted turns rows; all force-dynamic; RLS pins ownership)
- phase 12 — 6f32cb8 — about + legal (/about voice-matched
  "what is this"; /legal/privacy + /legal/terms with locked copy;
  components/legal/legal-section.tsx; landing-CTA retro-fit
  /about/personas → /about; closed standing HIGH critique on
  /legal/* 404 loop)
- phase 13 — 93c57ff — URL-contract smoke walker
  (e2e/url-contract-smoke.spec.ts iterates the bearings URL
  contract; vitest sync test asserts walker ↔ bearings parity;
  desktop-only via testInfo.project.name filter; surfaced 3
  shipped routes that had drifted out of the bearings contract)
- phase 14 — 728595b — a11y + keyboard sweep (skip link;
  fixed double-button bug on DraggablePersonaCard;
  aria-labels on every seat (empty + staffed);
  role="log" + aria-live="polite" on the live transcript;
  oklch-aware WCAG-AA token-contrast vitest; persona-card
  aria-label on non-draggable variants)
- phase 15 — 8f39b59 — performance + meta (metadataBase +
  default openGraph + twitter card; ImageResponse-built
  opengraph-image + favicon + apple-icon; sitemap.ts +
  robots.ts; loading.tsx skeleton blocks on slow
  /app/sessions/* routes; <Skeleton> primitive in
  design/primitives; per-page openGraph overrides on 5 public
  pages)
- phase 16 — 7171206 — observability (split token usage —
  prompt_tokens, completion_tokens, cost_cents columns added
  to sessions via additive migration; estimateCostCents +
  MODEL_RATES for Claude 4.x family; logError JSON-line helper
  for Vercel's log drain; orchestrator returns split usage
  instead of just combined tokens; SessionUsageFooter on both
  authed session pages; operator action: pnpm db:migrate)
- phase 17 — 09e85c2 — polish (voice-matched not-found.tsx
  with H1 "Not found." + dedicated metadata; error.tsx +
  global-error.tsx via shared <ErrorBoundary> composition
  that logs to client-boundary scope; EMPTY_STATE_TEMPLATE_RE
  + audit test covering SessionEmpty + personas empty branch;
  motion-token audit asserts the 3 timings + 3 easings exist;
  e2e for the 404 page)
- phase 18 — e2c10eb — account deletion + data wipe (/app/settings
  + /app/settings/delete-account with confirm-then-delete flow;
  deleteAccountAction calling supabase.auth.admin.deleteUser via
  the service client — FK chain cascades sessions/turns/artifacts
  /flag_audit; LandingDeletedBanner on /?account=deleted; header
  settings link; bearings URL contract + smoke walker both
  updated; closes phase 12's privacy-policy promise structurally;
  promoted by /oversight round 6 after build-plan completion)
- phase 23 — 1a6bcf0 — admin / dev dashboard (env-gated /admin
  route via ADMIN_EMAILS; isAdminEmail + requireAdmin in
  lib/auth/admin.ts; lib/admin/queries.ts with four loaders
  (loadSessionsPerDay, loadTokensPerDay, loadTopCostSessions,
  loadFlagAndErrorRates) reading phase-16 columns + flag_audit;
  three mono primitives in components/admin/; page renders
  five tiles via Promise.all with per-loader em-dash fallback;
  /admin joins AUTHED_ROUTE_PREFIXES + bearings URL contract +
  robots Disallow + url-contract walker; new [operator] AUDIT
  row for ADMIN_EMAILS; closes phase 16 follow-up "per-account
  aggregate dashboard")
- phase 25 — 740d7ad — usage estimator + account usage summary
  (lib/usage/typical-session.ts with hand-pinned TYPICAL_SESSION
  + estimateSessionUsage pure helper; lib/usage/summary.ts with
  getUserUsageSummary single-query 30d window sliced client-side
  into today/7d/30d; <UsageEstimate> mono panel between
  ModelPicker and StartSessionButton on /app, hidden in-flight;
  <AccountUsageSummary> three-row tile above the existing
  Account section on /app/settings; locked disclaimer copy
  referencing MAX_SESSION_TOKENS; stored cost_cents for
  summaries / live MODEL_RATES for estimates; SessionUsageFooter
  unchanged per explicit scope-leak guard; no migration)
- phase 24 — d0ba0f0 — model picker (lib/anthropic/models.ts
  with 3-model allowlist Opus 4.7 default / Sonnet 4.6 /
  Haiku 4.5, MODEL_LABELS + MODEL_BLURBS + resolveModel safe
  fallback; <ModelPicker> client component with native <select>
  and one-line blurb wired into board-client.tsx between
  PitchInput and StartSessionButton; POST /api/sessions
  BodySchema grows by optional model with allowlist fallback
  not 400; create handler stops reading ANTHROPIC_MODEL env at
  session-create time; vitest guard asserts every allowlist
  model has MODEL_RATES + label + blurb; no migration)
