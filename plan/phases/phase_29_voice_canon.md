# Phase 29 — Voice-canon module + drift-detection test

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

1. **A new `lib/site/voice-canon.ts` module** exports three
   canonical phrases as module-level constants:
   `ANSWER_SHAPE_PHRASE`, `CAST_GROUPING_PHRASE`, and
   `STARTER_LIBRARY_NOUN`. These are the load-bearing
   voice contract pieces that the recent /iterate sweep
   (passes 12–14 + the post-promotion #46 + #51 + #52 + #54
   drift trail) re-discovered four times across parallel
   surfaces.
2. **The three shipped surfaces that carry these phrases
   inline import them from the module instead.** No
   visible-text change — the strings are identical to what
   currently ships.
3. **A new vitest at `lib/site/__tests__/voice-canon.test.ts`**
   scans the shipped source tree for a fixed list of
   _outdated_ canonical-phrase shapes (the ones the recent
   /iterate fixes retired). Any match fails the verify
   gate. Same drift-detection pattern as phase 17's
   `EMPTY_STATE_TEMPLATE_RE` audit test.
4. **No new URLs, no new dependencies, no operator action.**
   The phase converts recurring /iterate work into a
   verify-gate guard; runtime behavior unchanged.

## Prerequisite

Phases 1–28 shipped. The canonical phrases were re-derived
across multiple commits this cycle; phase 28 (#46, #51, #52,
#54) is the latest example. `lib/site/empty-state-copy.ts` +
`lib/site/__tests__/empty-state-audit.test.tsx` provide the
shape this phase mirrors.

## Dependencies (operator action required for runtime)

- **None.** Pure code change; tests run in the existing
  verify gate.

## Routes / endpoints (locked from bearings)

**No new URLs.** No edits to the URL contract.

## Library / helpers (new code)

**Created:**

- `lib/site/voice-canon.ts` — three module-level exports
  plus an `OUTDATED_VOICE_SHAPES` array used by the drift
  test.
  - `ANSWER_SHAPE_PHRASE` —
    `"one-word or one-sentence clarifying questions"`.
    The clarify-phase user-answer constraint, canonical
    after #34 (`91090dd`) + #46 (`4de29b4`) + #51
    (`cd94020`).
  - `CAST_GROUPING_PHRASE` —
    `"four conferring personas plus a Secretary who keeps the log"`.
    The post-phase-21 cast framing, canonical after #37
    (`baa28ea`).
  - `STARTER_LIBRARY_NOUN` — `"starter library"`. The
    "v1" antecedent replacement, canonical after #35
    (`163787c`).
  - `OUTDATED_VOICE_SHAPES` —
    `readonly { phrase: string; retiredAt: string; reason: string }[]`
    listing every retired phrasing the drift test scans
    for. Entries (in order, each with the commit hash that
    retired it):
    - `"one-word questions at the checkpoints"` — retired
      `91090dd`; ANSWER_SHAPE_PHRASE supersedes.
    - `"the v1 library"` — retired `163787c`;
      STARTER_LIBRARY_NOUN supersedes.
    - `"these four"` (in lede / cast context) — retired
      `baa28ea`; CAST_GROUPING_PHRASE supersedes.
    - `"demo · locked"` — retired `7b7d58e`; gated-tile
      label.
    - `"sign in to seat"` (as visible-badge text) —
      retired `d7a3054`; gated-tile aria-label retained
      the cue.
    - `"cast guard"` (in user-facing copy) — retired
      `b2b9de9`; jargon.
    - `"Plain version:"` — retired `738b0f3`; primed a
      legal counterpart neither page provides.
    - `"Drag two to six personas"` — retired `d24e362`;
      contradicts the post-phase-21 cast.
    - `"board-room table"` (in user-facing copy) —
      retired `a24cfaf`; one-word "boardroom" is the
      branded form.
- `lib/site/__tests__/voice-canon.test.ts` — vitest spec.
  Reads each shipped source file under `app/`,
  `components/`, `personas/`, and `templates/` via
  `fs.readFileSync` (sync I/O; the EMPTY_STATE pattern
  uses the same approach via component rendering — this
  one prefers source-scan because the drift can live in
  non-rendering source like metadata constants or design
  exports). For each `OUTDATED_VOICE_SHAPES` entry,
  asserts the phrase does **not** appear in any scanned
  file. Pinning the canon: also asserts each canonical
  phrase appears at least once across the shipped tree
  (sanity check that the refactor didn't strip every
  usage by accident).
  - Excludes from the scan: `**/__tests__/**`,
    `plan/`, `node_modules/`, the voice-canon.ts module
    itself (it intentionally names the outdated phrases
    in `OUTDATED_VOICE_SHAPES`).
  - Excludes from the canon-appears-once check: design/
    compositions + `personas/secretary.md` summary (the
    secretary persona's summary is metadata that doesn't
    use the cast-grouping phrasing).
- `lib/site/__tests__/voice-canon-import.test.ts` —
  separate spec asserting that each of the three
  documented call-sites
  (`app/layout.tsx`, `app/about/page.tsx`,
  `components/site/landing-hero.tsx`) imports the
  relevant constant. Lighter assertion than "every file
  must import"; documents the surfaces the phase
  refactored.

**Edited:**

- `app/layout.tsx` — `ROOT_DESCRIPTION` template literal
  uses `${ANSWER_SHAPE_PHRASE}` for the canonical clause.
- `app/about/page.tsx` — about lede uses
  `${ANSWER_SHAPE_PHRASE}` for the clarify-questions clause.
- `components/site/landing-hero.tsx` — `HERO_SUBHEAD`
  template literal uses `${ANSWER_SHAPE_PHRASE}`.
- `app/about/personas/page.tsx` — lede uses
  `${CAST_GROUPING_PHRASE}` and `${STARTER_LIBRARY_NOUN}`.
- `app/about/page.tsx` — "What it isn't" line uses
  `${STARTER_LIBRARY_NOUN}`.

**No edits** to the persona-card / demo / signin /
legal pages — none of the three canonical phrases live
there inline. The drift test catches any future
inlining.

## Constants

All three live in `lib/site/voice-canon.ts`. No constants
in the test file.

## Cross-links

**In** (verify still wired):
- The three constants are imported by the four edited
  components.

**Out** (ship):
- `lib/site/voice-canon.ts` module.
- The drift-detection vitest at
  `lib/site/__tests__/voice-canon.test.ts`.
- The import-presence vitest at
  `lib/site/__tests__/voice-canon-import.test.ts`.

**Retro-fit:**
- 4 component edits (above). No visible-text change.

## SEO / metadata

N/A. ROOT_DESCRIPTION renders the same string after the
template-literal swap.

## Hero / body / sub-section composition

N/A. No layout change.

## Empty / loading / error states

N/A.

## Decisions made upfront — DO NOT ASK

- **Three constants, not more.** The cast-grouping phrase
  appears in one place today, but it's load-bearing for
  future cast-related copy (any new persona-library
  surface, new audit findings, /try shelf changes); pin
  it now. The "starter library" noun appears in two; pin.
  The answer-shape phrase appears in three; pin. Other
  shorter phrases ("sign in to staff the table",
  "always at the table") are surface-specific and don't
  warrant centralizing yet.
- **Source-scan over rendered-output assertion.** Phase
  17's EMPTY_STATE pattern renders the component +
  checks the text. That works for empty states (small,
  bounded). The voice-canon drift can live in
  ROOT_DESCRIPTION (metadata, never rendered as a
  component the test can drive), in design exports, in
  persona-body markdown, in template JSON. A
  `fs.readFileSync` source scan catches all of those
  uniformly without per-surface mock plumbing.
- **`OUTDATED_VOICE_SHAPES` is the canonical retirement
  ledger.** Adding a new retired phrasing later is one
  line (string + commit hash + reason). The test loops
  over the array; new entries are gated automatically.
- **The canon-import vitest is separate from the drift
  vitest.** Drift = source-scan negative assertion;
  import-presence = positive assertion. Splitting keeps
  failure messages discoverable when one breaks.
- **`personas/secretary.md` and the design/ tree are
  excluded from the canon-appears-once check.** Both are
  out-of-band sources that legitimately don't use the
  canonical wording (the persona summary speaks in
  Secretary's own voice; design/compositions are
  prototypes that pre-date phase 28's reframe). The
  drift-on-old-shapes check still applies to
  personas/secretary.md but doesn't apply to design/
  (out of v1 scope; design exports are sketches, not
  shipped surfaces).
- **Test runs `fs.readFileSync` synchronously in the
  describe-level setup.** Reads are fast (a few dozen
  files); the test runs once per verify and doesn't
  need parallelism. Same approach as
  `lib/site/__tests__/motion-tokens.test.ts` which reads
  `design/tokens.css`.
- **No `templates/pitch-to-spec.json` edit.** The JSON
  description carries `"Every question must accept a
  1-word or 1-sentence answer."` — semantically the
  same as ANSWER_SHAPE_PHRASE but a different shape
  (the template constraint is the source of authority;
  voice-canon's phrase is the user-facing prose). Both
  are correct in their contexts; the drift test
  excludes the template JSON file from the canonical-
  phrase check.
- **No grep for `"locked"` standalone** — too broad
  (CSS classes, ARIA states, the cursor-not-allowed
  pattern elsewhere). The drift entry is specifically
  the literal `"demo · locked"` token.
- **`OUTDATED_VOICE_SHAPES` entries match
  case-sensitively.** Future drift like "Plain Version:"
  with different capitalization would slip; acceptable
  trade-off given that copy churn happens at sentence-
  case granularity in this codebase.
- **The brief intentionally doesn't ship a "voice-canon
  contributor guide."** The module's docstring + the
  test file's docstring carry the contract. The pattern
  is small and self-evident.

## Mobile reflow / responsive

N/A.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/site/voice-canon.ts` | none — pure exports | — |
| `lib/site/__tests__/voice-canon.test.ts` | itself: scans `app/` + `components/` + `personas/` for outdated shapes; asserts each canonical phrase appears ≥ 1 time outside the canon module | — |
| `lib/site/__tests__/voice-canon-import.test.ts` | itself: asserts each of the four refactored files imports the right constant | — |
| 4 refactored components | existing tests on those files still pass (no visible-text change) | — |

## Hermetic e2e registration

No new hermetic e2e. The drift gate is a unit-test source
scan, not a render check.

## Verify gate

```bash
pnpm verify
```

Runs typecheck → test:run → data:validate → build → e2e.
**Each leg is a hard gate.** The drift test runs in the
`test:run` step.

## Commit body template

```
feat: voice-canon module + drift-detection test — phase 29

- lib/site/voice-canon.ts: ANSWER_SHAPE_PHRASE (the clarify-
  question constraint, "one-word or one-sentence clarifying
  questions"); CAST_GROUPING_PHRASE (the post-phase-21
  cast framing, "four conferring personas plus a Secretary
  who keeps the log"); STARTER_LIBRARY_NOUN ("starter
  library"). Plus OUTDATED_VOICE_SHAPES — the retirement
  ledger of nine retired phrasings + the commit that
  retired each.
- lib/site/__tests__/voice-canon.test.ts: source-scans
  app/ + components/ + personas/ for any retired phrasing;
  asserts each canonical phrase appears at least once
  outside the canon module.
- lib/site/__tests__/voice-canon-import.test.ts: asserts
  app/layout.tsx, app/about/page.tsx, components/site/
  landing-hero.tsx, and app/about/personas/page.tsx import
  the right constant. Split from the drift spec so
  failure messages stay discoverable.
- app/layout.tsx + app/about/page.tsx + components/site/
  landing-hero.tsx: ROOT_DESCRIPTION / about lede /
  HERO_SUBHEAD now build via template literal with
  ${ANSWER_SHAPE_PHRASE}.
- app/about/personas/page.tsx: lede uses ${CAST_GROUPING_PHRASE}
  + ${STARTER_LIBRARY_NOUN}.
- app/about/page.tsx: "What it isn't" line uses
  ${STARTER_LIBRARY_NOUN}.

Decisions:
- Three canon constants only (not a wider extraction).
  Surface-specific shorter phrasings stay inline; the
  drift test catches any future inlining of the three.
- Source-scan over rendered-output for the drift gate.
  ROOT_DESCRIPTION is metadata that the EMPTY_STATE
  pattern can't reach; fs.readFileSync covers it uniformly.
- OUTDATED_VOICE_SHAPES carries the retirement ledger;
  adding a new entry is one line + a commit hash.
- Drift vitest split from import-presence vitest so
  failure messages stay discoverable.
- personas/secretary.md summary + design/ tree excluded
  from the canon-appears-once positive check; drift-on-
  old-shapes scan still applies to personas/ but not
  design/.
- No template JSON edit; the template carries the
  authority constraint, voice-canon carries the
  user-facing prose — both correct in their contexts.

No visible-text change. Runtime behavior unchanged. Future
voice drift on these three phrases now fails the verify
gate rather than waiting for /critique to re-discover it.

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 29's `[ ]` → `[x]` in
`plan/steps/01_build_plan.md`, append commit hash.

No `[operator]` AUDIT row (no operator action required).

## Follow-ups (out of scope this phase)

- **Per-surface OG title checks.** ROOT_TITLE was
  reshaped at `cd94020`; if future titles drift, a
  separate constants module is the next step. Not folded
  in here because ROOT_TITLE has only one canonical
  form today.
- **Persona-body voice contract.** Lead persona bodies
  carry the
  `CLARIFY-QUESTION-FORMAT.md` reminder (phase 28); a
  future drift gate could assert that reminder is
  present and uses canonical phrasing. Out of scope
  here.
- **Design-tree drift.** `design/compositions/` carries
  old-shape strings as sketches. A separate audit could
  align design exports with the post-phase-28 voice
  before the next design-session sweep. Not blocking
  shipped surface correctness.
- **`templates/pitch-to-spec.json` description vs.
  voice-canon.** Currently semantically aligned but
  worded differently. Composing them (or asserting one
  is derived from the other) is a follow-up only worth
  doing if the template description changes.
- **`OUTDATED_VOICE_SHAPES` decay policy.** Entries
  accumulate indefinitely. If the list grows past ~30,
  a "retire from the gate after N months" cleanup is
  worth considering — but at 9 entries today, no action
  needed.
