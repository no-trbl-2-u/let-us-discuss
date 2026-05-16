# Phase 4 — Persona + template substrate

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body. This phase plants the content layer the gameplay
> reads from. Personas are gameplay primitives; the v1 set is
> small and curated.

## Outcome

A `personas/` directory holds the v1 persona library as markdown
files with Zod-validated frontmatter + system-prompt body. A
single `templates/pitch-to-spec.json` defines the v1 session
template. `pnpm data:validate` now actually validates every file
and fails on the first invalid one. A read-only library at
`/about/personas` lets the user preview personas before staffing
a session — and lets the team review changes via PR.

## Routes / endpoints (locked in `bearings.md`)

- `/about/personas` — **new.** Public, server-rendered. Lists
  every persona with name, role, voice, lead/specialist tag,
  and a short summary. Each persona has a direct anchor
  (`#<slug>`) for linking.
- `/about` — referenced but not shipped this phase (phase 12
  ships the full about page). A redirect from `/about` →
  `/about/personas` would muddy phase 12; **decision:**
  `/about` stays unrouted in phase 4. The persona library
  lives under `/about/personas` per the URL contract.

## Content / data reads

| Helper | Lookup | Use |
|---|---|---|
| `loadPersonas()` | `lib/personas/load.ts` | Read all `personas/*.md`, parse frontmatter + body, validate via Zod, return sorted by `role` then `name`. Cached per-process (Next.js `react.cache`). |
| `loadPersona(slug)` | `lib/personas/load.ts` | Single-persona variant; throws if slug not found. |
| `loadTemplate(slug)` | `lib/templates/load.ts` | Read `templates/<slug>.json`, parse + validate. Throws on missing or invalid. |
| `loadDefaultTemplate()` | `lib/templates/load.ts` | Loads the single v1 template (`pitch-to-spec`). Convenience wrapper. |
| `PersonaSchema` | `lib/schemas/persona.ts` | Zod schema; the source of truth for persona shape. |
| `TemplateSchema` | `lib/schemas/template.ts` | Zod schema; the source of truth for template shape. |

No new Supabase reads — personas + templates are repo-resident.

## Components / handlers

- `app/about/personas/page.tsx` — server component. Calls
  `loadPersonas()`; renders a stack of `<PersonaCard />`s.
- `components/personas/persona-card.tsx` — server component;
  takes a `Persona` prop; renders name, role tag, voice line,
  summary, and (collapsed by default) system-prompt preview
  via `<details>`.
- `components/personas/persona-role-tag.tsx` — small atom:
  `lead` shows accent color; `specialist` shows muted ink.
- `lib/schemas/persona.ts` — Zod schema + inferred `Persona`
  type.
- `lib/schemas/template.ts` — Zod schema + inferred `Template`
  type.
- `lib/personas/load.ts` — file-system + frontmatter parser
  (`gray-matter`). `react.cache`-wrapped.
- `lib/templates/load.ts` — file-system + JSON parser.
  `react.cache`-wrapped.
- `lib/content/paths.ts` — pure helper exposing `PERSONAS_DIR`
  and `TEMPLATES_DIR` (resolved from `process.cwd()`). Single
  module so tests can stub or replace.
- `scripts/validate-data.ts` — **replaces** the v0
  `scripts/validate-data.mjs`. Walks personas + templates,
  validates against the Zod schemas, fails on the first
  invalid file with a precise error. Runs via `tsx`.
- `lib/limits.ts` — **new, small.** `MAX_PERSONAS_SEATED = 6`,
  `MIN_PERSONAS_SEATED = 2`, `MAX_PITCH_WORDS = 600`. Phase 5
  consumes these constants; phase 9 consolidates limits.

## Cross-links

**In** (already shipped — verify still wired):
- Phase 1's verify gate runs the now-real `data:validate`
  leg. Removing the no-op script does not break the gate.
- Phase 3's `Header` already links `/`, `/signin` — no
  retro-fit needed for `/about/personas` (phase 12's about
  page will surface it).

**Out** (this phase ships these):
- `loadPersonas()` is the hook phase 5's `/app` boardroom
  consumes for the persona shelf.
- `loadDefaultTemplate()` is the hook phase 7 reads to drive
  the session phase machine.
- `lib/limits.ts` is the hook phase 5's start-button uses for
  min/max-personas gating; phase 7 uses `MAX_PITCH_WORDS` for
  server-side validation.

**Retro-fit** (none): no shipped surface today consumes
personas or templates.

## SEO / metadata / output schema

`/about/personas`:
- `<title>Personas — boardroom</title>`
- `<meta name="description" content="The v1 persona library — who comes to the boardroom table.">`
- `<meta name="robots" content="index, follow">` (this is a
  content page, indexable).
- JSON-LD `ItemList` of personas (each as `Thing` with
  `name` + `description`).

## Hero / body / sub-section composition

```
<section>
  <h1>Personas</h1>
  <p>Curated v1 library. User-created personas land post-v1.</p>
  <ul role="list">
    {personas.map(p => (
      <PersonaCard key={p.slug} persona={p} />
    ))}
  </ul>
</section>
```

`<PersonaCard>`:
- `<h2 id={persona.slug}>` — name
- `<PersonaRoleTag>` — `lead` or `specialist`
- `<p>` — voice line
- `<p>` — summary
- `<details><summary>System prompt</summary><pre>` — full body

## Empty / loading / error states

- **Empty** (zero personas): renders `<p>"No personas yet — the v1
  library ships in phase 4."</p>`. Never reached in practice once
  phase 4 lands, but the loader returns `[]` instead of throwing
  so a misconfigured environment surfaces cleanly.
- **Loading**: none — fully server-rendered.
- **Error** (a persona file invalid at request time): the
  loader **throws**; the route segment falls to Next.js's
  default error boundary. `data:validate` catches this at
  CI time so production never sees it.

## Decisions made upfront — DO NOT ASK

- **v1 persona set (4 personas):**
  - `product-lead` — lead; drives clarity on what the user
    actually needs vs. wants.
  - `skeptical-engineer` — lead; pushes hard on feasibility,
    cost, latency, edge cases.
  - `growth-voice` — specialist; channels the marketer / GTM
    angle without marketing fluff.
  - `end-user-proxy` — specialist; speaks for someone who
    didn't read the spec.
  Each is a lead-or-specialist. The session template's
  lead-ring round only fires lead personas.
- **Persona file shape:** markdown with YAML frontmatter
  (`gray-matter`-parseable). Keys: `slug`, `name`, `role`,
  `voice`, `lead` (bool), `tools` (string[]; `[]` in v1),
  `summary` (≤ 200 chars), and the body is the system
  prompt. Schema is `lib/schemas/persona.ts`.
- **System-prompt length:** soft target 200–500 words per
  persona. Long enough to anchor identity; short enough to
  stay legible.
- **Template file shape:** single JSON file
  `templates/pitch-to-spec.json`. Keys: `slug`, `name`,
  `description`, `phases` (ordered array of phase objects with
  `id`, `name`, `description`, and per-phase config like
  `lead_round_max_questions` or `turn_budget`), and an
  `escalation` block (`exec_summary_checkpoint: true`,
  `convergence_min_agreement: 0.7`). Schema is
  `lib/schemas/template.ts`.
- **Parser:** `gray-matter` for frontmatter; `JSON.parse` for
  the template. No custom parsers.
- **Loaders are cached** per request via `react.cache` so
  multiple components can call without re-reading the
  filesystem.
- **`data:validate` runner:** TypeScript file executed via
  `tsx`; this lets the script import the same Zod schemas
  the runtime uses. Add `tsx` as a dev dependency.
- **Skip on missing file in loader:** loaders return an empty
  array (personas) or throw with a precise message
  (templates), and `data:validate` catches that explicitly.
- **No persona authoring UI.** v1 ships curated personas
  edited via PR. The `/about/personas` page is read-only.
- **`lib/limits.ts` lives at lib root** rather than under
  `config/`. Phase 9 may refactor to `config/limits.ts` when
  it consolidates limits; for phase 4 the file is one place
  with three constants.
- **Voice baseline applies to every persona body**: plainspoken,
  terse, no marketing fluff. Personas layer their own voice on
  top (skeptical engineer is more pointed, growth voice is
  scrappier, etc.) without breaking the baseline.
- **Validator output format:** on failure, one-line summary +
  the Zod issue tree printed with file path. Exit 1.
- **Persona ordering on `/about/personas`:** leads first
  (alphabetical), then specialists (alphabetical). Deterministic.

A brief that leaves Open Qs is a brief that fails its job.

## Mobile reflow / responsive

`/about/personas`: single column at all viewports.
`<PersonaCard>` stacks name + tag + body vertically; the
system-prompt `<details>` block becomes the natural overflow
container. No horizontal scroll at 375px.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/schemas/persona.ts` | accepts a known-good fixture; rejects missing keys, wrong types, summary too long, invalid role | — |
| `lib/schemas/template.ts` | accepts the v1 fixture; rejects missing `phases`, unknown phase id, out-of-range agreement | — |
| `lib/personas/load.ts` | reads all four v1 files; returns leads-first ordering; throws with file path on schema mismatch (using a tmp dir + a deliberately broken fixture) | — |
| `lib/templates/load.ts` | loads the v1 template; throws on missing slug | — |
| `scripts/validate-data.ts` | exits 0 on the real repo content; exits 1 with a precise message when a fixture file is invalid | (covered indirectly by the gate running `data:validate`) |
| `app/about/personas/page.tsx` | renders all four persona names + role tags + summaries; the system-prompt details block is collapsed by default | `/about/personas` H1 visible; 4 persona names rendered; no console errors; 375px reflow |
| `components/personas/persona-card.tsx` | a `<details>` is closed initially; aria attributes correct | — |
| `lib/limits.ts` | constants exported with the documented values | — |

## Verify gate

```bash
pnpm verify
```

`data:validate` is now real and catches schema regressions
before they reach `next build`.

## Commit body template

```
feat: persona + template substrate — phase 4

- personas/{product-lead,skeptical-engineer,growth-voice,
  end-user-proxy}.md — v1 persona library
- templates/pitch-to-spec.json — v1 session template
- lib/schemas/{persona,template}.ts — Zod schemas (source of
  truth)
- lib/personas/load.ts + lib/templates/load.ts — cached
  filesystem loaders consumed by phase 5+
- lib/limits.ts — MAX/MIN_PERSONAS_SEATED, MAX_PITCH_WORDS
- /about/personas read-only library with anchored persona
  cards + collapsible system-prompt preview
- scripts/validate-data.ts (tsx) — replaces the no-op stub;
  exits non-zero on the first invalid file

Decisions:
- 4 personas in v1: 2 leads + 2 specialists per spec.md
- gray-matter parser + Zod validation
- loaders cached via react.cache; not exported as singletons
- /about/personas is indexable (content page); /about itself
  is left unrouted until phase 12 ships the full about page
```

## DoD

Flip Phase 4's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash, add to
"Phase log".

## Confirm deploy

```bash
pnpm deploy:check
```

## Follow-ups (out of scope this phase)

- Persona-editing UI (out of v1).
- Multi-template UI (out of v1; one template ships).
- Phase 5: `/app` consumes `loadPersonas()` + `lib/limits.ts`.
- Phase 7: `loadDefaultTemplate()` drives the conferring loop.
- Phase 12: the broader `/about` page lands and links here.
- `persona-steward` agent can run on individual persona files
  once they exist; the loop can spawn it during `/iterate`.
