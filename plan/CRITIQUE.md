# Critique log

> Last pass: 2026-05-16 at commit 337e03e
> Pass count: 2

> External-observer feedback for boardroom. Populated by
> `/critique`, drained by `/iterate`. See `skills/critique.md`
> for the contract.

## Pending

### [HIGH] /try — H1 "See the shape in under a minute." reads as marketing fluff

- **Pass:** 2 (2026-05-16, commit `337e03e`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** voice
- **Severity:** HIGH
- **Observation:** The `/try` H1 is exactly the marketing-fluff
  register `plan/bearings.md` prohibits. The page body below it
  is honest and plainspoken ("three canned turns, no AI calls"),
  so the H1 is the outlier — and it's the first thing a visitor
  reads. A been-there colleague says what the page is, not
  "see the shape."
- **Evidence:** H1 in `app/try/page.tsx`: `See the shape in
  under a minute.` Bearings voice cue
  (`plan/bearings.md`): *"Plainspoken, terse, no marketing
  fluff."*
- **Suggested fix:** Replace H1 with a descriptive variant,
  e.g. `What a session looks like.` or `A one-minute demo
  session.` — drop the abstract-noun phrasing.
- **Source:** web-fetch (reader sub-agent)

### [MED] /about/personas — "Persona changes ship via PR" leaks build-process language

- **Pass:** 2 (2026-05-16, commit `337e03e`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** comprehension
- **Severity:** MED
- **Observation:** The persona-library intro carries internal
  contributor copy onto a public surface. An anonymous
  visitor does not know what "ship via PR" means in this
  context and doesn't need to. The first sentence is fine;
  the second sentence is the leak.
- **Evidence:** Intro in `app/about/personas/page.tsx`:
  `A curated v1 library. User-created personas land post-v1.
  Persona changes ship via PR — the table here is the
  canonical view.`
- **Suggested fix:** Replace the second sentence with
  reader-facing context, e.g. `These four are fixed for v1;
  you can't add your own yet.`
- **Source:** web-fetch (reader sub-agent)

### [MED] /try — "Want all four?" CTA shifts into pitch-deck register

- **Pass:** 2 (2026-05-16, commit `337e03e`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** voice
- **Severity:** MED
- **Observation:** The locked-seat CTA below the demo shelf
  drifts into upsell phrasing mid-page. `/signin` nails the
  bearings voice ("Enter your email and we'll send a one-time
  link. No password, no follow-ups."); `/try` should match.
  "Want all four?" is the kind of phrasing a colleague
  wouldn't use to another colleague.
- **Evidence:** `/try` locked-seat copy in
  `components/demo/demo-shelf.tsx`:
  `Want all four? Sign in to staff the full table.` vs.
  `/signin` copy (current bearings-voice exemplar).
- **Suggested fix:** Reword to a flat statement, e.g.
  `The other four personas need a session — sign in to staff
  the full table.`
- **Source:** web-fetch (reader sub-agent)

### [MED] / — "What is a boardroom session?" link mis-routed to /about/personas

- **Pass:** 2 (2026-05-16, commit `337e03e`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** navigation
- **Severity:** MED
- **Observation:** The landing CTA labels itself as a "what is
  this" explainer but routes to `/about/personas`, which is a
  persona library, not a definition page.
  `plan/bearings.md` L154 reserves `/about` for "What boardroom
  is and isn't" — but `/about` doesn't ship until phase 12.
  Until then, the label promises a destination that doesn't
  exist, and the actual destination doesn't answer the label's
  question.
- **Evidence:** Landing CTA in `components/site/landing-hero.tsx`:
  `<Link href="/about/personas" variant="default">What is a
  boardroom session?</Link>`. `/about/personas` opens: "A
  curated v1 library."
- **Suggested fix:** Until phase 12 ships `/about`, rename the
  label to match the destination, e.g. `Meet the personas.`
  Phase 12 can then add the canonical `/about` link with the
  "what is this" framing.
- **Source:** web-fetch (reader sub-agent)

### [LOW] /try — pitch placeholder contradicts the 100-word cap

- **Pass:** 2 (2026-05-16, commit `337e03e`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** comprehension
- **Severity:** LOW
- **Observation:** The pitch input placeholder says "Aim for
  1–3 short paragraphs" but the counter directly below caps at
  "0 / 100 words". A short paragraph easily reaches 60–80
  words; three of them comfortably exceeds the cap, setting up
  an avoidable input-rejection moment.
- **Evidence:** `components/demo/demo-pitch-input.tsx` passes
  the placeholder "What are you trying to ship, and for whom?
  (≤ 100 words.)" — but the underlying `PitchInput` (phase 5)
  still has the old hard-coded "Aim for 1–3 short paragraphs"
  helper text in its counter row.
- **Suggested fix:** Either parametrize the helper text along
  with `max` in `components/boardroom/pitch-input.tsx`, or
  override it in the demo wrapper. Suggested copy at the demo
  cap: "A paragraph or two — 100 words max."
- **Source:** web-fetch (reader sub-agent)

### [LOW] /try — "Start demo · 3 turns, one persona, no AI calls" crams meta into the button

- **Pass:** 2 (2026-05-16, commit `337e03e`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** visual
- **Severity:** LOW
- **Observation:** The dot-bullet "meta-on-button" pattern is
  unusual; first-time visitors read it as button + fine-print
  and may miss that the demo is canned (no AI calls) before
  they click. The honesty is on-voice — the placement is not.
- **Evidence:** `components/demo/demo-start-button.tsx`:
  button label is `Start demo`; the eyebrow span sitting
  *inside* the same flex row reads `demo · 3 turns, one
  persona, no AI calls`. Visually they look like one widget.
- **Suggested fix:** Move the meta line below the button as
  a single helper, not adjacent. The button stays "Start
  demo"; the helper reads "3 turns · one persona · no AI calls"
  in the same eyebrow style.
- **Source:** web-fetch (reader sub-agent)

### [needs-user-call] SUPABASE_E2E_SESSION_COOKIE unset — authed /critique cannot walk /app

- **Pass:** 1 (2026-05-16, commit `29e5d62`) — still pending after pass 2
- **Viewport:** desktop
- **Auth state:** auth-failed
- **Category:** infra
- **Severity:** HIGH
- **Observation:** The authenticated reader pass exited
  immediately at pre-flight: `plan/bearings.md` L42 declares
  `Auth: session-cookie` via `SUPABASE_E2E_SESSION_COOKIE`,
  but that env var is unset in `.env` and `.env.example`.
  Without it, the reader cannot establish a Supabase session
  to walk `/app`, so the canonical-sibling boardroom UI just
  shipped in phase 5 (commit `6123320`) is invisible to the
  critique loop. Tracked in parallel as the
  `[operator] Populate SUPABASE_E2E_SESSION_COOKIE` row in
  `plan/AUDIT.md` (score 3.0).
- **Evidence:** `grep -E 'SUPABASE_E2E_SESSION_COOKIE' .env
  .env.example` returns nothing. Reader sub-agent (pass 1)
  returned `auth_state: "auth-failed"` per reader hard rule 9
  (no silent fallback to anonymous when Auth: session-cookie
  is declared).
- **Suggested fix:** Operator action. Create a dedicated
  `critique-bot@…` Supabase user; sign in once via
  magic-link in a browser; copy the resulting
  `sb-<project>-auth-token` cookie; set
  `SUPABASE_E2E_SESSION_COOKIE` in `.env`. Update
  `.env.example` with a commented-out template.
- **Source:** web-fetch (reader sub-agent + grep)

## Done

### [x] [misdirected] Production canonical URL returns 404 — closed 2026-05-16 oversight round 5

- **Original claim (pass 1, commit `29e5d62`):** the canonical
  URL declared in `plan/bearings.md` L27 returns 404 on every
  route; production marketing pages unreachable.
- **What actually happened:** the URL in bearings.md was wrong.
  The bare `let-us-discuss.vercel.app` host was already taken,
  so Vercel assigned the alias `let-us-discuss-ai.vercel.app`
  for this project. Curl verification this round:
  - `let-us-discuss-ai.vercel.app/` → 200
  - `let-us-discuss-ai.vercel.app/signin` → 200
  - `let-us-discuss.vercel.app/` → 404 (the wrong host)
- **Resolution:** bearings.md L27 + .env.example L128 + the
  resolved AUDIT row title updated to reference the correct
  alias. The pass-1 reader pass walked the wrong URL and
  drew the wrong conclusion.

### [x] [misdirected] Vercel deployment protection blocks anonymous /critique — closed 2026-05-16 oversight round 5

- **Original claim (pass 1, commit `29e5d62`):** per-deploy
  URLs return 401 to anonymous traffic; future /critique
  passes will fail at the door.
- **What actually happened:** the canonical alias
  (`let-us-discuss-ai.vercel.app`) is anonymously
  reachable — the 401 was on per-deploy preview URLs, which
  is the *expected* behavior of Vercel deployment
  protection. /critique's contract is to walk the **canonical
  URL**, not per-deploy preview URLs; once the canonical was
  identified correctly, this finding evaporates.
- **Resolution:** no infra change required. Closed as
  misdirected.
