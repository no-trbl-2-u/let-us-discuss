# Design commission prompt — boardroom

> Paste this into a *fresh* Claude Code session running in a
> working copy of this repo. This session is separate from the
> build loop — its only job is to produce the `design/` tree
> the build loop will then consume.
>
> Time budget: 60–120 minutes of agent work.
>
> See `../nexus/customization/visual-system.md` for why this is
> a separate session and how the system feeds the build plan.

---

## The prompt (paste-ready)

```
Commission the visual system for boardroom.

You are designing the visual system this project will consume
for every page family it ever ships. Read the following before
drawing a single token:

  1. spec.md                            — the product spec
  2. plan/bearings.md                   — stack, surface, voice
  3. ../nexus/customization/visual-system.md
                                        — what "the system" is and isn't
  4. design/reference/                  — reference imagery the user has dropped
                                          (skip if empty)
  5. design/decisions.md                — if a prior pass has run, read it;
                                          this is an extension, not a rewrite

Mood + intent:

  Physical-table seriousness. The board-room metaphor is
  load-bearing: dragging a "person" onto a table should feel
  weighty and intentional, not like dropping a tile in a
  productivity app. Generous whitespace. Warm paper and ink
  defaults — like a hardcover meeting notebook left open under
  a desk lamp. Single accent color, used sparingly. The user's
  pitch and the agents' conferring are the loudest things on
  screen; chrome quietly recedes. Audience is solo builders /
  indie devs / early-stage PMs new to multi-agent AI workflows
  — confident, not condescending, never marketing-y.

Reference:

  No reference imagery has been provided yet. If the user
  drops files into design/reference/ later, prefer those. If
  not, lean toward editorial print (long-form magazines,
  serious newsletters) over SaaS dashboards.

Deliverables — in this order:

  1. design/tokens.css
       - color palette: ink, paper, accent (single), accent-2
         (used <5% of the time), muted, signal-positive,
         signal-warning
       - typography scale: at least 6 sizes; tight line-heights
         for headings, generous for body
       - spacing scale: 6-8 stops on a single ramp
       - radius scale: 3-4 stops (default toward less-rounded;
         this is paper, not glass)
       - shadow stops: subtle only; "card lifted off a table",
         not "neumorphism"
       - motion timing constants ONLY if motion is part of the
         system. Drag-and-drop will use motion; pick 2-3 timings
         + easings, no more.

  2. design/primitives/
       Required:
       - button.tsx (primary, secondary, ghost variants)
       - card.tsx
       - nav.tsx
       - input.tsx (text input + label + error state)
       - link.tsx
       - heading.tsx (h1-h4 with the type scale wired in)
       Project-specific (the board-room metaphor):
       - persona-card.tsx — the draggable persona tile; needs
         a "resting on the table" affordance and a clear
         "selected / staffed" state
       - boardroom-table.tsx — the drop target; needs an empty
         state, a "seats occupied" state, and a "session in
         progress" state
       - turn-bubble.tsx — a single persona utterance in the
         transcript; needs the persona's name + voice register
         visible, plus an "I'm thinking" affordance
       - artifact-tile.tsx — the downloadable output preview
         (spec / exec summary / call-outs)

  3. design/compositions/
       - home.tsx           — the marketing/landing surface
       - boardroom.tsx      — the active session UI, mid-conversation
       - results.tsx        — the final-output screen with all three
                              downloadable artifacts shown
       - signin.tsx         — magic-link form (Supabase Auth)

  4. design/decisions.md
       The brief. Cover:
       - The mood + intent in the system's own words
       - Token rationale (why paper/ink defaults; why a single
         accent; why subdued motion)
       - 3-5 things the system intentionally won't do
         (suggestions: no gradients, no glass/blur,
         no avatar photos for personas — keep persona identity
         typographic, no emoji in chrome)
       - The "wins over bearings on conflict" note

  5. design/INDEX.md
       1-page tour. Each section gets one paragraph: tokens,
       primitives, compositions. Link to the canonical files.

Pause-and-confirm beats:

  After step 1 (tokens), pause. Print the palette + type scale
    to the user; confirm before generating primitives.
  After step 2 (primitives), pause. Print persona-card.tsx and
    boardroom-table.tsx inline; confirm before generating
    compositions. These two carry the metaphor.
  After step 5 (INDEX), pause. Confirm the whole tree before
    committing.

Scope fence — what NOT to do:

  - Do NOT commission OG images, favicons, or social cards.
    Those are the demand-pull asset layer.
  - Do NOT modify code outside design/. The build agent
    consumes design/ on its next tick.
  - Do NOT propose 10+ primitives the spec doesn't need. Every
    primitive carries maintenance cost.
  - Do NOT pick a framework different from what bearings.md
    locks. (Bearings stack is TBD until Phase B; if still
    unset when you run, ask the user to pin Next.js + Tailwind
    OR Next.js + CSS modules before you draw.)
  - Do NOT design persona avatars as photographs. Personas are
    abstractions; identity is typographic + iconographic.

Standing rules:

  - Commit and push as a single atomic act once the whole tree
    is approved.
  - No Co-Authored-By trailers, no emojis.
  - No --no-verify, no force-push.
  - Commit message: "design: visual system v1" (lowercase,
    imperative).

Failure modes — stop and ask if:

  - spec.md is too vague to derive a mood from. (It shouldn't
    be; the pre-spec interview has run.)
  - bearings.md hasn't pinned a CSS framework yet. Ask the
    user to pin one before you draw primitives.
  - The mood note contradicts the audience or the spec.
    Surface; the user picks.

Estimated time: 60-120 minutes. Begin with reading.
```

---

## After the design session lands

The build loop picks up `design/` on its next tick. Update
`plan/bearings.md`'s "Visual system" section to drop the
"working defaults" stanza once `design/tokens.css` exists —
the design system is authoritative from that point.
