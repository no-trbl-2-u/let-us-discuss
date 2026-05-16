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
- [ ] Phase 6 — Anonymous demo loop (`/try` — capped session,
      sessionStorage only, no DB write; happy-path end-to-end
      with one persona for the smoke test)
- [ ] Phase 7 — Multi-persona conferring loop (lead-ring
      clarifying questions; exec-summary checkpoint;
      specialist round; final-artifact render). The product's
      core gameplay; budget extra care.
- [ ] Phase 8 — Moderation gates (input + output pre-filter
      via OpenAI omni-moderation; halt-and-refuse UX;
      `flag_audit` table)
- [ ] Phase 9 — Anti-abuse limits (per-account session quota,
      per-IP demo limit, per-session token cap, graceful wrap
      UX)
- [ ] Phase 10 — Artifact render + download (spec.md, exec
      summary, call-outs; client-side download; cleanly
      typeset preview tiles)
- [ ] Phase 11 — Past-session surface (`/app/sessions`,
      `/app/sessions/[id]`, `/app/sessions/[id]/transcript`)
- [ ] Phase 12 — About + legal (`/about`, `/legal/privacy`,
      `/legal/terms`)
- [ ] Phase 13 — `/api/health` + smoke-walker integration into
      hermetic e2e

**Cross-cutting (phases 14–17):**
- [ ] Phase 14 — A11y + keyboard sweep (drag-drop has a
      keyboard equivalent; transcript is screen-reader
      navigable)
- [ ] Phase 15 — Performance + meta (RSC streaming smooth,
      Lighthouse meta complete, OG image rendered)
- [ ] Phase 16 — Observability (token-usage + cost-per-session
      surfaced in `/app/sessions/[id]`; basic error logging to
      Vercel's surface)
- [ ] Phase 17 — Polish (404, error boundaries, empty states,
      transitions per `design/decisions.md` motion stops)

> **After phase 17:** the loop transitions to `/iterate` —
> persona-library refinement, template tuning, fresh-eyes
> critique findings, audit-driven repairs. `/march` makes that
> transition automatic.

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

---

## Carry-overs / known gaps (update as phases ship)

- [-] Phase 1 — deploy gate not yet verified end-to-end. `pnpm verify`
      is green; `pnpm deploy:check` is blocked on a populated `.env`
      (VERCEL_TOKEN, VERCEL_PROJECT_ID, DEPLOY_PROVIDER=vercel — per
      `setup/02_vercel.md` + `.env.example`). User will populate
      out-of-band; the next loop tick that runs `deploy:check` will
      confirm green and the phase-close comment (deploy URL) can be
      posted to issue #1 retroactively if desired.

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
