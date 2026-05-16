# Phase 1 — Bootstrap

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body. This is the first phase — there is no shipped sibling
> to copy from.

## Scope

Stand up the substrate: Next.js 15 App Router + TypeScript
strict + Tailwind + Biome + Vitest + Playwright. Single
marketing-shaped landing at `/`. Verify gate green end-to-end
(typecheck, unit, build, e2e — `data:validate` is a no-op
script that exits 0 until phase 4 wires it). Deploy gate
functional against Vercel. Auto-deploys hit a green `/` and a
green `/api/health`.

This phase does NOT ship:
- Any Supabase wiring (phase 2).
- Any auth (phase 3).
- Any personas or templates (phase 4).
- The boardroom UI itself (phase 5).

The landing page may state the pitch and link a deliberately
disabled "Try it" button (the demo path lands in phase 6). The
goal is shape, not content depth.

## Outputs

```
package.json
pnpm-lock.yaml
tsconfig.json
next.config.mjs
biome.json
postcss.config.mjs
tailwind.config.ts
vitest.config.ts
playwright.config.ts
.gitignore
.env.example                            (already exists; verify keys match phase 1 reality)
README.md                               (one paragraph; link spec.md, agents.md, plan/)
app/layout.tsx
app/page.tsx                            ("/" — marketing landing)
app/globals.css
app/api/health/route.ts                 (GET — { ok: true, ts })
components/site/header.tsx
components/site/footer.tsx
components/site/landing-hero.tsx
lib/cn.ts                               (tailwind-merge + clsx helper)
__tests__/                              (sample unit tests for lib/cn.ts and landing-hero)
e2e/landing.spec.ts                     (playwright: visits "/", asserts H1 + no console errors)
e2e/playwright.global-setup.ts          (builds + serves on alt port 4011)
scripts/validate-data.mjs               (no-op exit 0; phase 4 replaces)
```

## Stack pins (versions)

Pin to the latest stable at ship time. If a version below has
moved on, take the newer stable and document in commit-body
Decisions. Floor versions:

- `next` ^15
- `react` ^19
- `typescript` ^5.7
- `tailwindcss` ^3.4
- `@biomejs/biome` ^1.9
- `vitest` ^2
- `playwright` ^1.49
- `@playwright/test` ^1.49
- `tailwind-merge`, `clsx`

`pnpm` 9 is the package manager; `engines` in package.json
pins `node` >=20.

## Configuration calls — DO NOT ASK

- **Next.js mode:** App Router; React Server Components
  default. No `pages/` directory.
- **TypeScript:** `strict: true`, `noUncheckedIndexedAccess:
  true`, `verbatimModuleSyntax: true`, `module: "esnext"`,
  `target: "es2022"`.
- **Tailwind:** v3 (not v4 alpha) until v4 stable + the design
  session ships against v4 (revisit at design-landing time).
- **Biome:** lint + format; no ESLint, no Prettier. Recommended
  preset; enable `useImportType`.
- **Lockfile:** commit `pnpm-lock.yaml`. Do not regenerate in
  CI.
- **Vercel project name:** `boardroom-breakdown` (matches
  repo). Production domain stays Vercel-managed until the user
  attaches a custom domain.
- **README content:** one paragraph + four links (spec.md,
  plan/bearings.md, agents.md, nexus README). No badges yet.

## Verify gate

```bash
pnpm typecheck && pnpm test:run && pnpm data:validate && pnpm build && pnpm e2e
# composed as: pnpm verify
```

Must pass before commit.

## Deploy gate

After `git push origin main`, `pnpm deploy:check` may fail the
first time. If red:
1. Read the deploy log via the Vercel CLI or dashboard.
2. Likely root cause: missing env (none expected for phase 1),
   wrong build command, or wrong root directory. Patch
   `vercel.json` or project settings.
3. Push again. Up to 3 same-root-cause iterations; otherwise
   stop per the skill failure-mode rules.

`vercel.json` for phase 1: `{ "framework": "nextjs" }` is
enough; the rest is auto-detected.

## Tests

### Unit (vitest)

- `__tests__/cn.test.ts` — verifies `lib/cn.ts` merges
  conflicting Tailwind utilities deterministically.
- `__tests__/landing-hero.test.tsx` — renders `<LandingHero />`;
  asserts the pitch text appears; asserts the "Try it" CTA is
  present and `aria-disabled`.

### E2E (playwright, hermetic against alt port)

- `e2e/landing.spec.ts` — visits `/`, asserts H1 text matches
  the pitch's first sentence, asserts no console errors,
  asserts viewport 375px has `scrollWidth - innerWidth <= 1`.
- `e2e/health.spec.ts` — visits `/api/health`, asserts `200` +
  `{ ok: true }`.

`playwright.config.ts` builds the app via `pnpm build` and
serves via `pnpm next start --port 4011` in `globalSetup`.
Base URL is `http://localhost:4011`. **Do not run e2e against
`pnpm dev`** — hermetic-e2e foot-gun.

## Decisions made upfront — DO NOT ASK

- App Router, RSC default. No `pages/`.
- TypeScript strict + `noUncheckedIndexedAccess`.
- Tailwind v3 (not v4 alpha).
- Biome (one binary; replaces ESLint + Prettier).
- No design tokens shipped yet — Tailwind defaults plus a
  small palette in `app/globals.css` (`--paper`, `--ink`,
  `--accent`). The design session replaces this when it ships.
- No favicon yet — phase 15 adds it. A placeholder
  `app/icon.png` (single-color tile in paper/ink) is acceptable
  but not required.
- No analytics, no error tracking. Vercel's deploy logs are
  the only observability surface until phase 16.
- No internationalization. v1 is English only.
- `data:validate` is a no-op script in this phase
  (`scripts/validate-data.mjs`: prints `ok`, exits 0). Phase 4
  replaces it.
- The "Try it" CTA on the landing is `aria-disabled` with a
  tooltip "Coming in v1 — sign up to be notified." Honest
  about the state.
- Marketing copy reads in the voice baseline: "Knowledgeable
  colleague who's been-there. Plainspoken, terse, no marketing
  fluff."

A brief that leaves Open Qs is a brief that fails its job.

## Mobile reflow / responsive considerations

- Landing has a single column at 375px; two columns at md
  (header + landing-hero side-by-side on desktop).
- Header links collapse into a single text-link nav at small
  viewports (no hamburger yet — at most 3 links).
- No font-loading flash on slow networks — use `next/font`
  with `display: 'swap'` for the working-default sans + serif.

## Git

This repo already has commits. Phase 1 ships as a new commit
on `main`:

```bash
git add <explicit files>
git commit -m "$(cat <<'EOF'
feat: bootstrap boardroom — phase 1

- Next.js 15 App Router + TypeScript strict
- Tailwind CSS v3 + Biome
- Vitest unit + Playwright hermetic e2e (alt port 4011)
- Marketing landing at /; /api/health route
- pnpm verify green; pnpm deploy:check wired to Vercel

Decisions:
- App Router + RSC default (no pages/)
- Biome replaces ESLint + Prettier
- Tailwind v3 (defer v4 until stable + design landing)
- No favicon yet; placeholder app/icon.png
- 'Try it' CTA is aria-disabled until phase 6 ships /try
EOF
)"
git push origin main
```

## DoD

Flip Phase 1's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash, add to
"Phase log". Commit:

```bash
git add plan/steps/01_build_plan.md
git commit -m "plan: phase 1 shipped — bootstrap"
git push origin main
```

## Confirm deploy

```bash
pnpm deploy:check
```

Iterate to green per the skill failure-mode rules.

## Follow-ups (out of scope this phase)

- Supabase wiring (phase 2).
- Magic-link auth (phase 3).
- Persona + template substrate (phase 4).
- Drag-and-drop board (phase 5).
- Demo session (phase 6).
- Real favicon, OG image, full meta sweep (phase 15).
- Token-usage observability (phase 16).
