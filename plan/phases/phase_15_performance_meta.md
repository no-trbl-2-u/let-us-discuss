# Phase 15 — Performance + meta

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

The product is correctly indexable + shareable + measurably
fast.

1. **Lighthouse meta is complete.** Root layout declares
   `metadataBase`, default `openGraph`, default `twitter`
   card. Every per-page `Metadata` export inherits these
   defaults so individual pages don't need to repeat the
   social block. A `favicon.ico` (via `app/icon.tsx`) +
   `apple-icon.tsx` round out the device coverage.
2. **One static OG image.** `app/opengraph-image.tsx`
   renders the boardroom metaphor at 1200×630 via Next.js
   `ImageResponse` — typographic only (per
   `design/decisions.md` § Won't do: no avatars, no
   gradients). Hardware fonts; cached at build.
3. **`sitemap.ts` + `robots.ts`.** Standard Next.js
   conventions; sitemap enumerates the public URLs from the
   bearings contract; `/app/*` and `/api/*` are excluded.
4. **RSC streaming has a `loading.tsx` per slow surface.**
   The authed `/app/sessions/[id]` and
   `/app/sessions/[id]/transcript` routes get skeleton
   blocks so the user sees structure before the DB read
   resolves. The standing decisions doc already specifies
   `<Skeleton>` blocks via a primitive — this phase ships
   that primitive (lightweight; one file).

## Prerequisite

Phases 1–14 shipped. Every public page already has its own
per-page `metadata.title`; the root layout has fonts wired.

## Dependencies (operator action required for runtime)

None. `ImageResponse` is built into Next.js 15; system fonts
work in the OG renderer. No `NEXT_PUBLIC_SITE_URL` change
needed beyond what already exists.

## Routes / endpoints (locked from bearings)

No URL contract additions. New file-system route handlers
that Next.js auto-discovers under `app/`:

- `app/opengraph-image.tsx` — single static OG, served at
  `/opengraph-image` (Next picks the path).
- `app/icon.tsx` — favicon (.ico equivalent), served at
  `/icon`.
- `app/apple-icon.tsx` — apple-touch icon, served at
  `/apple-icon`.
- `app/sitemap.ts` — served at `/sitemap.xml`.
- `app/robots.ts` — served at `/robots.txt`.
- `app/app/sessions/[id]/loading.tsx`
- `app/app/sessions/[id]/transcript/loading.tsx`

These are framework-auto-resolved paths, not contract URLs —
they don't need bearings entries.

## Library / helpers (new code)

- `lib/site/origin.ts` — `getSiteOrigin()` reads
  `NEXT_PUBLIC_SITE_URL` (already in env per
  `playwright.config.ts`), falls back to
  `https://let-us-discuss-ai.vercel.app` (the prod
  canonical alias per bearings). Used by `metadataBase` +
  `sitemap.ts` + `robots.ts`.
- `lib/site/__tests__/origin.test.ts` — env-presence and
  fallback paths.
- `lib/site/public-urls.ts` — the list of indexable URLs
  (every public page from bearings minus the API routes
  and `/auth/callback`). Used by `sitemap.ts`.
- `lib/site/__tests__/public-urls.test.ts` — sanity-check
  the list covers each public bearings entry.

## Components / handlers (new files)

- `design/primitives/skeleton.tsx` — a one-prop
  `<Skeleton className?>` block: paper-sunken background +
  reduced-motion-safe shimmer (CSS animation that respects
  `prefers-reduced-motion`). Used by the loading.tsx files.
- `design/primitives/__tests__/skeleton.test.tsx` — renders;
  passes through className; matches the documented data
  attribute.
- `components/sessions/session-loading.tsx` — composes
  three `<Skeleton>` tiles + a header skeleton. Shape
  matches `ArtifactPreviewGrid` so the layout doesn't
  shift when the real data swaps in.
- `components/sessions/transcript-loading.tsx` — composes
  three skeleton `TurnBubble`-shaped blocks (gutter + body
  rows).
- Tests for both.

## Cross-links

**In (verify):**

- The existing `header.tsx` + `footer.tsx` keep their links.
- Existing per-page metadata exports keep working; they
  inherit the new defaults.

**Out (ship):**

- `sitemap.xml` and `robots.txt` reference the canonical
  origin. Search engines follow.

**Retro-fit:**

- Each existing per-page `metadata` export gains an
  `openGraph: { title, description }` override where the
  page title differs from the root default — this lets a
  share of `/about` render "About boardroom" as the OG
  title, not the landing's default. Light retro-fit: ~7
  page files, one block each.

## SEO / metadata

Root `app/layout.tsx` metadata gains:

```ts
metadataBase: new URL(getSiteOrigin()),
openGraph: {
  type: 'website',
  siteName: 'boardroom',
  // images come from app/opengraph-image.tsx auto-discovery
},
twitter: {
  card: 'summary_large_image',
},
robots: { index: true, follow: true },
```

Per-page exports add `openGraph: { title, description }`
where page-specific copy differs from the root default.

## Hero / body / sub-section composition

The OG image is the canonical hero of this phase. Locked
composition:

- 1200×630 viewport.
- Background: `--paper` cream (oklch 96.5% 0.012 82).
- Top-left: small monospace eyebrow `BOARDROOM` in
  `--ink-muted`.
- Center: serif headline (the landing's `HERO_HEADLINE`
  exported from `landing-hero.tsx`) wrapped to ~22 chars
  per line, color `--ink-strong`.
- Bottom-left: single oxidized-red `--accent` square
  (32×32) — the system's "stamp" mark.
- Bottom-right: monospace metadata
  `let-us-discuss-ai.vercel.app` in `--ink-muted`.

The image is typographic-only and SR-irrelevant (decorative).
The `alt` is the headline text.

## Empty / loading / error states

- `loading.tsx` files render the skeleton compositions
  above. No spinners (per bearings decision: skeleton
  blocks).
- No new error states.

## Decisions made upfront — DO NOT ASK

- **Origin fallback is `https://let-us-discuss-ai.vercel.app`.**
  Pinned in bearings as the production alias. If a custom
  domain lands later, set `NEXT_PUBLIC_SITE_URL`; nothing
  else changes.
- **OG image is built via `ImageResponse`**, not a static
  PNG. Reason: `ImageResponse` is built into Next.js, takes
  no extra deps, lets the headline track future copy
  edits, and renders crisply on every device. The "static"
  in the brief's "one static OG image" means "one
  composition, not per-page renders" — the renderer
  itself can be programmatic.
- **No avatar / persona iconography in the OG image.**
  Per `design/decisions.md` § Won't do (rule 3). The
  monogram-and-headline composition expresses the metaphor
  via type alone.
- **Favicon is via `app/icon.tsx` (ImageResponse), not a
  static `favicon.ico`.** Same reason as OG. The icon is a
  tiny accent-red square with a serif "b" — terse, on-brand,
  no separate asset.
- **`apple-icon.tsx` renders at 180×180** (the canonical
  apple-touch-icon size); same composition as the favicon
  scaled up.
- **Sitemap covers public pages only.** `/app/*`, `/api/*`,
  and `/auth/callback` are excluded. `/about`,
  `/about/personas`, `/legal/privacy`, `/legal/terms`,
  `/try`, `/signin`, and `/` are included.
- **Robots: allow all crawlers for public pages, disallow
  `/app/`, `/api/`, `/auth/callback`, `/diag`.** The diag
  page is dev-only but the path exists in app/, so being
  explicit is cheap insurance.
- **Skeleton primitive lives in `design/primitives/`** because
  bearings already names it as a primitive ("Loading state:
  skeleton blocks via a `<Skeleton>` primitive"). One file
  in design/primitives + colocated test. Tailwind utilities
  only — no new CSS file.
- **Skeleton shimmer respects `prefers-reduced-motion`.**
  When the user opts out, the skeleton stays in its rest
  state (paper-sunken tint) — no animation. Implemented as
  a CSS media query in tokens.css's existing motion block
  if needed, or as a one-line Tailwind class composition
  inline (no extra config).
- **No Lighthouse runner in CI this phase.** Adding
  Lighthouse to the verify gate is a meaningful dev-dep
  expansion + flake risk; this phase ships the metadata
  correctness, not the audit automation. If the operator
  wants Lighthouse in CI, file an [operator] AUDIT row.
- **No font preload hint changes.** Next.js's
  `next/font/google` already handles preload + subset for
  the three families we use. Manual `<link rel="preload">`
  would compete with what Next is doing.
- **No `<Suspense>` boundaries added beyond `loading.tsx`.**
  The slow path is the DB read at the page-level, which
  `loading.tsx` handles. Per-section Suspense would
  fragment the layout shift; not worth it at v1's traffic
  shape.
- **`metadataBase` URL is computed once at module load**, not
  per-request. Reason: it depends on env that's pinned at
  build time on Vercel. Per-request would be wasteful and
  would defeat the cache.

## Mobile reflow / responsive

- Skeleton blocks use the same width as their real
  counterparts (artifact tiles, turn bubbles) so the swap
  is layout-stable.
- OG image is 1200×630 (fixed); social platforms scale.
- Favicon ranges (16/32/48 via ImageResponse default) cover
  all the device classes.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/site/origin.ts` | env-set path; fallback path; trims trailing slash | — |
| `lib/site/public-urls.ts` | every public bearings route appears; private routes do not | — |
| `design/primitives/skeleton.tsx` | renders the `data-skeleton` attribute; passes through className | — |
| `components/sessions/session-loading.tsx` | renders three skeleton tiles + a header skeleton | — |
| `components/sessions/transcript-loading.tsx` | renders ≥3 skeleton bubble shells | — |
| `app/layout.tsx` | (existing) — adds default openGraph + twitter export, no new test (covered by typecheck on the Metadata type) | — |
| `app/sitemap.ts` | returns the list from `public-urls.ts` formatted as the Next `MetadataRoute.Sitemap` shape | `e2e/sitemap.spec.ts`: `/sitemap.xml` returns 200, body lists `/about` + `/legal/privacy` |
| `app/robots.ts` | returns the disallow list + sitemap pointer | `e2e/robots.spec.ts`: `/robots.txt` returns 200, body contains `Disallow: /app/` |
| `app/opengraph-image.tsx` | (ImageResponse — runtime test is the e2e GET; unit test would mock the whole runtime, not worth the weight) | `e2e/og-image.spec.ts`: `/opengraph-image` returns 200 with image content-type |
| `app/icon.tsx` | same — runtime route | covered by `e2e/og-image.spec.ts` |

## Hermetic e2e registration

Three new specs, all anonymous, desktop-only (these are
content-shape checks, not layout):

- `e2e/sitemap.spec.ts`
- `e2e/robots.spec.ts`
- `e2e/og-image.spec.ts` (covers opengraph-image + icon +
  apple-icon)

## Verify gate

```bash
pnpm verify
```

No new deps. New file count: ~12 (lib helpers, design
primitive, two loading components, two metadata route
handlers, two image route handlers, three e2e specs, four
test files). All small.

## Commit body template

```
feat: performance + meta — phase 15

- app/layout.tsx: metadataBase, default openGraph
  (siteName=boardroom, type=website), default twitter
  (summary_large_image), robots index/follow — every
  per-page metadata export now inherits these defaults
- app/opengraph-image.tsx: 1200x630 typographic OG via
  next/og's ImageResponse — paper/ink/accent only, no
  avatars (per design decisions §3); alt is the landing
  HERO_HEADLINE
- app/icon.tsx + app/apple-icon.tsx: ImageResponse-rendered
  favicon + apple-touch icon — accent square with a serif
  "b" monogram
- app/sitemap.ts + app/robots.ts: public pages enumerated;
  /app/*, /api/*, /auth/callback, /diag explicitly
  disallowed; sitemap declares the origin via getSiteOrigin
- app/app/sessions/[id]/loading.tsx +
  app/app/sessions/[id]/transcript/loading.tsx: skeleton
  blocks (matching ArtifactPreviewGrid + LiveTranscript
  shape) so the route shows structure before the DB read
  resolves
- design/primitives/skeleton.tsx: paper-sunken block with a
  prefers-reduced-motion-safe shimmer; consumed by the
  loading.tsx files and any future skeleton placeholder
- lib/site/origin.ts + lib/site/public-urls.ts: getSiteOrigin
  with NEXT_PUBLIC_SITE_URL + canonical fallback; the
  indexable URL list parsed against bearings
- per-page metadata gets an openGraph.title/description
  override where the page title differs from the root
  default (about, legal/*, try, signin, about/personas)
- e2e: /sitemap.xml + /robots.txt + /opengraph-image
  return the expected shapes anonymously

Decisions:
- OG image is ImageResponse-built, not a static PNG (no
  extra deps; tracks copy)
- No avatars in OG (design decisions §3)
- No Lighthouse runner in CI this phase (flake + dep cost
  not worth it for one-shot verification)
- Sitemap covers public pages only; /app/* and /api/* are
  explicitly disallowed in robots.txt
- Skeleton primitive lives in design/primitives/ (bearings
  names it as a primitive)
- Origin fallback is the Vercel alias from bearings; custom
  domain via NEXT_PUBLIC_SITE_URL when it lands

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 15's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

## Follow-ups (out of scope this phase)

- **Lighthouse in CI** — operator-gated; file as AUDIT row
  if desired.
- **Per-page OG image renders** (e.g. a personalized OG for
  each persona on `/about/personas`) — out of v1 per the
  build plan ("until demand justifies per-page renders").
- **`<Suspense>` boundaries inside the boardroom transcript**
  for finer-grained streaming — phase 17 polish if profiling
  warrants it.
- **CDN-side OG image caching tuning** — Vercel handles
  this by default; revisit only if real-world cold-start
  latencies become a complaint.
