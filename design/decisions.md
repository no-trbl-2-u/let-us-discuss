# design — decisions

> The brief for boardroom's visual system v1. Read this once; let it sit
> next to bearings on every commit that touches `design/`. Per nexus rule
> (`../nexus/customization/visual-system.md`), **this file wins over
> `plan/bearings.md` on visual conflict.**

## Mood + intent

A hardcover meeting notebook left open under a desk lamp. Warm cream
paper, warm near-black ink, a single oxidized-red mark that comes out
only when something is decided. The board-room metaphor is load-bearing:
when a user drags a persona tile onto the table, the system needs to
feel weighty and intentional — the way placing a printed name-card at a
seat is — not like dropping a tile in a productivity app.

The audience is solo builders, indie devs, and early-stage PMs new to
multi-agent AI workflows. They are confident, in a hurry, allergic to
marketing language. The product should read like a thoughtful colleague,
not a launch announcement. Generous whitespace. Chrome quietly recedes.
The user's pitch and the agents' conferring are the two loudest things
on screen.

## Token rationale

**Paper + ink as the default surface.** Saturated white reads as
software; warm cream reads as something a person made for another
person. The hairline `--paper-edge` carries most layout work that a
heavier border would do in a dashboard system — it lets us section the
UI without scaffolding it. We use **two paper depths besides the base**:
`--paper-raised` for things lifted off the table (cards, persona tiles)
and `--paper-sunken` for wells (the table interior, inputs, monogram
chips). That single inside/outside distinction is enough to express the
whole metaphor.

**A single accent.** `--accent` is the oxidized red of a fountain pen
or a library stamp. It appears in roughly four places: the primary CTA,
the "seated" badge on a staffed persona, the focus ring, and the folded-
corner flag on a fresh artifact. Everywhere else, contrast comes from
ink, paper, and weight. `--accent-2` (a deep slate) exists for the
moderator turn-bubble and the "session in progress" rail and is held
to under 5% of any surface; if we find ourselves reaching for it more
than that, the use case is probably wrong.

**Type pairing.** Source Serif 4 carries the body and the headings —
editorial serif gives the product its gravitas without dressing up.
IBM Plex Sans handles UI labels, eyebrows, and the nav. IBM Plex Mono
shows up only on token counts, kind labels, and timestamps — the
technical bits that earn a monospace. Body sits at 17px, larger than a
typical sans body, because serif at 15px loses its character; long-form
slots run to 19px lead. Headings are tight (1.04–1.16); body is
generous (1.62–1.72).

**Subdued motion.** Motion exists in service of the drag-and-drop
metaphor and almost nothing else. Three timings (120 / 240 / 400ms) and
three easings (`lift` for pick-up, `settle` with a tiny overshoot for
drop-into-seat, `recede` for fade-outs). Page transitions, hover
fancies, list animations — none of these are part of the system. If a
new surface wants them, they need to be argued for in this file.

**Radii close to zero.** Paper has corners; glass has bezels. Defaults
land at 2px and 4px. The boardroom table itself gets the only 8px
radius in the system — it is the one surface the user holds in their
mind as a single object.

**Shadows soft and low.** Two stops: `--shadow-resting` (a 1px
hairline; a card sitting on the desk) and `--shadow-lifted` (the same
card hovered or in front of a modal). A third — `--shadow-dragging` —
is reserved for the moment a persona card is mid-grab. Nothing in the
system is allowed to layer multiple shadows for effect.

## Five things this system intentionally won't do

1. **No gradients.** Anywhere. Not in CTAs, not in hero backgrounds,
   not in card surfaces. The subtle radial paper-texture on `body` is
   the one exception, and it stays at 60% opacity tops.
2. **No glass / no backdrop-blur.** Modals sit on `--paper-raised`
   over a `--paper-sunken` scrim. The metaphor is "a sheet placed on
   top of the desk," not "a frosted pane floating in space."
3. **No avatar photographs for personas.** Personas are abstractions;
   their identity is the typographic monogram plus the name + voice
   register byline. A face would imply biography, gender, race — none
   of which we want the user reading into the model.
4. **No emoji in chrome.** No emoji in nav, in buttons, in empty
   states, in transcript decorations, in artifact labels. (Personas
   are free to use punctuation in their utterances, but the chrome
   stays clean.)
5. **No SaaS dashboard tropes.** No left-rail nav with twelve icons,
   no "Pro" sparkles, no animated illustrations of agents talking, no
   colored progress bars for token usage. Token budget is a monospace
   counter on the corner of the table, not a bar that fills.

## Wins-over-bearings note

`plan/bearings.md` sets working visual defaults — serif body, paper/ink
palette, single accent. Where this file disagrees with those defaults,
this file is the authority. Specifically:

- Bearings says "spacing scale: working default Tailwind's default
  ramp." This system ships a custom 7-stop ramp in `tokens.css`; the
  Tailwind config should `extend.spacing` from those tokens rather
  than fall back to Tailwind defaults.
- Bearings hedges between deep accent-blue and oxidized red. This
  system pins **oxidized red** (`--accent`, oklch ~48% / 32°). The deep
  slate survives as `--accent-2`, used <5% of the time.
- Bearings says "sans headings + UI". This system uses **serif
  headings** (h1–h3) with sans reserved for eyebrows, labels, and
  utility — closer to editorial print than to a SaaS dashboard.

If any later change to `bearings.md` collides with the above, the build
agent should treat this file as authoritative and surface the conflict
in `/oversight`, not silently reconcile.

## Status

- **Version:** v1
- **Committed:** 2026-05-16
- **Reference imagery:** none provided. If files land in
  `design/reference/`, the next pass (v2) should reread them before
  touching tokens or compositions.
- **Open questions for v2:**
  - Persona iconography beyond monograms. The brief explicitly bars
    photos; if v2 wants more identity affordance, a small set of
    monoline glyphs (no avatars) is the open lane.
  - Dark mode is wired into tokens but un-audited at composition
    level. A `/critique` pass on the dark surface before any production
    deploy.
  - Mobile compositions are sketched in the desktop files via
    `md:` breakpoints; a `boardroom.tsx` mobile-first pass is worth
    one design tick once the build agent has real session data
    rendering.
