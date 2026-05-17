# Critique log

> Last pass: 2026-05-16 at commit 2921fbe
> Pass count: 4

> External-observer feedback for boardroom. Populated by
> `/critique`, drained by `/iterate`. See `skills/critique.md`
> for the contract.

## Pending

### [HIGH] /legal/privacy + /legal/terms — footer links 404 across the whole site

- **Pass:** 4 (2026-05-16, commit `2921fbe`)
- **Viewport:** desktop + mobile
- **Auth state:** anonymous
- **Category:** infra
- **Severity:** HIGH
- **Observation:** The global footer links to `/legal/privacy` and
  `/legal/terms` from every page. Both URLs return the generic
  Next.js 404. The 404 page itself renders the same footer, so a
  user who clicks the footer link from the 404 page lands on
  another 404 — infinite loop. This was surfaced earlier in the
  session in an aborted critique tick; the brief allowed
  re-filing if still present, and it is.
- **Evidence:** WebFetch returns 404 for both routes; the 404
  body is `404 / This page could not be found.` with no in-main
  links; the global footer renders on the 404 page and links
  back to the same dead URLs.
- **Suggested fix:** Phase 12 owns `/about + /legal/*`; either
  pull it forward to ship one-paragraph stubs at
  `/legal/privacy` and `/legal/terms`, or remove the footer
  links until phase 12 lands.
- **Source:** browser (reader sub-agent)

### [MED] 404 page is bare and inherits the landing title

- **Pass:** 4 (2026-05-16, commit `2921fbe`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** seo
- **Severity:** MED
- **Observation:** The `app/not-found.tsx` page has no
  dedicated `<title>` and renders only two headings ("404"
  and "This page could not be found."). The tab title falls
  through to the landing page's title ("boardroom — a short,
  opinionated meeting with AI personas"), which misleads
  search engines + browser history users; the page body has
  no "back home" affordance.
- **Evidence:** `read_page` on /legal/privacy shows main with
  only `<h1>404</h1>` + `<h2>This page could not be found.</h2>`;
  document.title equals the landing-page title.
- **Suggested fix:** Add `export const metadata = { title: 'Not
  found — boardroom' }` and a one-line in-voice body with a
  link back to `/` inside `app/not-found.tsx`.
- **Source:** browser (reader sub-agent)

### [MED] /try — Product Lead persona card is rendered twice (shelf + boardroom)

- **Pass:** 4 (2026-05-16, commit `2921fbe`)
- **Viewport:** desktop + mobile
- **Auth state:** anonymous
- **Category:** visual
- **Observation:** On `/try` the same Product Lead card appears
  in the left "Demo shelf" complementary region AND in the
  boardroom region (the staffed seat). Identical name + role
  tag + voice line + blurb. First-paint reading: "is one a
  preview? am I supposed to drag it?" Screen readers also
  announce the persona twice. The dual-render is consistent
  with the shelf-as-source / boardroom-as-seat pattern from
  `/app`, but on `/try` there is only one persona and it is
  pre-seated — so the shelf-side card carries no useful
  affordance.
- **Evidence:** Accessibility tree shows article[ref=14] under
  complementary "Demo shelf" and article[ref=24] under the
  boardroom region, both with identical content.
- **Suggested fix:** On `/try` specifically, hide the
  shelf-side persona card when the persona is already staffed
  (or mark it `aria-hidden="true"` + visually-dim). The /app
  surface — where unseated personas are common — keeps the
  shelf-side card as the drag source.
- **Source:** browser (reader sub-agent)

### [MED] /try — seat count (5 locked + 1 staffed) contradicts "Want all four?"

- **Pass:** 4 (2026-05-16, commit `2921fbe`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** comprehension
- **Observation:** The /try boardroom shows 5 locked seats +
  1 staffed Product Lead — 6 total seat positions. The locked
  CTA copy says "Want all four?" referring to the four curated
  personas. A first-time visitor counting either the seats OR
  the CTA gets contradictory signals about table size vs
  persona count. The existing pending "Want all four?" finding
  is about voice register, not arithmetic — this is a separate
  observation.
- **Evidence:** Accessibility tree at /try lists seats with
  labels "Seat 1 — demo locked" through "Seat 5 — demo
  locked" + the staffed "Seat 0". CTA text reads "Want all
  four? to staff the full table." Personas dir on disk holds
  exactly 4 markdown files.
- **Suggested fix:** Pick a single anchor for the demo's
  visible scale. Either: (a) trim the demo boardroom to show 4
  seats (matching the 4 personas) and keep "Want all four?";
  or (b) reword the CTA to "Want the full table?" so the
  number disappears and the 6-seat visual is uncontested.
  Option (b) is the cheaper change and respects the existing
  MAX_PERSONAS_SEATED=6 constant.
- **Source:** browser (reader sub-agent)

### [LOW] /signin — unlabeled hidden inputs surface to assistive tech

- **Pass:** 4 (2026-05-16, commit `2921fbe`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** a11y
- **Observation:** The magic-link form on `/signin` contains
  four hidden text inputs. Three are announced to assistive
  tech with the label "[value redacted]"; one has no
  accessible name at all. Hidden inputs are usually skipped
  by AT, but these four are appearing — likely missing
  `aria-hidden="true"` on the framework-injected CSRF /
  honeypot fields.
- **Evidence:** `read_page` /signin → form[ref=10] contains
  textbox[ref=11] type='hidden' (no label) + textboxes[12-14]
  type='hidden' labeled '[value redacted]'.
- **Suggested fix:** Add `aria-hidden="true"` to the
  framework-injected hidden inputs in `app/signin/sign-in-form.tsx`
  (or wherever the form is composed). Investigate which
  layer adds them (Supabase SSR vs Next form) before patching.
- **Source:** browser (reader sub-agent)

### [LOW] /try — pitch textbox has three overlapping guidance affordances

- **Pass:** 4 (2026-05-16, commit `2921fbe`)
- **Viewport:** mobile
- **Auth state:** anonymous
- **Category:** comprehension
- **Observation:** The pitch input stacks placeholder ("What
  are you trying to ship, and for whom? (≤ 100 words.)"),
  helper text ("Aim for 1–3 short paragraphs."), and a counter
  ("0 / 100 words") all under one label. On 375-wide mobile
  the stack feels noisy for a single-paragraph input. Adjacent
  to the existing pending "1–3 short paragraphs" finding but
  distinct (that one is about the cap mismatch; this is about
  visual density).
- **Evidence:** read_page /try: ref_46 label 'Pitch' → ref_47
  textbox (placeholder) → ref_48 generic 'Aim for 1–3 short
  paragraphs.' → ref_49 '0 / 100 words'.
- **Suggested fix:** Collapse to two affordances when the
  1-3-paragraphs/100-words fix lands. Suggested shape:
  placeholder as the example + a single helper line carrying
  both the constraint and the counter, e.g. "100 words max ·
  0 used".
- **Source:** browser (reader sub-agent)

### [needs-user-call] /critique reader cannot exercise interactive states — Chrome MCP not configured

- **Pass:** 3 (2026-05-16, commit `f48c299`)
- **Viewport:** desktop + mobile
- **Auth state:** anonymous
- **Category:** infra
- **Severity:** HIGH
- **Observation:** Pass 3 was commissioned specifically to walk
  the interactive /try demo loop (TurnBubble auto-advance,
  Skip button, DemoAlreadyUsed sessionStorage state, 375×800
  mobile reflow). The reader sub-agent's tool surface does
  not include the `mcp__claude-in-chrome__*` namespace; only
  `WebFetch`, `WebSearch`, `Read`, `Grep`, `Glob` are
  exposed. WebFetch can't execute JS, so the interactive
  states stay unreachable across passes. Pass 2 hit the same
  wall; pass 3 surfaced it as a single finding rather than
  re-producing pass 2's blind spot.
- **Evidence:** Reader sub-agent return — "Available tool
  list in this invocation: WebFetch, WebSearch, Read, Grep,
  Glob. No mcp__claude-in-chrome__* namespace present."
  Spot-check via direct curl confirmed the H1 fix shipped at
  `3fcf592` is live in production (the page source contains
  "What a session looks like" and the old "See the shape"
  copy is gone) — so the deploy itself is healthy; the
  reader's environment is the gap.
- **Suggested fix:** Register the `claude-in-chrome` MCP server
  in the user's `~/.claude.json` (or equivalent) so the
  reader sub-agent inherits the `mcp__claude-in-chrome__*`
  tools. Verify by re-spawning a reader and checking its
  available tool list before walking the page set. Until
  that lands, /critique passes can only assess server-rendered
  HTML; interactive state critique is blocked.
- **Source:** reader sub-agent (introspection on its own tool list)

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

### [x] [HIGH] /try — H1 marketing-fluff reworded — addressed at `3fcf592` (issue #9)

- **Original (pass 2, commit `337e03e`):** H1 "See the shape
  in under a minute." reads as marketing fluff.
- **Resolution:** H1 rewritten to "What a session looks like."
  — descriptive, terse, matches bearings voice cue and the
  on-voice page body underneath.
- **Closed by:** /iterate tick at `3fcf592`. Issue #9 auto-closed
  on push.

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
