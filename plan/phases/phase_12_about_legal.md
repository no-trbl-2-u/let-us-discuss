# Phase 12 — About + legal

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

Three new public, anonymous-reachable pages land per the
bearings URL contract:

1. **`/about`** — what boardroom is and isn't. Voice-matched
   intro, three-note "what you'll spend / what you'll get"
   block, "Built with nexus" footnote that links to the repo.
2. **`/legal/privacy`** — data retention, what's persisted,
   what's deleted on account close, IP-hash window. Plain.
3. **`/legal/terms`** — acceptable use (moderation refusal +
   account quota), no-warranty boilerplate, jurisdiction line.
   Plain.

Closes the standing HIGH critique finding (`/legal/privacy`
+ `/legal/terms` 404 across the whole site — footer-linked
everywhere, including the 404 page itself) and the MED
critique finding (landing CTA "What is a boardroom session?"
mis-routed to `/about/personas` instead of `/about`).

## Prerequisite

Phases 1–11 shipped. The footer (`components/site/footer.tsx`)
already links to `/legal/privacy` and `/legal/terms`; this
phase makes those links resolve.

## Dependencies (operator action required for runtime)

None. Static content; no env, no DB, no API.

## Routes / endpoints (locked from bearings)

- `/about` — `app/about/page.tsx`. Server component; static.
- `/legal/privacy` — `app/legal/privacy/page.tsx`. Server
  component; static.
- `/legal/terms` — `app/legal/terms/page.tsx`. Server
  component; static.

No new API routes, no dynamic flags. Each page declares no
`dynamic` export — defaults to static generation, which is
what we want for these surfaces.

## Library / helpers (new code)

None. Pages compose existing `design/primitives/*` directly,
the same way `app/about/personas/page.tsx` does.

## Components / handlers (new files under `components/legal/`)

One small shared composition for the two legal pages, because
they share frame (eyebrow + H1 + section list + "last updated"
footnote). The `/about` page composes inline (different shape).

- `components/legal/legal-section.tsx` — typed `({ id, title,
  children })` wrapper that renders an `<h2>` with anchor +
  prose container. Used by both legal pages.
- `components/legal/__tests__/legal-section.test.tsx` —
  renders heading + body + anchor id.

That's it. No section-list component, no TOC component, no
shared layout — those add weight without value for two pages.

## Cross-links

**In (verify):**

- `components/site/footer.tsx` already links to
  `/legal/privacy` + `/legal/terms`. After this phase, both
  resolve 200.
- `app/not-found.tsx` renders the same footer — after this
  phase, the infinite-404-loop critique finding is closed.

**Out (ship):**

- `/about` links to: `/try`, `/signin`, `/about/personas`
  (already shipped), and the project repo (for "built with
  nexus" — see Decisions).
- `/legal/privacy` links to: `/about` (for context) and a
  contact line ("to request account closure / data
  deletion, email <CONTACT_EMAIL>" — see Decisions).
- `/legal/terms` links to: `/legal/privacy`.

**Retro-fit (in the same phase commit):**

- `components/site/landing-hero.tsx` L50 — the secondary CTA
  currently reads `<Link href="/about/personas">What is a
  boardroom session?</Link>`. Retarget to `/about` (the
  question's actual answer page). The persona shelf remains
  reachable via the footer's `Personas` link, so no
  navigation regression.

## SEO / metadata

Per-page `export const metadata: Metadata = { title, description }`.

- `/about` → `title: 'About boardroom — boardroom'`,
  `description: 'What boardroom is, what it isn\'t, and who
  it\'s for.'`
- `/legal/privacy` → `title: 'Privacy — boardroom'`,
  `description: 'What boardroom stores, what gets deleted,
  and how to close your account.'`
- `/legal/terms` → `title: 'Terms — boardroom'`,
  `description: 'Acceptable use, moderation policy, and
  account-quota terms for boardroom.'`

No `robots: noindex` on these pages — they're the public
documentation surfaces and benefit from being indexable.

JSON-LD: skip. These aren't list pages or articles in any
crawler-useful schema sense; the metadata block above is
enough.

## Hero / body / sub-section composition

### /about — body locked

Single column, max-width `760px`, same outer shell as
`/about/personas`. Sections:

- Eyebrow: `boardroom  ·  about`.
- H1: `About boardroom.`
- Lede paragraph (locked copy):

  > Boardroom turns a loose pitch into a usable spec by
  > running a short, opinionated conversation between AI
  > personas you staff onto a board-room table. You drag
  > personas, hand over a pitch, and answer one-word
  > questions at the checkpoints. The personas do the
  > thinking.

- H2 `Who it's for.`
  > Solo builders, indie devs, and early-stage PMs who have
  > an idea but no spec. If you've bounced off hand-rolling
  > prompts and personas in a single chat thread, this is
  > the shortcut.

- H2 `What you get.`
  > Three artifacts at the end of every session: a
  > `spec.md`, a one-page exec summary, and a list of
  > out-of-scope call-outs the personas surfaced but
  > deliberately deferred. Download them as Markdown.

- H2 `What it isn't.`
  > Boardroom isn't a generic chat. It isn't a place to
  > author personas or templates — the v1 library is
  > curated. It isn't a multi-user surface; sessions are
  > single-user only.

- H2 `Try it.`
  > [Run an anonymous demo](/try) — no sign-in needed.
  > [Sign in](/signin) to run full sessions and keep your
  > artifacts. The persona library is on
  > [/about/personas](/about/personas).

- Footnote (eyebrow style):
  > Built with [nexus](https://github.com/no-trbl-2-u/let-us-discuss)
  > — the autonomous loop that drives every commit in this
  > repo. See the README for how the build works.

### /legal/privacy — body locked

Single column, max-width `760px`. Sections via
`<LegalSection id="..." title="...">...</LegalSection>`.

- Eyebrow: `boardroom  ·  privacy`.
- H1: `Privacy.`
- Lede:
  > Plain version: we keep your sessions while your account
  > is open and delete them when you close it.

- `<LegalSection id="what-we-store" title="What we store">`
  > Your email (for magic-link sign-in), the pitch you
  > submit for each session, the persona-conferring
  > transcript, and the three artifacts the session
  > produces. Token-usage and cost-estimate rows for each
  > session. Moderation-flag rows on any turn the AI
  > pre-filter rejects (with the offending text, the
  > verdict, and the timestamp).

- `<LegalSection id="what-we-dont-store" title="What we don't store">`
  > No tracking pixels, no third-party analytics, no
  > advertising identifiers. We do not sell your data; we
  > don't sell anything.

- `<LegalSection id="ip-addresses" title="IP addresses">`
  > For abuse-prevention only: we keep a one-way hash of
  > the IP address attached to each session for 30 days,
  > then delete it. The raw IP is never stored.

- `<LegalSection id="retention" title="Retention and deletion">`
  > Sessions and artifacts are kept indefinitely while your
  > account is active so you can re-download them. When you
  > close your account, every session, transcript,
  > artifact, moderation-flag row, and quota counter
  > belonging to that account is deleted. An account-close
  > affordance lives in your account settings (or email
  > <CONTACT_EMAIL> to request it manually).

- `<LegalSection id="moderation" title="Moderation">`
  > Every pitch you submit and every persona reply is run
  > through OpenAI's omni-moderation endpoint before it's
  > shown back or saved. If it trips, the session halts
  > with a polite refusal and we keep a row of what
  > tripped, the verdict, and the timestamp — see
  > [Terms](/legal/terms) for what use is in-bounds.

- `<LegalSection id="cookies" title="Cookies">`
  > One first-party cookie carries your Supabase session
  > after sign-in. No third-party cookies, no analytics
  > cookies.

- `<LegalSection id="changes" title="Changes">`
  > Material changes to this page get an updated date
  > below. The current page is always the live policy.

- Footnote: `Last updated: 2026-05-18`.

### /legal/terms — body locked

Single column, max-width `760px`. Same `<LegalSection>` shape.

- Eyebrow: `boardroom  ·  terms`.
- H1: `Terms of use.`
- Lede:
  > Plain version: you bring a pitch, the AI personas
  > confer on it, you get three files. Don't try to grind
  > the AI for something it refuses. Quotas exist.

- `<LegalSection id="who-can-use" title="Who can use boardroom">`
  > Anyone can read these pages. Anyone with a working
  > email can request a magic-link sign-in. The product is
  > offered as-is to individual users; no enterprise
  > agreements, no team accounts in v1.

- `<LegalSection id="acceptable-use" title="Acceptable use">`
  > Use boardroom to spec real product ideas. Don't use it
  > to generate prohibited content — the AI pre-filter will
  > refuse, but please don't waste your time or ours
  > probing it. Repeated abuse can lead to account
  > closure.

- `<LegalSection id="quotas" title="Quotas and limits">`
  > Signed-in accounts get **10 sessions per day**.
  > Anonymous demos (`/try`) are limited to **3 per IP per
  > day**. Every session has a **60,000-token cap** — if
  > the personas haven't converged by then, the session
  > wraps gracefully and you keep whatever artifacts
  > exist. These numbers may move in future releases; the
  > current numbers are the live ones.

- `<LegalSection id="moderation" title="Moderation refusals">`
  > Inputs and persona outputs run through OpenAI's
  > omni-moderation endpoint. Suspect verdicts halt the
  > session with a polite refusal. We log what tripped
  > (see [Privacy](/legal/privacy#moderation)). We do not
  > publish a list of disallowed topics — OpenAI's
  > moderation taxonomy is the authority.

- `<LegalSection id="no-warranty" title="No warranty">`
  > Boardroom's output is AI-generated and may be wrong,
  > inconsistent, or context-blind. Treat it as a draft.
  > The service is provided "as is" without warranty of
  > any kind.

- `<LegalSection id="closure" title="Account closure">`
  > You can close your account at any time; see
  > [Privacy](/legal/privacy#retention) for what gets
  > deleted. We may close an account that repeatedly trips
  > moderation refusals or attempts to bypass quota.

- `<LegalSection id="contact" title="Contact">`
  > Questions: <CONTACT_EMAIL>.

- Footnote: `Last updated: 2026-05-18`.

## Empty / loading / error states

These pages have no dynamic state — no empty / loading /
error variants to render.

## Decisions made upfront — DO NOT ASK

- **`<CONTACT_EMAIL>` placeholder is `hello@let-us-discuss.ai`**
  — derived from the production host
  `let-us-discuss-ai.vercel.app`. Used as a literal string in
  the copy above (no `mailto:` link wrapper; reads cleanly
  in serif body text and the user can copy-paste). If the
  operator wants a different contact address, edit the two
  pages post-ship — no DB, no rebuild surprise.
- **"Built with nexus" links to the boardroom repo, not a
  separate nexus URL.** Reason: `README.md` references nexus
  as a local sibling directory (`../nexus`); there is no
  public nexus URL the brief can confidently link. The repo
  README is the canonical "how this was built" surface and
  is hosted on GitHub. The link target is the repo root.
  If a public nexus repo lands later, /iterate retargets the
  link.
- **No account-close affordance is shipped in this phase.**
  The privacy copy promises "an account-close affordance
  lives in your account settings (or email to request it
  manually)." That's an honest promise: the email path
  works today; the settings UI lands as a follow-up phase
  (currently filed as `[score 5.0] Account deletion + data
  wipe` in `plan/PHASE_CANDIDATES.md`). The email-path
  fallback keeps the policy truthful in the meantime.
- **Account-close phase is NOT promoted into this phase.**
  Per the candidate's own "best slot" note (phase 12b
  immediately after phase 12), it's the next thing to
  discuss in oversight — but bundling it here doubles the
  phase scope (settings route + cascade-delete + Supabase
  user-delete API), which violates "small, focused
  phases."
- **Landing-CTA retarget is in scope.** Phase 12 ships
  `/about` — the question "What is a boardroom session?"
  finally has a real answer page. The retro-fit is one
  prop change in `components/site/landing-hero.tsx`. Cross-
  link retrofit policy (`skills/ship-a-phase.md` §8)
  authorizes this in the same commit.
- **`/about/personas` "Persona changes ship via PR" leak
  (MED critique finding from pass 2) is NOT in scope.**
  Different file, different page, different commit. The
  copy fix lives with `/iterate` — that's exactly the kind
  of single-sentence change /iterate is designed for. Don't
  drag it into a phase commit.
- **The 404 page is NOT in scope.** The pending MED
  finding ("404 page is bare and inherits the landing
  title") will benefit from `/about` and `/legal/*` being
  reachable — the infinite-loop concern goes away — but
  the bare-title + missing-back-link items are independent.
  Phase 17 (polish) owns the 404 page per
  `plan/steps/01_build_plan.md` L77. The phase-12 commit
  body notes this as a known follow-up.
- **No `dynamic` export on the page modules.** Static
  generation is the right default for stable copy. If
  copy gets edited, the next build picks it up.
- **`<LegalSection>` lives under `components/legal/`,
  not `design/primitives/`.** It's a page-level
  composition, not a primitive (per
  `design/INDEX.md` distinction: primitives are
  cross-page, compositions are page-level). The two
  legal pages are siblings; one file in `components/legal/`
  is the natural home.
- **Anchor ids on `<LegalSection>` are the literal `id`
  prop.** No slugification, no helper. Reason: hand-picked
  ids stay stable across copy edits in a way that
  auto-slugged titles do not, and the privacy copy already
  cross-links via `#moderation` and `#retention`.
- **No table of contents for either legal page.** Both
  pages have ≤8 sections of ≤4 paragraphs each — a TOC
  adds friction without payoff at this length. If pages
  grow past 12 sections, /iterate can add a `<TableOfContents>`
  primitive then.

## Mobile reflow / responsive

All three pages use the existing `mx-auto max-w-[760px]
px-[var(--space-4)] sm:px-[var(--space-5)] md:px-[var(--space-7)]
py-[var(--space-7)] md:py-[var(--space-8)]` shell from
`/about/personas`. Single-column on every viewport, no
reflow logic needed. Tailwind defaults handle font scaling
at the 375px viewport per design tokens.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `components/legal/legal-section.tsx` | renders heading with anchor id; renders body children; class composition stable | — |
| `app/about/page.tsx` | renders H1 + lede + each H2 (via heading-text grep); footnote contains the nexus link | — |
| `app/legal/privacy/page.tsx` | renders H1; renders each `<LegalSection>` id (snapshot of section ids); last-updated date string present | — |
| `app/legal/terms/page.tsx` | renders H1; renders each `<LegalSection>` id; last-updated date string present | — |
| `components/site/landing-hero.tsx` | secondary CTA `href === '/about'` (retro-fit assertion) | — |
| Footer 404-loop closure | — | `e2e/legal-routes-resolve.spec.ts` (new): GET `/legal/privacy` returns 200 + body contains "Privacy"; GET `/legal/terms` returns 200 + body contains "Terms"; GET `/about` returns 200 + body contains "About boardroom" |

## Hermetic e2e registration

`e2e/legal-routes-resolve.spec.ts` (new):

- `/legal/privacy` returns 200, body contains `Privacy.`
- `/legal/terms` returns 200, body contains `Terms of use.`
- `/about` returns 200, body contains `About boardroom.`
- Anonymous reachable; no auth needed.

No new auth-gated specs; the existing auth spec gate is
untouched.

## Verify gate

```bash
pnpm verify
```

No new dependencies, no migration, no new env vars.

## Commit body template

```
feat: about + legal pages — phase 12

- app/about/page.tsx: what boardroom is and isn't, who it's
  for, what you get, what it isn't, CTAs to /try + /signin,
  "built with nexus" footnote linking the repo
- app/legal/privacy/page.tsx: what we store / don't store,
  IP-hash 30d retention, account-close deletion, moderation
  audit, cookies, last-updated date
- app/legal/terms/page.tsx: who can use, acceptable use,
  quotas (10 sessions/day, 3 demos/IP/day, 60k tokens/session),
  moderation refusals, no-warranty, account closure, contact
- components/legal/legal-section.tsx: small wrapper for the
  two legal pages' section blocks (id anchor + h2 + prose
  container). Tests colocated
- components/site/landing-hero.tsx: retro-fit secondary CTA
  href /about/personas → /about (the question's real answer)
- e2e/legal-routes-resolve.spec.ts: anonymous GET /about +
  /legal/* returns 200 with expected body text — closes the
  HIGH critique finding on /legal/* 404 loop

Decisions:
- Contact email is hello@let-us-discuss.ai (derived from prod host)
- "Built with nexus" links to the project repo (nexus is local-only)
- No account-close UI in this phase (filed as candidate;
  privacy copy falls back to email-to-request)
- /about/personas "ship via PR" copy leak (MED critique) is
  /iterate scope, not phase 12 scope
- 404 page polish is phase 17 scope; this phase closes the
  infinite-loop concern by making the linked pages resolve
- No TOC on legal pages — too short to justify

Closes #<phase-mirror-issue-number>
```

## DoD

Flip Phase 12's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

After ship, the following critique findings can be marked
[x] in `plan/CRITIQUE.md` (or moved to `## Done`):

- `[HIGH] /legal/privacy + /legal/terms — footer links 404
  across the whole site` (pass 4) — closed by this phase.
- `[MED] / — "What is a boardroom session?" link mis-routed
  to /about/personas` (pass 2) — closed by the retro-fit.

The next /critique pass will confirm.

## Follow-ups (out of scope this phase)

- **Account-close UI** — see `plan/PHASE_CANDIDATES.md`
  `[score 5.0] Account deletion + data wipe`. Should be the
  next promoted candidate (suggested phase 12b).
- **`/about/personas` copy leak** — `/iterate` fix for the
  "Persona changes ship via PR" sentence (MED critique
  pass 2).
- **404 page polish** — phase 17 scope per the build plan.
- **Contact-email replacement** — if `hello@let-us-discuss.ai`
  is wrong, the operator edits the two literal strings.
