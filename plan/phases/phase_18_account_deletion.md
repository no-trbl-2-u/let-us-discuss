# Phase 18 — Account deletion + data wipe

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body.

## Outcome

A signed-in user can close their account end-to-end from
the app. After confirming, every database row tied to their
identity is deleted in a single FK-cascade, the auth session
is invalidated, and they land on `/` as an anonymous visitor.
Closes the standing privacy-policy promise from phase 12.

Routes ship:

1. **`/app/settings`** — a small settings landing that exists
   to host the delete-account affordance. One section now;
   v1 doesn't ship other settings, but the route is the
   natural home if future controls land.
2. **`/app/settings/delete-account`** — confirm-then-delete
   page. Server-renders the warning copy, requires the user
   to type `delete` into a field before the submit enables
   (defense-in-depth against accidental clicks). Submits to
   a server action.

## Prerequisite

Phases 1–17 shipped. The schema is already cascade-safe:
- `sessions.user_id` → `auth.users(id) on delete cascade`
  (phase 7 migration L6).
- `turns.session_id` → `sessions(id) on delete cascade`.
- `artifacts.session_id` → `sessions(id) on delete cascade`.
- `flag_audit.session_id` → `sessions(id) on delete cascade`
  (phase 8 migration L8).

A single `supabase.auth.admin.deleteUser(userId)` call walks
the chain. No new migration.

## Dependencies (operator action required for runtime)

`SUPABASE_SERVICE_ROLE_KEY` is already populated (phase 2
runbook). No new env vars; no migration; no third-party
dependency.

## Routes / endpoints (locked from bearings)

Two new routes. **Both will be added to the bearings URL
contract** in this phase's commit so the URL-contract walker
(phase 13) covers them.

- `/app/settings` — Next App Router server component
  (`app/app/settings/page.tsx`). Loads via `requireUser()`;
  renders a single section linking to `/app/settings/delete-account`.
- `/app/settings/delete-account` — Server component
  (`app/app/settings/delete-account/page.tsx`). Loads via
  `requireUser()`; renders the confirmation form. Submits to
  `deleteAccountAction`.

No new API routes; deletion is a server action.

## Library / helpers (new code)

- `lib/auth/actions.ts` — extend with:
  - `deleteAccountAction(formData: FormData): Promise<DeleteAccountResult>` —
    validates the confirmation field, calls
    `supabase.auth.admin.deleteUser(userId)` via the service
    client, signs the user out, redirects to `/?account=deleted`.
  - `DeleteAccountResult` discriminated union with `ok: true`
    redirect / `ok: false` reason.
- `lib/auth/__tests__/actions.test.ts` — extend with
  three new cases: empty confirmation; wrong confirmation
  text; happy path (admin delete called with the authed user's
  id, then signOut).
- `lib/auth/route-table.ts` (if it exists; otherwise the
  middleware) — add `/app/settings` and
  `/app/settings/delete-account` to the authed-routes
  list. (Both are under `/app/*` so the existing wildcard
  middleware match already covers them.)
- `plan/bearings.md` — append two new lines to the URL
  contract block (matches phase 13's sync-test
  contract, so the vitest sync-check stays green).

## Components / handlers (new files)

- `components/settings/delete-account-form.tsx` —
  `'use client'`. Renders the confirmation field +
  submit button; the button is disabled until the field
  exactly matches `delete` (lowercase, no padding). Uses
  the server action via the `useFormState` /
  `useActionState` pattern (whichever this Next 15 build
  is already using elsewhere — check `app/signin/sign-in-form.tsx`).
- `components/settings/settings-section.tsx` — small
  wrapper for the future-proofed settings page: H2 + body
  + optional CTA row. Tests colocated.
- `components/settings/__tests__/delete-account-form.test.tsx`
  — disabled-until-confirmation logic; calls the action on
  submit.

## Cross-links

**In (verify):**

- `components/site/header.tsx` (or equivalent) — add a
  link to `/app/settings` from the authed nav. **In scope
  for this phase** so the surface is reachable; without it
  the new routes are orphaned.

**Out (ship):**

- `/app/settings` links to `/app/settings/delete-account`
  (and back to `/app`).
- `/app/settings/delete-account` links back to
  `/app/settings`.
- Successful deletion redirects to `/?account=deleted`. The
  landing page reads the query param and renders a small
  ephemeral banner ("Your account was deleted.") that
  dismisses on next navigation. **Banner is in scope.**

**Retro-fit:**

- `components/site/footer.tsx` — no change. The footer
  doesn't link to settings.
- `/legal/privacy` — its "Retention and deletion" section
  already names the settings affordance ("An account-close
  affordance lives in your account settings (or email ...
  to request it manually)") — that copy was forward-looking
  and is now accurate without edits. **No retro-fit.**

## SEO / metadata

- `/app/settings` → `title: 'Settings — boardroom'`,
  `robots: { index: false, follow: false }`. Authed-only;
  noindex.
- `/app/settings/delete-account` → `title: 'Delete account — boardroom'`,
  `robots: { index: false, follow: false }`.

## Hero / body / sub-section composition

### `/app/settings`

Eyebrow `boardroom · settings`. H1 `Settings.` Body: one
`<SettingsSection>`:

- H2: `Account`.
- Body: `Close your account and delete every session,
  transcript, and artifact tied to it.`
- CTA: `<Link href="/app/settings/delete-account">Delete
  account →</Link>`.

That's the whole page.

### `/app/settings/delete-account`

Eyebrow `boardroom · settings / delete account`. H1
`Delete account.` Body (locked):

- Paragraph: `Closing your account permanently deletes every
  session, transcript, and downloadable artifact tied to it,
  along with the moderation-flag log and your daily session
  quota counter. This is immediate and cannot be undone.`
- Paragraph: `Your email is removed from the boardroom
  account table; you can sign up again later with the same
  address, but you won't see any of the sessions above.`
- `<DeleteAccountForm />` — confirmation field (label: `Type
  delete to confirm.`) + accent CTA `Delete my account` +
  back link to `/app/settings`.

Locked copy on success redirect: landing-page banner reads
`Your account was deleted.` in the muted-ink monospace
register (matches the existing one-line landing-page
ephemeral pattern; if no such pattern exists, this phase
ships the first one — a small client component reading
`useSearchParams` on `/`).

## Empty / loading / error states

- **Not authenticated:** middleware redirects to
  `/signin?next=/app/settings` (or `/app/settings/delete-account`).
  No change to existing middleware.
- **Confirmation field empty / wrong:** submit button stays
  disabled (client-side enforcement). The server action also
  re-validates and returns `{ ok: false, error: 'Type
  delete to confirm.' }`.
- **Admin delete fails (rare; auth service down):**
  redirect back to `/app/settings/delete-account?error=...`
  rendering the error in the in-voice mono red-tinted
  paragraph used by `/signin?error=...`.
- **Race: session expired between page render and submit:**
  server action returns
  `{ ok: false, error: 'Sign in expired. Please sign in
  again.' }`; user re-signs-in and retries.

## Decisions made upfront — DO NOT ASK

- **Cascade via `auth.admin.deleteUser`, not a custom RPC.**
  The schema's FK chains already cascade from `auth.users`
  through `sessions` → `turns`/`artifacts`/`flag_audit`. One
  admin call. No PL/pgSQL function needed.
- **`ip_rate_limits` is NOT cleared on account deletion.**
  The table is per-IP-hash + day, not per-user. Spec L114
  ("IP-hash retention: 30d") names the hash retention as
  an abuse-prevention control independent of accounts;
  tying it to deletion would let a bad actor reset the
  abuse signal by re-registering. Locked here.
- **Confirmation requires the literal string `delete`** —
  the lowest-friction option that still defends against
  accidental double-clicks. Not the email address (would
  add typing-out-loud friction without much gain at the v1
  threat model).
- **Settings page exists for one section.** v1 has no other
  settings to ship; the route exists so the delete affordance
  has a natural home + the next "I want a settings item"
  PR doesn't need a new route. Honest scope.
- **Header gets a Settings link.** Without it, the new routes
  are orphaned. The link sits adjacent to the existing
  sign-out form in `app/app/page.tsx`'s header (or the
  layout header, whichever wraps `/app/*`).
- **Success landing-banner is in scope.** A silent redirect
  to `/` would leave the user wondering whether the click
  worked. One paragraph; dismisses on next navigation; no
  toast library.
- **The banner reads `Your account was deleted.`** Period.
  In-voice; not "Goodbye." or "Account closed successfully."
  — same register as the rest of the product.
- **No "are you sure?" two-step modal.** The confirmation
  field is the protection layer. Two modals would be
  belt-and-suspenders without commensurate safety gain.
- **No data export before delete.** Out of v1 spec; users
  can re-download artifacts from `/app/sessions/[id]` while
  the account is still active. Document in the warning copy.
- **No grace period / soft-delete.** Spec says "deletion on
  account close" — immediate. Soft-delete with a 30-day
  window would let abusers exploit the window; would also
  contradict the privacy copy.
- **Bearings URL contract gets the two new routes appended.**
  The phase-13 sync test parses bearings; without the
  append it would fail. Append happens in this phase's
  commit (data-only edit; same commit type pattern as
  phase 13's `bearings:` precursor commit `dd2d75d`).

## Mobile reflow / responsive

Two pages, single-column max-width 540px (same shell as
`/signin` and the legal pages). The confirmation form
stacks naturally at 375px.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/auth/actions.ts` (extended) | `deleteAccountAction`: empty confirmation → `ok: false`; wrong confirmation → `ok: false`; happy path → admin delete called with the authed user id + signOut called + redirect to `/?account=deleted` | — |
| `components/settings/delete-account-form.tsx` | submit disabled until field === 'delete'; submit calls the action with FormData | — |
| `components/settings/settings-section.tsx` | renders the title + children + optional CTA | — |
| `app/app/settings/page.tsx` | renders the Account section + a link to delete-account | — |
| `app/app/settings/delete-account/page.tsx` | renders H1 + warning copy + the form | — |
| Header link | unit test: header renders a Settings link to /app/settings | — |
| Landing banner | unit test: renders the banner when `?account=deleted` is present; renders nothing otherwise | — |
| Bearings URL contract sync | `__tests__/url-contract-sync.test.ts` (existing) already asserts parity; the test will fail until the bearings + walker entries are both added | — |
| URL-contract walker (phase 13) | `e2e/url-contract.ts` (extended) — append `/app/settings` and `/app/settings/delete-account` with `redirect-to-signin-with-next` expectation | `e2e/url-contract-smoke.spec.ts` (existing) — picks up the new entries automatically |

## Hermetic e2e registration

No new spec file. The existing URL-contract walker covers
the redirect-to-signin behavior for both new routes once
they're added to `URL_CONTRACT`. Authed walks of the
delete-account flow remain operator-gated (Mailosaur
credentials).

## Verify gate

```bash
pnpm verify
```

No new dependencies. No new migration. The vitest
url-contract-sync test will trip if bearings or the walker
data diverge from each other; both are updated in this
phase's commit.

## Commit body template

```
feat: account deletion + data wipe — phase 18

- app/app/settings/page.tsx: small settings landing with one
  Account section linking to delete-account
- app/app/settings/delete-account/page.tsx: warning copy +
  <DeleteAccountForm /> + back link to /app/settings
- components/settings/{settings-section,delete-account-form}
  .tsx: small composition + the confirmation form. Submit is
  disabled until the user types "delete" verbatim
- lib/auth/actions.ts: deleteAccountAction — validates the
  confirmation, calls supabase.auth.admin.deleteUser via the
  service client (cascade-deletes sessions/turns/artifacts/
  flag_audit via existing FK chains), signs out, redirects
  to /?account=deleted
- components/site/landing-deleted-banner.tsx (client): reads
  ?account=deleted from useSearchParams and renders an
  in-voice mono paragraph "Your account was deleted." Auto-
  dismisses on next navigation
- app/page.tsx: composes LandingHero + the deleted banner
- components/site/header.tsx: Settings link added to the
  authed nav (adjacent to the existing sign-out form)
- plan/bearings.md: appended /app/settings + /app/settings/
  delete-account to the URL contract block (keeps the
  phase-13 vitest sync test green)
- e2e/url-contract.ts: appended both routes with
  redirect-to-signin-with-next expectation; the existing
  smoke walker picks them up automatically

Decisions:
- Cascade via auth.admin.deleteUser, not a custom RPC (FK
  chain handles the wipe)
- ip_rate_limits NOT cleared on account deletion (abuse
  signal independent of accounts; per spec L114)
- Confirmation requires literal "delete" (cheapest defense
  against accidental clicks)
- No data export before delete (out of v1 spec)
- No soft-delete / grace period (matches privacy copy)
- Settings page ships with one section (Account); honest
  scope for v1
- Header gets a Settings link so the new routes aren't
  orphaned

Closes #<phase-mirror-issue-number>
EOF
)
```

## DoD

Flip Phase 18's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash.

After ship, the loop fully transitions to `/iterate` per the
updated build-plan transition note.

## Follow-ups (out of scope this phase)

- **Authed e2e walk** of the delete + redirect flow —
  needs Mailosaur credentials (operator-gated; existing
  AUDIT row covers it).
- **Per-user data export** ("download my data" before close)
  — out of v1 spec.
- **Soft-delete + restore** — out of v1 spec.
- **Audit-log retention of account-close events** — if
  legal-compliance asks, a small `account_close_log` table
  could hold a hashed user id + timestamp without violating
  the deletion promise. Not v1.
