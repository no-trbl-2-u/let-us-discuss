# Bearings — boardroom

> Standing context for every command invocation. Read this
> alongside the relevant skill file (`skills/<name>.md`) and the
> matching phase brief. If anything here changes, update in the
> same commit.

## What we're building

`spec.md` at the repo root is the product spec — the canonical
description of boardroom. Read once at session start. TL;DR:

> A drag-and-drop "board room" simulator that turns a loose
> pitch into a concrete spec by orchestrating a short,
> opinionated conversation between AI personas — so users new
> to multi-agent workflows can get a usable artifact without
> learning prompt engineering first.

Audience: solo builders, indie devs, and early-stage PMs new
to multi-agent AI workflows. The product never asks the user
more than a handful of questions, and each answer fits in one
word or one sentence.

**Project token is `boardroom` in code/config; repo directory
remains `boardroom-breakdown`.**

**Live at:** https://let-us-discuss-ai.vercel.app
(Vercel project is named `let-us-discuss`; the bare
`let-us-discuss.vercel.app` host was already taken so the
production alias is `let-us-discuss-ai.vercel.app`. The repo
is `boardroom-breakdown`. Repo / project name divergence is
historical — preview URLs follow the Vercel name pattern
`let-us-discuss-*-tj-braindump.vercel.app`.)

## Surface

**Surface:** `site`

The product is a web app rendered for humans. Asset capability
is available (`/ship-asset` opt-in if/when needed).

## Auth (for /critique)

**Auth:** `session-cookie`

`reader` (and therefore `/critique`) walks the authenticated
surface with a pre-baked Supabase session cookie in
`SUPABASE_E2E_SESSION_COOKIE`. Works in both Chrome tools and
WebFetch; cloud-loop friendly. See
`../nexus/customization/auth-aware-critique.md`.

## Stack (locked — do not re-litigate)

| Layer | Choice | Why |
|---|---|---|
| Repo | Single Next.js app (no monorepo) | v1 has one deployable; monorepo adds friction we don't need yet. |
| Framework | Next.js 15 (App Router, RSC) | First-class streaming AI responses on Vercel; Server Actions cut API boilerplate; pairs cleanly with Supabase. |
| Language | TypeScript strict | Catches integration bugs across the agent orchestration boundary. |
| Styling | Tailwind CSS | Matches `design/` primitive output; standard for Vercel/shadcn-style work; what the design session will emit unless `design/decisions.md` says otherwise. |
| Content | Markdown/JSON in repo (personas, templates, prompt scaffolds) | Editorial-via-PR for the agent's substrate; the dynamic data lives in Postgres. |
| Structured data | `hybrid-with-managed-postgres` | Repo holds personas + templates; Supabase Postgres holds sessions, transcripts, artifacts, audit. |
| Schemas | Zod (validates on both server-action input and persona/template files at boot) | One schema definition feeds both runtime input and editorial validation. |
| Test (unit) | Vitest | Fast; ESM-native; integrates with Next/Vite easily. |
| Test (e2e) | Playwright | Required for `/critique` reader; hermetic-e2e gate (`customization/hermetic-e2e.md`). |
| Lint + format | Biome | One binary; faster than ESLint+Prettier; less config drift. |
| Pkg mgr | pnpm 9 | Workspace-ready when we outgrow single-app; symlinked node_modules saves disk + install time. |
| Hosting | Vercel (Next.js project) | Edge runtime for streaming; Vercel AI SDK first-class; one-click deploys; preview-per-PR. |
| AI provider | Anthropic (Claude) primary; OpenAI moderation endpoint for the moderation gate | Anthropic for persona reasoning (long context, agentic). OpenAI moderation endpoint is the standard cheap pre-filter. |

## External services

| # | Service | Runbook | Status | Last verified | Dashboard |
|---|---|---|---|---|---|
| 01 | GitHub | `setup/01_github.md` | STUB | 2026-05-16 | https://github.com/no-trbl-2-u/let-us-discuss |
| 02 | Vercel | `setup/02_vercel.md` | STUB | 2026-05-16 | https://vercel.com/dashboard |
| 03 | Supabase (Postgres + Auth + storage) | `setup/03_supabase.md` | STUB | 2026-05-16 | https://supabase.com/dashboard |
| 04 | Anthropic | `setup/04_anthropic.md` | STUB | 2026-05-16 | https://console.anthropic.com |
| 05 | OpenAI (moderation only) | `setup/05_openai.md` | STUB | 2026-05-16 | https://platform.openai.com |

See `../nexus/customization/external-services.md` for the
runbook shape and the loop's introspection contract.

## Auth provider

**Auth provider:** Supabase Auth (magic-link primary).

Same Supabase project fronts Postgres for v1. Email-link sign-in;
no password fields shipped in v1.

## Identity tiers

- **Anonymous:** can-read marketing pages + run **one short
  demo session** (token/turn-capped; `sessionStorage` only; no
  download; no DB write).
- **Authenticated:** run full sessions, persist transcripts +
  artifacts, download `spec.md` / exec summary / call-outs.
- **Account age requirement for write:** none.
- **Email-verification requirement:** required for first
  full-session (magic-link click *is* the verification).
- **Anonymous voting / commenting:** not applicable (no
  voting/comments in v1).

## Anti-abuse posture

- **Vote weighting:** not applicable (no voting in v1).
- **Comment rate-limit:** not applicable.
- **Submission rate-limit:** per-account session quota — N/day;
  N pinned in `config/limits.ts` (initial: 10/day).
- **Per-IP rate-limit on anon demo:** 3 demo sessions / IP / day
  (pinned in config/limits.ts).
- **Per-session token cap:** `MAX_SESSION_TOKENS` (initial:
  60k); session gracefully wraps at cap and emits whatever
  artifacts exist.
- **IP-hash retention:** 30d (Postgres column on `sessions`).
- **CAPTCHA threshold:** never (no CAPTCHA at v1).
- **Account-age gate before write:** none.

## Moderation flow

- **Mod flow:** `ai-pre-filter` (two-sided).
- **Mod queue location:** none in v1 (single-user sessions, no
  public surface). Flag rows go to `flag_audit` table for
  retrospective review.
- **AI pre-filter model:** `openai:omni-moderation-latest` on
  user input *before* fan-out to persona prompts AND on each
  persona output *before* render/persist.
- **`/oversight` escalation thresholds:**
  - Flag spike: 10 flagged rows in any 60-min window.
  - New-account: not applicable (no review queue).
  - Repeat-flag pattern: not applicable.
- **Mod audit log:** `flag_audit` DB table.
- **Mod role membership:** none in v1.

## AI usage map

| Surface | AI's role | Human gate | Model |
|---|---|---|---|
| Persona conferring (in-session) | generated; the product *is* AI-generated dialogue | the user accepts/redirects at the executive-summary checkpoint | Anthropic Claude (model pinned per phase brief) |
| Final spec.md / exec summary / call-outs | generated; the output *is* AI content | the user accepts before download; out-of-scope items flagged | Anthropic Claude |
| Clarifying-question generation (lead-persona ring) | suggest | user answers (1-word/1-sentence) | Anthropic Claude |
| Input + output moderation | filter (verdict in/out) | suspect → session halt, polite refusal | OpenAI omni-moderation-latest |
| User authentication / accounts | none — Supabase Auth | — | — |
| Build loop (`/ship-a-phase`, `/iterate`, etc.) | generated under nexus | nexus's own audit + deploy gates | the agent running this repo |

Every surface flagged "generated" is held to the
`source: ai-generated` rigor in
`../nexus/customization/data-layer.md` § Provenance.

## URL contract (locked)

The v1 URL set:

```
/                        Marketing landing surface; explains the boardroom metaphor and links to /try.
/try                     Anonymous demo session entry (sessionStorage only).
/signin                  Magic-link form (Supabase Auth).
/auth/callback           Supabase magic-link callback.
/app                     Authenticated boardroom session (drag-drop, persona library, active conversation).
/app/sessions            List of the signed-in user's past sessions.
/app/sessions/[id]       A specific past session's results page (read + re-download).
/app/sessions/[id]/transcript   Full transcript view for a past session.
/about                   What boardroom is and isn't; tone-setter for the persona; links to nexus.
/about/personas          Read-only library of the curated v1 personas.
/legal/privacy           Privacy + retention.
/legal/terms             Terms of use.
/api/health              Cheap "is the app alive" probe for the deploy gate.
/api/sessions            Server-action surface for the active session (POST: create; streaming responses).
/api/sessions/[id]/answer  POST: answers from the user at a clarify/checkpoint moment.
/api/demo/begin          POST: starts the canned anonymous demo session (no AI calls).
```

These are permanent. New URLs come from new phases; existing
shapes don't change.

## Repository shape

```
boardroom-breakdown/
├── spec.md
├── README.md                            (added in phase 1)
├── agents.md
├── package.json                          (added in phase 1)
├── next.config.mjs / tsconfig.json       (added in phase 1)
├── claude-design.prompt.md               (paste-into-fresh design session)
├── NEXUS_LESSONS.md                      (field notes for /lessons-pr)
├── .claude/
│   ├── commands/<verb>.md
│   └── agents/<name>.md
├── skills/
│   ├── ship-a-phase.md
│   └── ...
├── plan/
│   ├── README.md
│   ├── bearings.md                       (this file)
│   ├── AUDIT.md
│   ├── CRITIQUE.md
│   ├── PHASE_CANDIDATES.md
│   ├── steps/01_build_plan.md
│   └── phases/phase_<N>_<topic>.md
├── setup/
│   ├── 00_files.md
│   └── NN_<service>.md
├── scripts/
│   └── deploy-check.mjs
├── design/                                (lands when the design session commits)
└── app/, lib/, components/, etc.          (added by phases)
```

## The `design/` folder

**Design v1 has landed (2026-05-16).** The authoritative system
lives at:

- `design/INDEX.md` — one-page tour; the build agent's first stop.
- `design/decisions.md` — the brief. **Wins over this file on
  visual conflict.** Mood, token rationale, won't-do list.
- `design/tokens.css` — color, type, spacing, radius, shadow,
  motion tokens. Tailwind config extends from these.
- `design/primitives/` — production components consumed via
  `@/design/primitives/<name>`. Ten primitives total; the four
  metaphor-carrying ones (`persona-card`, `boardroom-table`,
  `turn-bubble`, `artifact-tile`) light up as phase 5+ ships.
- `design/compositions/` — reference compositions; the live
  routes implement the same shape against the data layer.
  Excluded from typecheck (reference only).

Visual defaults below are superseded by `design/decisions.md`
where they conflict (oxidized-red accent over a hedged
red/blue; serif headings over sans; custom 7-stop spacing
ramp over Tailwind defaults).

## Sub-agents

Defined under `.claude/agents/`. Spawn aggressively.

| Agent | When to spawn | Returns |
|---|---|---|
| `scout` | External fact, Next.js / Supabase / Anthropic API docs, model IDs, version pins | Structured findings with citations |
| `reader` | Fresh-eyes critique of the live site | JSON findings array |
| `persona-steward` | Validate or refine a persona definition file under `personas/` | Diff against existing persona + rationale |

## Visual & tonal defaults

**Authoritative source: [`design/decisions.md`](../design/decisions.md).**
The notes below summarize; the design file is the canonical brief.

- **Mode:** light default; respect `prefers-color-scheme: dark`.
- **Type families:** Source Serif 4 for body + headings (editorial
  gravitas), IBM Plex Sans for UI labels + eyebrows + nav, IBM
  Plex Mono for token counts, kind labels, timestamps.
- **Palette / accent:** warm cream paper, warm near-black ink,
  **single oxidized-red accent** (fountain-pen / library-stamp
  register; oklch ~48% / 32°). Deep slate `--accent-2` reserved
  for <5% of surfaces (moderator turn-bubble, active-session
  rail). No gradients, no glass/backdrop-blur.
- **Spacing:** custom 7-stop ramp in `design/tokens.css`
  (4 / 8 / 12 / 16 / 24 / 36 / 56 / 88px). Tailwind config
  `extend.spacing` reads from those tokens.
- **Voice (product surface, not personas):** *Knowledgeable
  colleague who's been-there. Plainspoken, terse, no marketing
  fluff. Explains its reasoning when it makes a judgment call.*
  Personas each layer their own voice on top.

## Plan expansion posture

- **Mode: bold** (default) — `/expand` files candidates to
  `plan/PHASE_CANDIDATES.md`; `/oversight` promotes.

## Decisions standing for the autonomous loop

- **Pagination:** none in v1 (a user's session list is short by
  definition).
- **Sort default:** sessions list — most recent first by
  `createdAt`.
- **Empty state copy template:** *"No <thing> yet — <next
  action>."* Plain, no marketing.
- **Loading state:** skeleton blocks via a `<Skeleton>`
  primitive; no spinners. For agent streaming, show typed text
  as it arrives plus a "<persona> is thinking…" affordance.
- **Error state:** mono text, single-line + retry button.
  Never silently retry an LLM call without telling the user.
- **Top-N count for any list:** 10.
- **Comments / community / login:** out of scope every phase
  except the auth phase (Supabase magic-link); no public
  sharing in v1.
- **Persona library** is curated in v1. User-created personas
  are out of v1.
- **Discussion templates:** v1 ships exactly one ("pitch →
  spec"). Multi-template UI is out of v1.
- **Output types:** v1 ships exactly three artifacts (spec,
  exec summary, call-outs). Other output types (chapter
  outlines, presentations) are out of v1.
- **Token / turn budgets are pinned in `config/limits.ts`;**
  any time the loop wants to change a budget mid-build, it
  edits that file and audits via `/oversight`.

## Hard rules

(Mirrors `agents.md` Standing Rules. Update there first; this
echoes.)

1. **Commit and push as a single atomic act.**
2. **No `Co-Authored-By:` trailers, no emojis.**
3. **No `--no-verify`, no force-push, no destructive resets.**
4. **The verify gate is non-negotiable** — see "Verify gate"
   below.
5. **Tests alongside code.**
6. **Small focused components in folders.**
7. **Content stays in `personas/` and `templates/` (markdown +
   JSON). Dynamic data stays in Postgres. No hardcoded copy in
   components; no hardcoded persona/template data in code.**
8. **Never commit secrets.** `.env` is gitignored; `.env.example`
   documents every key.
9. **No more than 5 questions to the user at any checkpoint.**
   Every checkpoint accepts 1-word/1-sentence answers only.
   (Product-level rule — the agents do the thinking.)
10. **Every persona / template change is a PR.** No
    in-product persona authoring in v1.
11. **No emoji in chrome.** Persona identity is typographic
    + iconographic, not photographic / emoji-based.

## Verify gate (hermetic, mandatory) + deploy gate

Every shipping skill runs two gates around a commit.

### Pre-commit: `pnpm verify`

```
pnpm typecheck         # tsc --noEmit
pnpm test:run          # vitest run
pnpm data:validate     # zod-schema validation of personas/ + templates/
pnpm build             # next build
pnpm e2e               # playwright against the built app on alt port
```

Each leg is a hard gate. **Hermetic e2e** is critical — it
catches "tests pass but built site is broken." Phase 1 stands
the gate up; phase 4 (auth + DB plumbing) lights up the data
+ e2e legs. See
`../nexus/customization/verify-gate.md` and
`../nexus/customization/hermetic-e2e.md`.

### Post-push: `pnpm deploy:check`

After `git push origin main`:

```
pnpm deploy:check
```

Polls Vercel for the deploy at HEAD. Exits 0 ready, 1 error,
2 timeout, 3 config/auth. Implementation:
`scripts/deploy-check.mjs`, Vercel block enabled.

**Red deploy = blocked tick.** Read log, patch root cause,
push again. Up to 3 same-root-cause iterations; otherwise stop
per the skill's failure modes.

## Operational notes

- **Auto-deploys:** every push to `main` deploys via Vercel.
  Previews on PRs.
- **A red `main` = a red site.**
- **Operational secrets in `.env`** (gitignored). See
  `agents.md` "Operational secrets" section and `.env.example`.

## Useful commands

```bash
pnpm dev               # next dev
pnpm verify            # the full gate
pnpm deploy:check      # post-push deploy gate
```
