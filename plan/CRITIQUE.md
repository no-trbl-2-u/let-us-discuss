# Critique log

> Last pass: 2026-05-18 at commit fed25d5
> Pass count: 5

> External-observer feedback for boardroom. Populated by
> `/critique`, drained by `/iterate`. See `skills/critique.md`
> for the contract.

## Pending

### [MED] /about — "Built with nexus" closer leaks build-process meta

- **Pass:** 5 (2026-05-18, commit `fed25d5`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** voice
- **Severity:** MED
- **Observation:** The closing line on `/about` ("Built with
  nexus — the autonomous loop that drives every commit in
  this repo. See the README for how the build works.") reads
  as meta-commentary about how the product was made, not what
  it is. A first-time visitor reading `/about` wants to know
  what boardroom does for them. Same family of leak as the
  just-closed `/about/personas` "ship via PR" finding —
  build-process language on a "what is this" surface.
- **Evidence:** Closing footnote on `/about` (`app/about/page.tsx`
  L71-79). The footer already credits "boardroom — a nexus
  build" on every page, so the meta-context is already
  attributed; the in-body sentence is redundant.
- **Suggested fix:** Drop the closing sentence entirely
  (the footer credit covers it), or replace with a
  reader-facing pointer (e.g., a single link in the eyebrow
  footnote without the autonomous-loop framing).
- **Source:** browser (reader sub-agent — pass 5)

### [MED] /about — raw "/about/personas" path rendered as link text

- **Pass:** 5 (2026-05-18, commit `fed25d5`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** navigation
- **Severity:** MED
- **Observation:** The "Try it." section on `/about` includes
  a link whose visible text is the URL itself
  (`<Link href="/about/personas">/about/personas</Link>`).
  Reads as a template/markdown bleed-through; URLs-as-labels
  belong in monospace code blocks, not editorial prose. The
  same destination is reachable from the footer's "Personas"
  link with a proper label.
- **Evidence:** `app/about/page.tsx` L64-67: `The persona
  library is on <Link href="/about/personas">/about/personas</Link>.`
- **Suggested fix:** Replace the bare-path link text with a
  human label, e.g., "the persona library is on a
  [dedicated page](/about/personas)." or simply drop the
  redundant link (footer covers it).
- **Source:** browser (reader sub-agent — pass 5)

### [MED] /about/personas — three different meanings of "v1" on one page

- **Pass:** 5 (2026-05-18, commit `fed25d5`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** comprehension
- **Severity:** MED
- **Observation:** The page uses "v1" three times to mean
  three different things: (1) the persona-library version
  ("A curated v1 library"), (2) boardroom-the-product's
  version ("These four are fixed for v1"), and (3) the
  user's product's first version ("A v1 ships in weeks, not
  quarters." on the Product Lead card; "A v1 fits in weeks
  ... push it to v2" on the Skeptical Engineer card). A
  reader sees "v1" four times in adjacent reading and asks
  "whose v1?"
- **Evidence:** `/about/personas` page header + intro use
  "v1" twice for the library. `personas/product-lead.md` +
  `personas/skeptical-engineer.md` system prompts use "v1"
  for the user's product. All three meanings render in one
  scroll.
- **Suggested fix:** Rewrite the in-persona lines to use
  "first version" / "a first release" for the user's
  project, and reserve "v1" at the page level for the
  persona-library version. Touches the persona markdown
  files (data-layer edit, not app code).
- **Source:** browser (reader sub-agent — pass 5)

### [LOW] /about/personas — lede leads with a constraint

- **Pass:** 5 (2026-05-18, commit `fed25d5`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** comprehension
- **Severity:** LOW
- **Observation:** Opening line "A curated v1 library. These
  four are fixed for v1 — you can't add your own yet." opens
  on a constraint (what the user can't do) before
  establishing what a persona is or why these four exist.
  For a first-time visitor arriving from the footer "Personas"
  link, the lede answers a question they haven't asked yet.
  This is a follow-up critique of the pass-2 fix (`1413406`)
  that replaced the "ship via PR" leak — the new copy is
  cleaner but still constraint-first.
- **Evidence:** First sentence of `app/about/personas/page.tsx`
  after the heading: "A curated v1 library. These four are
  fixed for v1 — you can't add your own yet."
- **Suggested fix:** Lead with one plainspoken sentence on
  what a persona is and why these four; move the
  "can't add your own yet" clause to a second sentence or a
  small note below the cards.
- **Source:** browser (reader sub-agent — pass 5)

### [MED] /try — "Real sessions sign in." elided verb mis-parses

- **Pass:** 5 (2026-05-18, commit `fed25d5`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** comprehension
- **Severity:** MED
- **Observation:** The `/try` lede reads "One persona, three
  canned turns, three artifact tiles. Real sessions sign in."
  The closing fragment "Real sessions sign in." is terse to
  the point of mis-parsing. A first-time visitor reads it as
  either a command ("real sessions, sign in!") or as a
  label for something on the page. The intent appears to be
  "real sessions require sign-in" but the elided verb makes
  it ambiguous — particularly right under an H1 that already
  promises a demo.
- **Evidence:** `app/try/page.tsx` lede sub-headline reads
  "One persona, three canned turns, three artifact tiles.
  Real sessions sign in."
- **Suggested fix:** Restore the verb. Suggested copy:
  "Full sessions need a sign-in." or "Sign in to run a real
  session." — keep the terseness but make the parse
  unambiguous.
- **Source:** browser (reader sub-agent — pass 5)

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
- **Note (oversight 2026-05-18):** User committed to adding
  the entry to project-scope `.mcp.json` (now tracked) alongside
  the existing Supabase server. Row stays pending until the next
  /critique pass confirms the reader inherits the
  `mcp__claude-in-chrome__*` namespace.
- **Source:** reader sub-agent (introspection on its own tool list)

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
- **Note (oversight 2026-05-18):** User explicitly deferred
  this round. Critique passes continue anonymous-only; authed
  `/app/*` surfaces (phases 5, 11) remain outside the reader's
  reach until an operator populates the cookie. AUDIT.md
  `[operator] Populate SUPABASE_E2E_SESSION_COOKIE` row holds
  the same context with score 3.0.
- **Source:** web-fetch (reader sub-agent + grep)

## Done

### [x] [HIGH] /legal/privacy + /legal/terms — footer links 404 across the whole site — addressed at `6f32cb8` (phase 12)

- **Original (pass 4, commit `2921fbe`):** Global footer links
  to `/legal/privacy` and `/legal/terms`; both 404; the 404 page
  itself renders the same footer → infinite loop.
- **Resolution:** Phase 12 shipped `/legal/privacy`,
  `/legal/terms`, and `/about` as real surfaces. The e2e spec
  `e2e/legal-routes-resolve.spec.ts` asserts all three return
  200 with their expected H1; the footer links resolve from
  every page including the 404. Phase 17 made the 404 itself
  voice-matched.
- **Closed by:** /march tick at `6f32cb8` (feat) + `7cdabee`
  (DoD). Mirror issue #16 closed via Closes #16 trailer.

### [x] [MED] 404 page is bare and inherits the landing title — addressed at `09e85c2` (phase 17)

- **Original (pass 4, commit `2921fbe`):** Next's auto-404
  rendered "404 / This page could not be found." with no
  dedicated title and no back-home affordance.
- **Resolution:** Phase 17 shipped `app/not-found.tsx` with H1
  "Not found.", in-voice body, three CTAs (`/`, `/try`, `/about`),
  and dedicated metadata (`title: "Not found — boardroom"`,
  noindex). The e2e spec `e2e/not-found.spec.ts` asserts the
  status, H1, CTA href, and document.title.
- **Closed by:** /march tick at `09e85c2` (feat) + `3d62ea6`
  (DoD). Mirror issue #21 closed via Closes #21 trailer.

### [x] [MED] / — "What is a boardroom session?" link mis-routed to /about/personas — addressed at `6f32cb8` (phase 12 retro-fit)

- **Original (pass 2, commit `337e03e`):** Landing CTA labeled
  itself as a "what is this" explainer but routed to
  `/about/personas` (a persona library, not a definition page).
- **Resolution:** Phase 12 shipped `/about` as the canonical
  "what boardroom is" page; the cross-link retro-fit on
  `components/site/landing-hero.tsx` retargeted the CTA's href
  from `/about/personas` → `/about`. The landing-hero unit
  test asserts the new href; the e2e CTA test continues to
  pass.
- **Closed by:** /march tick at `6f32cb8` (feat) + `7cdabee`
  (DoD).

### [x] [MED] /about/personas — "Persona changes ship via PR" leaks build-process language — addressed at `1413406`

- **Original (pass 2, commit `337e03e`):** The persona-library
  intro carried internal contributor copy ("Persona changes ship
  via PR — the table here is the canonical view.") onto a
  public surface. An anonymous visitor doesn't know what "ship
  via PR" means.
- **Resolution:** /iterate replaced the second sentence with
  reader-facing context: "These four are fixed for v1 — you
  can't add your own yet." Phase 12's brief explicitly
  deferred this to /iterate as a single-sentence change.
- **Closed by:** /iterate tick at `1413406`.

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
