# Critique log

> Last pass: 2026-05-21 at commit 83c595c
> Pass count: 13

> External-observer feedback for boardroom. Populated by
> `/critique`, drained by `/iterate`. See `skills/critique.md`
> for the contract.

## Pending

### [HIGH] / — hero subhead still says "one-word questions" (predicted regression from pass-12 fix sweep)

- **pass:** 13 (commit `83c595c`)
- **viewport:** desktop
- **auth state:** anonymous
- **category:** voice
- **observation:** The /about lede was corrected at `91090dd`
  to use the canonical "one-word or one-sentence clarifying
  questions" shape, but the landing hero subhead in the same
  component file still carries the old "You answer one-word
  questions at the checkpoints" copy. Pass-12 closure note
  for issue #40 explicitly called this out as the
  not-bundled drift; pass 13 confirms it survived.
- **evidence:** Hero subhead on `/`: "Drop a few personas
  onto the table, hand them your pitch, and let them confer.
  You answer one-word questions at the checkpoints. They do
  the thinking." Source: `components/site/landing-hero.tsx`
  `HERO_SUBHEAD` constant (around L8). Compare canonical:
  the template constraint says "Every question must accept a
  1-word or 1-sentence answer."; /about lede + landing step
  copy both align.
- **suggested fix:** Edit `HERO_SUBHEAD` in
  `components/site/landing-hero.tsx`: "You answer one-word
  questions at the checkpoints." → "You answer one-word or
  one-sentence clarifying questions at the checkpoints."
- **source:** web-fetch

### [MED] /try — "The Product Lead is already at the table." body restates the new lede

- **pass:** 13 (commit `83c595c`)
- **viewport:** desktop
- **auth state:** anonymous
- **category:** comprehension
- **observation:** The /try lede was rewritten at `ec81a40`
  to say "The demo seats the Product Lead for you; full
  sessions let you staff the table yourself once you sign
  in." A body paragraph below the lede still says "The
  Product Lead is already at the table. The other seats are
  locked — sign in to staff the full table." — same idea
  twice within two consecutive blocks. The body line feels
  like leftover copy from before the lede was rewritten.
- **evidence:** Lede (page header on /try): "One persona,
  three canned turns, three artifact tiles. The demo seats
  the Product Lead for you; full sessions let you staff the
  table yourself once you sign in." Body just below the
  boardroom: "The Product Lead is already at the table. The
  other seats are locked — sign in to staff the full table."
  Source: `components/demo/demo-shelf.tsx` (the
  "already at the table" string lives there per
  `grep -rn`).
- **suggested fix:** Drop the body restatement and let the
  seat tiles' "sign in to seat" labels (shipped at
  `7b7d58e`) carry the message. Or compress to a single
  line above the table.
- **source:** web-fetch

### [MED] /try — "1 persona" vs "one persona" register drift on the same page

- **pass:** 13 (commit `83c595c`)
- **viewport:** desktop
- **auth state:** anonymous
- **category:** voice
- **observation:** The /try page renders the persona count
  in two different registers within a few hundred pixels:
  a subheading reads "demo · 1 persona" (numeric) while the
  Start-demo button caption reads "3 turns · one persona ·
  no AI calls" (prose). Same surface, same concept, two
  styles. Reads as drafted-by-committee against the
  plainspoken-colleague voice.
- **evidence:** Subheading: "demo · 1 persona". Button
  caption: "3 turns · one persona · no AI calls".
- **suggested fix:** Pick one register on /try. Prose-style
  "one persona" in both places matches the surrounding body
  copy.
- **source:** web-fetch

### [LOW] / — landing eyebrow paraphrases the H1 (no new info)

- **pass:** 13 (commit `83c595c`); previously surfaced and
  dismissed at pass 12 self-assessment, re-flagged here.
- **viewport:** desktop
- **auth state:** anonymous
- **category:** comprehension
- **observation:** Eyebrow and H1 collapse to nearly the
  same sentence: eyebrow "boardroom — a short, opinionated
  meeting with AI personas" and H1 "A short, opinionated
  meeting between AI personas — and you leave with a usable
  spec." The eyebrow does no work the H1 doesn't already do;
  the only new information is the product name, which is
  already in the header nav. First paint reads twice before
  reaching the lede.
- **evidence:** Eyebrow: "boardroom — a short, opinionated
  meeting with AI personas". H1: "A short, opinionated
  meeting between AI personas — and you leave with a usable
  spec."
- **suggested fix:** Shorten the landing eyebrow to a
  category label ("boardroom") or a different orienting
  phrase (audience, e.g. "for solo builders without a spec
  yet") so it doesn't pre-echo the H1.
- **source:** web-fetch

### [LOW] /about — "board-room table" hyphen contradicts the rest of the lexicon

- **pass:** 13 (commit `83c595c`)
- **viewport:** desktop
- **auth state:** anonymous
- **category:** voice
- **observation:** /about's lede hyphenates "board-room"
  ("staff onto a board-room table") even though every other
  surface — landing, eyebrow, H1, nav, /about/personas,
  /try, persona prompt bodies — uses "boardroom" as one
  word. Small but it's the very first sentence of the
  explainer page; reads as a typo against the rest of the
  lexicon.
- **evidence:** /about lede: "...running a short, opinionated
  conversation between AI personas you staff onto a
  board-room table." Eyebrow on the same page: "boardroom ·
  about".
- **suggested fix:** "board-room table" → "boardroom table"
  on /about. Single-word grep across `app/`, `components/`,
  `personas/` confirms one-word "boardroom" everywhere else.
- **source:** web-fetch

### [LOW] /about/personas — Secretary card sits in the same visual grid as the four conferring personas

- **pass:** 13 (commit `83c595c`)
- **viewport:** desktop
- **auth state:** anonymous
- **category:** comprehension
- **observation:** The lede reframed at `baa28ea` says "four
  conferring personas plus a Secretary who keeps the log."
  The "four plus one" framing isn't reinforced visually —
  the Secretary card (now monogram `SC`) renders in the same
  uniform grid as PL/SE/EP/GV. A first-time visitor reading
  the lede then scanning the grid still has to read the SC
  card's body to confirm Secretary is structurally different.
- **evidence:** Lede phrasing on /about/personas; rendered
  card grid: PL, SE, EP, GV, SC — uniform visual treatment.
  SC card's summary is the only one without a quoted
  directive; only structural cue otherwise is the body prose.
- **suggested fix:** Either visually separate the Secretary
  card (divider, subheading "Log-keeper", or muted styling)
  or add a one-line tag on the SC card like
  "log-keeper, non-conferring" to mirror the lede's grouping.
- **source:** web-fetch

### [x] [MED] /about — "one-word questions" canonical mismatch — addressed at `91090dd`

- **Pass:** 12 (commit `8b17933`)
- **Resolved 2026-05-21 at `91090dd`** (issue #34). One-line
  copy edit on `app/about/page.tsx`; lede now uses the
  canonical "one-word or one-sentence clarifying questions"
  shape that matches every other surface + the template
  constraint.

### [x] [MED] /about + /about/personas — bare "v1" without antecedent — addressed at `163787c`

- **Pass:** 12 (commit `8b17933`)
- **Resolved 2026-05-21 at `163787c`** (issue #35). Swapped
  "v1" → "starter" on every user-visible surface across both
  pages (lede, breadcrumb eyebrow, "What it isn't" body, "Try
  it" link copy, OG/Twitter metadata description). Left the
  dead empty-state branch at `app/about/personas/page.tsx:56`
  untouched per the commit body — it's not user-reachable and
  is pinned as a regex fixture in
  `lib/site/__tests__/empty-state-copy.test.ts`.

### [x] [LOW] /signin — defensive email helper — addressed at `fc13867`

- **Pass:** 12 (commit `8b17933`)
- **Resolved 2026-05-21 at `fc13867`** (issue #41). Helper
  "We never use this for anything else." → "Used to send the
  magic link and attach your sessions to this account."
  `design/compositions/signin.tsx` carries the same string
  but as a design export, not shipped — a separate sweep can
  align it.

### [x] [MED] /try — "demo · locked" badge — addressed at `7b7d58e`

- **Pass:** 12 (commit `8b17933`)
- **Resolved 2026-05-21 at `7b7d58e`** (issue #33). Badge copy
  changed to "sign in to seat" + matching aria-label; cursor
  reverted to default (the new framing is an invitation, not
  a "you can't"); dashed border + opacity-50 stay as the
  visual gate signal. Regression test added in
  `components/demo/__tests__/demo-components.test.tsx`.

### [x] [MED] /about/personas — "aren't shipped yet" roadmap leak — addressed at `b2368e8`

- **Pass:** 12 (commit `8b17933`)
- **Resolved 2026-05-21 at `b2368e8`** (issue #36). Half-clause
  "user-defined personas aren't shipped yet" → "authoring your
  own isn't in scope" — matches /about's existing framing.
  "These four" left untouched per the one-fix-per-tick rule;
  the cast-count drift is the separate pass-10 finding.

### [x] [LOW] /legal/privacy — moderation-row scope passages aligned — addressed at `cbb0e73`

- **Pass:** 12 (commit `8b17933`)
- **Resolved 2026-05-21 at `cbb0e73`** (issue #42). The two
  passages were already functionally identical (both retain
  offending text + verdict + timestamp), but the Moderation
  section's "what tripped" was readable as narrower than the
  What-we-store section's "the offending text." Tightened
  the Moderation section to use the same explicit phrasing
  so the two passages are provably identical. No retention
  policy change.

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
- **Pass-10 re-check (2026-05-19, commit `f21399e`):** Reader
  was re-spawned with explicit instructions to enumerate its
  tool list. Tools available: `WebFetch`, `WebSearch`, `Read`,
  `Grep`, `Glob` only — no `mcp__claude-in-chrome__*` namespace.
  10 consecutive critique passes have been WebFetch-only;
  interactive /try states + mobile reflow + console + network
  timing remain unreachable. Status unchanged; row stays
  pending.
- **Pass-11 re-check (2026-05-20, commit `9ed19c6`):** Reader
  confirmed `mcp__claude-in-chrome__*` still unavailable in
  the anonymous reader sub-agent's tool list. 11 consecutive
  passes WebFetch-only. Status unchanged.
- **Pass-12 re-check (2026-05-21, commit `8b17933`):** Reader
  again confirmed `mcp__claude-in-chrome__*` not in its tool
  list this invocation. 12 consecutive passes WebFetch-only.
  Status unchanged.
- **Pass-13 re-check (2026-05-21, commit `83c595c`):** Reader
  confirmed `mcp__claude-in-chrome__*` still not in tool list.
  13 consecutive passes WebFetch-only. Status unchanged.
- **Source:** reader sub-agent (introspection on its own tool list)

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
- **Pass-11 re-check (2026-05-20, commit `9ed19c6`):** Authed
  reader pass exited at Step 0 with `auth_state: "auth-failed"`
  per reader hard rule 9 (`.env` still lacks the cookie;
  `.env.example` L77/L80/L109 still carry only commented
  templates). Three consecutive authed passes blocked at the
  same gate. Status unchanged.
- **Pass-12 re-check (2026-05-21, commit `8b17933`):** Anonymous
  pass only; the authed leg was skipped this round because the
  `[operator]` audit row is still in deferred state. Four
  consecutive passes (counting pass 12 anon-only as the latest)
  with no authed walk; `/app/*` surfaces still observed only via
  unit tests + the URL-contract walker's redirect check.
- **Pass-13 re-check (2026-05-21, commit `83c595c`):** Same
  shape as pass 12 — anonymous only; authed leg skipped.
  `.env` still lacks the cookie. Five consecutive authed
  passes blocked at the same gate.
- **Source:** web-fetch (reader sub-agent + grep)

### [x] [MED] /try — drag-promise gap — addressed at `ec81a40`

- **Pass:** 9 (commit `363aa2a`); pending across passes 9–12.
- **Resolved 2026-05-21 at `ec81a40`** (issue #39). /try
  opener replaces "Full sessions need a sign-in." with
  "The demo seats the Product Lead for you; full sessions
  let you staff the table yourself once you sign in." —
  names both the missing affordance and the gate.

### [x] [MED] /about/personas — no link back to /about — addressed at `4f38e1a`

- **Pass:** 9 (commit `363aa2a`); pending across passes 9–12.
- **Resolved 2026-05-21 at `4f38e1a`** (issue #44). Eyebrow
  reshaped from "boardroom · the starter shelf" to "boardroom
  · about / personas" with /about linked — matches the
  breadcrumb pattern already shipping on /app/settings/api-key
  + /app/settings/delete-account. Header nav unchanged.

### [x] [LOW] /about/personas — shared-opener scaffold framed on the page — addressed at `4edecd9`

- **Pass:** 9 (commit `363aa2a`); pending across passes 9–12.
- **Resolved 2026-05-21 at `4edecd9`** (issue #45). Picked
  option (a) over (b): added one explanatory paragraph
  beneath the lede naming the "You are the [role] at the
  boardroom table." scaffold as deliberate, and pointing
  readers at the voice descriptor above each card as the
  per-persona register. No persona-body edits — runtime
  behavior of the orchestrator is unchanged.

### [x] [MED] /about/personas — lede cast-count drift — addressed at `baa28ea`

- **Pass:** 10 (commit `f21399e`); pending across passes 10–12.
- **Resolved 2026-05-21 at `baa28ea`** (issue #37). Picked
  option 2 (the reframe) over option 1 (bare four→five swap)
  because Secretary is structurally different — auto-injected
  by the cast guard, runs the log, doesn't get dragged the
  same way. New lede: "The starter library is four conferring
  personas plus a Secretary who keeps the log; you drag the
  ones you want onto the table." Closes phase 21's
  anticipated follow-up.

### [x] [LOW] /legal/{privacy,terms} — "Plain version:" labels dropped — addressed at `738b0f3`

- **Pass:** 9 (commit `363aa2a`); pass-11 widened scope.
- **Resolved 2026-05-21 at `738b0f3`** (issue #43). Both
  openers shipped in one edit per the pass-11 instruction
  to prevent voice-asymmetry drift between the pages.

### [MED] general — v2/v3/v4 vision: per-user "Agentic OS" workspace containers
- pass: user-jot (commit f837944368d14555eb1fd6f947375cf56b3137ec)
- viewport: unspecified
- auth_state: anonymous
- category: observation
- observation: Idea for v2: The user will have their own "workspace" for a project (just 1 for now) which will essentially be a container w/ claude code and whatever tools it'll need and with all the skills caked into there. The container itself will contain an "Agentic OS". This way, the conversations can have user-specific memory, progression, and it'll get bet the more the user uses the tool. For v3: We can allow the user to have multiple workspaces that all have their own progress. And finally in v4: We can figure out a way for the multiple workspaces to communicate such that non-domain-specific progress in 1 could help the others.
- evidence: user-spotted at 2026-05-20T21:56:42Z
- suggested_fix: [user has not specified — iterate to determine]
- source: user

### [x] [HIGH] /signin — link mis-route — addressed at `79e1a55`

- **Pass:** 11 (commit `9ed19c6`)
- **Resolved 2026-05-21 at `79e1a55`** (issue #32). One-line
  href change `/about/personas` → `/about` in
  `app/signin/page.tsx`; regression test added to
  `app/signin/__tests__/page.test.tsx` mirroring the
  landing-hero guard from `6f32cb8`.

### [x] [MED] /about/personas — SE monogram collision — addressed at `9bb01c3`

- **Pass:** 11 (commit `9ed19c6`)
- **Resolved 2026-05-21 at `9bb01c3`** (issue #38). The
  underlying algorithm (first-letter-of-each-of-first-two-
  words; for single-word names, first two letters) made the
  collision inevitable — "Skeptical Engineer" → "SE" + bare
  "Secretary" → "SE". Fix added an optional `monogram` field
  on the persona schema (single source of truth per phase 20)
  that overrides the derivation when set; Secretary's
  monogram is now `SC`. While at it, consolidated the
  duplicate `monogramFor` in
  `components/personas/persona-card.tsx` into the shared
  `lib/personas/monogram.ts` helper so the same drift can't
  recur.

### [x] [LOW] / — landing "two to six" cast drift — addressed at `d24e362`

- **Pass:** 11 (commit `9ed19c6`)
- **Resolved 2026-05-21 at `d24e362`** (issue #40). Picked
  option (a): "Drag two to four personas onto the table; a
  Secretary keeps the log." Aligns with the
  /about/personas lede reframe at `baa28ea`. HERO_SUBHEAD
  on the same file still has the "one-word questions" drift
  the /about fix cleaned up at `91090dd` — separate row,
  next critique pass will surface (or /iterate picks up
  directly).

## Done

### [x] [LOW] /signin — unlabeled hidden inputs surface to assistive tech — addressed at `1b04cd5`

- **Original (pass 4, commit `2921fbe`):** Reader's
  accessibility-tree dump showed 4 hidden inputs on
  `/signin`; 3 announced as "[value redacted]" and 1
  unlabeled. Read as missing `aria-hidden` on framework-
  injected CSRF/state fields.
- **Resolution:** Only one of the four hidden inputs is
  app-owned (`<input type="hidden" name="next">`); the
  other three are Next.js's $ACTION-encoded blobs that
  the runtime emits for `<form action={serverAction}>`.
  /iterate added `aria-hidden="true"` + `tabIndex={-1}`
  to the one app-owned input as a defensive belt-and-
  suspenders (HTML spec already requires AT to skip
  type=hidden; this is the redundant explicit guard).
  Framework-injected fields stay as-is — annotating them
  would require monkey-patching Next's form runtime, out
  of /iterate scope. Likely a reader-tool artifact rather
  than a real screen-reader experience bug; a real-AT
  audit (NVDA/VoiceOver) would settle it.
- **Closed by:** /iterate tick at `1b04cd5`.

### [x] [LOW] /try — "Start demo · 3 turns, one persona, no AI calls" crams meta into the button — addressed at `f157f40`

- **Original (pass 2, commit `337e03e`):** Button + meta-text
  adjacency read as one widget; first-time visitors might
  miss the "no AI calls" caveat before clicking.
- **Resolution:** /iterate restructured DemoStartButton from
  a horizontal flex (button + meta-span) to a vertical stack
  (button on its own row, meta line below as eyebrow helper).
  Also dropped the redundant "demo · " prefix from the meta
  line — the button label already says "Start demo".
- **Closed by:** /iterate tick at `f157f40`.

### [x] [LOW] /about/personas — new lede reads as a run-on — addressed at `d86b57a`

- **Original (pass 7, commit `f2d7ad9`):** The pass-5 lede
  rewrite at `dd5c0d9` moved the page from constraint-first
  (pass-5 LOW) to density-of-info (pass-7 LOW). Definition +
  staffing mechanic + library scope + roadmap-gap all
  crammed into two em-dash-and-semicolon sentences.
- **Resolution:** /iterate split at the em-dash. Definition,
  staffing mechanic, and scope-plus-constraint each get
  their own beat. Also dropped "boardroom" from "boardroom
  conversation" — "the conversation" is unambiguous on the
  boardroom personas page.
- **Closed by:** /iterate tick at `d86b57a`. Lede is now in
  its third iteration (pass 2 / pass 5 / pass 7); each
  refinement closed the previous pass's specific complaint.
  Quality plateau likely; further critique on this lede
  hits diminishing returns.

### [x] [LOW] /about — "nexus" appears in the footer with no antecedent — addressed at `35794eb`

- **Original (pass 6, commit `1ba4649`):** After the /about
  closer paragraph at f6338cb was dropped, the footer's
  "boardroom — a nexus build" became the only mention of
  "nexus" any anonymous visitor saw — an unexplained proper
  noun.
- **Resolution:** /iterate took the reader's cleanest option
  and dropped "— a nexus build" from the footer. The product
  name alone is sufficient branding; the README still credits
  nexus for visitors who follow the GitHub link.
- **Closed by:** /iterate tick at `35794eb`.

### [x] [LOW] /try — pitch placeholder contradicts the 100-word cap — addressed at `1e49701`

- **Original (pass 2, commit `337e03e`):** Helper text "Aim for
  1–3 short paragraphs" contradicted the "0 / 100 words" cap;
  three short paragraphs easily exceeded the cap.
- **Resolution:** /iterate dropped the standing helper text
  entirely below the textarea. The counter "X / 100 words"
  already carries the constraint; the redundant
  "1–3 paragraphs" framing was doing more harm than good.
- **Closed by:** /iterate tick at `1e49701` (joint resolution
  with the density finding below).

### [x] [LOW] /try — pitch textbox has three overlapping guidance affordances — addressed at `1e49701`

- **Original (pass 4, commit `2921fbe`):** Pitch input stacked
  placeholder + helper text + counter as three affordances
  under one label; reader called it noisy on 375-wide mobile.
- **Resolution:** Same `1e49701` edit. Normal flow now renders
  one affordance (the counter); the at-cap warning ("At cap —
  trim to continue.") only appears paired with the counter
  when the user actually hits the cap. Two-affordance shape
  becomes one-affordance most of the time.
- **Closed by:** /iterate tick at `1e49701` (joint resolution
  with the placeholder/cap finding above — one helper-row
  rewrite closed both).

### [x] [LOW] /about/personas — lede leads with a constraint — addressed at `dd5c0d9`

- **Original (pass 5, commit `fed25d5`):** Lede opened with
  "A curated v1 library. These four are fixed for v1 —
  you can't add your own yet." — answered "what can't you
  do?" before "what is this?"
- **Resolution:** /iterate rewrote the lede to lead with
  what a persona is: "A persona brings a fixed role and
  voice to the boardroom conversation — you staff a table
  by dragging the ones you want in the discussion. The v1
  library is these four; user-defined personas aren't
  shipped yet." First sentence answers the orientation
  question; constraint moves to a secondary clause. Also
  collapses the lede's "v1" usage to one mention
  (page-level only), aligning with the persona-card
  rewrite at 4babc35.
- **Closed by:** /iterate tick at `dd5c0d9`.

### [x] [MED] /try — locked tiles labeled "Seat N" don't back up the new CTA's "other personas" — addressed at `4fb5663`

- **Original (pass 6, commit `1ba4649`):** Knock-on from the
  098e24f CTA rewrite — the new "other personas need a
  session" promised named identities behind the generic
  "Seat 1…5" locked tiles, which a first-time visitor
  couldn't reconcile.
- **Resolution:** /iterate took the reader's cheaper option
  and renamed the CTA from "other personas" to "other seats
  are locked" — names the actual UI element (the locked
  seats), keeps the sign-in CTA, and removes the "personas"
  word that didn't have a referent. The structural option
  (rename the locked tiles to the real persona names + trim
  to 3 seats) stays available if a future critique pass
  argues for it.
- **Closed by:** /iterate tick at `4fb5663`.

### [x] [MED] /try — Product Lead persona card is rendered twice (shelf + boardroom) — addressed at `f4a5ca3`

- **Original (pass 4, commit `2921fbe`):** Same Product Lead
  card rendered in both the left "Demo shelf" and the
  boardroom region (the staffed seat). Visual + SR duplication.
- **Resolution:** /iterate dropped the `<PersonaCard>` from
  `DemoShelf` entirely. The shelf now carries only the
  context strip (eyebrow + one-line description + sign-in
  pointer); the boardroom-side rendering is the single
  source of persona identity on /try. DemoShelf no longer
  needs the `persona` prop; its colocated test now guards
  against regression (asserts the persona name is absent
  from the shelf).
- **Closed by:** /iterate tick at `f4a5ca3`. The /app
  surface — where unseated personas are common — keeps its
  shelf-side cards as the drag source (unchanged).

### [x] [MED] /about/personas — three different meanings of "v1" on one page — addressed at `4babc35`

- **Original (pass 5, commit `fed25d5`):** Page used "v1" three
  different ways in one scroll: library version, boardroom-
  product version, and the user's product's first version (on
  the Product Lead + Skeptical Engineer cards). A reader saw
  "v1" four times in adjacent reading and asked "whose v1?"
- **Resolution:** /iterate rewrote the in-persona references
  (three on Product Lead, two on Skeptical Engineer) to use
  "first release" for the user's product. "v1" stays at the
  page level for the persona-library version, where it's
  unambiguous.
- **Closed by:** /iterate tick at `4babc35`. Data-layer edit
  only; data:validate continues to pass.

### [x] [MED] /about — "Built with nexus" closer leaks build-process meta — addressed at `f6338cb`

- **Original (pass 5, commit `fed25d5`):** Closing eyebrow on
  /about ("Built with nexus — the autonomous loop that drives
  every commit in this repo.") read as meta-commentary about
  how the product was made, not what it is.
- **Resolution:** /iterate dropped the closing paragraph
  entirely. The footer's "boardroom — a nexus build" credit
  on every page covers the attribution; the in-body sentence
  was redundant and broke the canonical "what is this"
  surface's voice. Same family of leak as the just-closed
  /about/personas "ship via PR" finding.
- **Closed by:** /iterate tick at `f6338cb`. Existing
  about-page test updated to assert the nexus link's absence
  (regression guard).

### [x] [MED] /try — "Want all four?" CTA shifts into pitch-deck register — addressed at `098e24f`

- **Original (pass 2, commit `337e03e`):** Locked-seat CTA drifted
  into upsell register ("Want all four?") mid-page; not the
  bearings voice (a colleague wouldn't phrase it that way).
- **Resolution:** /iterate rewrote the CTA to a flat statement:
  "The other personas need a session — sign in to staff the full
  table." Drops the upsell phrasing.
- **Closed by:** /iterate tick at `098e24f`. Same edit also closes
  the [MED] seat-count contradiction (next entry).

### [x] [MED] /try — seat count (5 locked + 1 staffed) contradicts "Want all four?" — addressed at `098e24f`

- **Original (pass 4, commit `2921fbe`):** Demo boardroom shows
  6 seat positions (5 locked + 1 staffed) but the CTA said "Want
  all four?" — contradictory signals about scale.
- **Resolution:** The same `098e24f` edit removed the number from
  the CTA entirely ("The other personas need a session — sign in
  to staff the full table."), so the 6-seat visual is uncontested.
  Cheaper than trimming the table to 4 seats; respects the
  existing MAX_PERSONAS_SEATED=6 constant.
- **Closed by:** /iterate tick at `098e24f` (joint resolution
  with the voice-register finding above — one CTA edit closed
  both).

### [x] [MED] /try — "Real sessions sign in." elided verb mis-parses — addressed at `fb8a264`

- **Original (pass 5, commit `fed25d5`):** The /try lede ended
  with "Real sessions sign in." — terse to the point of
  mis-parsing as either a command or a label.
- **Resolution:** /iterate rewrote the closing fragment as
  "Full sessions need a sign-in." Keeps the sub-headline's
  terseness, restores the verb, makes the "sign-in is
  required for full sessions" intent unambiguous.
- **Closed by:** /iterate tick at `fb8a264`. No tests
  asserted the old copy; existing /try e2e + unit tests
  continue to pass.

### [x] [MED] /about — raw "/about/personas" path rendered as link text — addressed at `9078238`

- **Original (pass 5, commit `fed25d5`):** The "Try it." section
  on `/about` ended with "The persona library is on
  /about/personas." where /about/personas was both the href
  and the visible link text. Read as a template/markdown
  bleed-through.
- **Resolution:** /iterate replaced the sentence with "The
  persona library has the full v1 set." with "persona
  library" carrying the link. Same destination, real label,
  adds context about what's there.
- **Closed by:** /iterate tick at `9078238`. Existing about-page
  unit test updated to match the new link label.

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
