# design — INDEX

A one-page tour. Each section below is one paragraph plus the
canonical files it points to. The build agent should land here first
when it needs to look something up.

## Tokens

The single source of truth for color, type, spacing, radius, shadow,
and motion is **[`tokens.css`](./tokens.css)**. It declares CSS custom
properties in the `:root` and inverts a subset under
`prefers-color-scheme: dark`. The Tailwind config consumes these via
`extend.colors` / `extend.fontFamily` / `extend.spacing`; components
reference the variables directly only when a Tailwind utility would be
awkward. The **palette** is warm cream paper, warm near-black ink, a
single oxidized-red accent, a deep slate accent-2 reserved for <5% of
surfaces, and restrained positive/warning signals. The **type scale**
is six size stops plus a marketing display; serif body at 17px;
headings tight, body generous. The **spacing ramp** is a single 7-stop
scale (4–88px); radii sit close to zero (paper, not glass); shadows
are soft and low; motion is three timings + three easings, all in
service of drag-and-drop.

## Primitives

Component-level building blocks. Each is its own file under
[`primitives/`](./primitives/), Tailwind-classed, and reads tokens via
CSS variables.

- **[`heading.tsx`](./primitives/heading.tsx)** — `<Heading level={1|2|3|4}>` with the
  type scale wired in; pass `eyebrow` for the sans tracked-caps section
  label.
- **[`button.tsx`](./primitives/button.tsx)** — `primary` / `secondary` / `ghost`
  variants in `md` / `sm` sizes. Primary is the only place chrome wears
  the accent.
- **[`card.tsx`](./primitives/card.tsx)** — paper plate with `<CardHeader>` /
  `<CardBody>` / `<CardFooter>`. `flat` prop for dense lists.
- **[`nav.tsx`](./primitives/nav.tsx)** — top bar with wordmark, link list, and
  optional CTA. No emoji, no icons-without-labels.
- **[`input.tsx`](./primitives/input.tsx)** — text input + tracked-caps label +
  helper / error slot.
- **[`link.tsx`](./primitives/link.tsx)** — `default` (editorial underline)
  and `quiet` (chrome) variants; wraps `next/link`.
- **[`persona-card.tsx`](./primitives/persona-card.tsx)** — the draggable persona
  tile. Four states (`resting`, `hover`, `dragging`, `staffed`). Carries
  the metaphor: identity is monogram + name + voice register, never a
  photo.
- **[`boardroom-table.tsx`](./primitives/boardroom-table.tsx)** — the drop target.
  Three states (`empty`, `seated`, `active`). Renders 6 seats around an
  ellipse; active sessions surface a thin accent-2 rail on the top edge
  and pulse the seat of whichever persona is mid-turn.
- **[`turn-bubble.tsx`](./primitives/turn-bubble.tsx)** — one persona utterance.
  Includes the "I'm thinking" affordance (three pulsing dots) and a
  streaming caret variant. `register="moderator"` switches the bubble
  to the accent-2 palette for system turns (<5% of transcript volume).
- **[`artifact-tile.tsx`](./primitives/artifact-tile.tsx)** — the downloadable-
  output preview for the three v1 artifacts (spec, exec summary,
  call-outs). Folded-corner accent flag while fresh; removes once
  downloaded.

## Compositions

Page-level assemblies that consume the primitives. Each is a single
default-exported component under [`compositions/`](./compositions/);
the corresponding Next.js routes wrap these with their data layer.

- **[`home.tsx`](./compositions/home.tsx)** — `/`. Three vertical movements:
  pitch + CTAs, three "how a session runs" notes numbered like a
  hardcover TOC, and the persona shelf as a horizontal scroller.
- **[`signin.tsx`](./compositions/signin.tsx)** — `/signin`. Magic-link form
  centered in the viewport. Wordmark above, single card with email
  field and one button. Includes a `state="sent"` post-submit variant.
- **[`boardroom.tsx`](./compositions/boardroom.tsx)** — `/app`. The active
  session UI. Three columns on desktop: shelf, table + pitch, transcript.
  The table is in its `active` state with one seat speaking and one
  persona mid-think; the moderator turn-bubble is shown once.
- **[`results.tsx`](./compositions/results.tsx)** — `/app/sessions/[id]`.
  Three artifact tiles on a row, session header, transcript-link
  footer.

## Decisions

The brief — mood, token rationale, the five things this system
won't do, and the wins-over-bearings note — lives in
**[`decisions.md`](./decisions.md)**. Read it before changing a token
default. If reference imagery lands later in `reference/`, the v2 pass
should re-read both files before drawing.

## Things that are NOT in this tree

Per the design-prompt scope fence:

- No OG images, favicons, or social cards. Those are the demand-pull
  asset layer and ship under a different brief.
- No `tailwind.config.ts` patch — the build agent owns Tailwind
  config; this tree only emits the CSS variables it should `extend`
  from.
- No data layer — primitives are dumb. Their data comes from props,
  authored upstream.

## Version

v1 — 2026-05-16. The whole tree is the unit; bumping a token bumps
this version. Migration guidance, if any, lives at the bottom of
`decisions.md`.
