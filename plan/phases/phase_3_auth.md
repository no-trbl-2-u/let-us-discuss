# Phase 3 — Auth (magic-link)

> Agent-facing brief. Concise, opinionated, decisive. Ship
> without asking; document any judgment calls in the commit
> body. Phase 2 stood up typed Supabase clients; this phase
> wires Supabase Auth's magic-link flow and gates `/app/*`.

## Outcome

Anonymous visitors can request a magic link at `/signin`,
click it in their inbox, and land on `/app` as an
authenticated user. Anonymous requests to `/app/*` redirect
to `/signin`. Server actions and server components can call
`getCurrentUser()` to read the session deterministically.
Phases 5+ build the actual boardroom on this foundation.

## Routes / endpoints (locked in `bearings.md`)

- `/signin` — public form. Server component renders the form;
  posts to a server action that triggers `signInWithOtp`. On
  success, renders an inline "check your email" confirmation
  (no client-side state machinery; React form actions handle
  the response).
- `/auth/callback` — Route handler (`route.ts`). Reads the
  `code` query param from Supabase's redirect, exchanges it
  for a session, sets the session cookies, and redirects to
  `/app` (or to a `?next=<safe-path>` if provided).
- `/app` — authenticated landing. Phase 3 ships a **placeholder**
  page that renders "Signed in as <email>" plus a "Sign out"
  form action. Phase 5 replaces with the real boardroom.
- Middleware (`middleware.ts` at repo root) — redirects
  unauthenticated requests for `/app/*` to `/signin?next=<path>`.
  Public routes (`/`, `/signin`, `/try`, `/about`, `/legal/*`,
  `/auth/callback`, `/api/health`, `/diag`) pass through.

## Content / data reads

| Helper | Lookup | Use |
|---|---|---|
| `getCurrentUser()` | `lib/supabase/auth.ts` | Server components / server actions: returns the Supabase `User` or `null`. Used by `/app/page.tsx` and the sign-out action. |
| `requireUser()` | `lib/supabase/auth.ts` | Thin wrapper: `getCurrentUser()` then `redirect('/signin')` on null. Used inside the `/app` segment to guarantee an authed user. |
| `signInWithOtpAction(formData)` | `lib/auth/actions.ts` | Server action posted to from `/signin`. Validates the email with Zod, calls `signInWithOtp`, returns `{ ok: true }` or `{ error: <message> }`. |
| `signOutAction()` | `lib/auth/actions.ts` | Server action; clears the session and redirects to `/`. |
| `safeNextPath(input)` | `lib/auth/safe-next.ts` | Pure helper: ensures the `?next=` param is a same-origin path (starts with `/`, no `//`, no protocol). Falls back to `/app`. |

No new content layer reads; this phase doesn't touch
`personas/` or `templates/`.

## Components / handlers

- `app/signin/page.tsx` — server component; renders
  `<SignInForm />` with an `<EmailInput />` and a submit button.
  When `?sent=1` is present, shows the post-submit confirmation.
- `app/signin/sign-in-form.tsx` — server component (form
  posts to a server action; no client interactivity beyond the
  browser-native form submit).
- `app/auth/callback/route.ts` — `GET` handler. Exchanges the
  code for a session via `supabase.auth.exchangeCodeForSession`;
  redirects to `safeNextPath(next)` on success, `/signin?error=...`
  on failure.
- `app/app/page.tsx` — server component; calls `requireUser()`;
  renders the placeholder + sign-out form.
- `middleware.ts` — Edge middleware. Uses
  `@supabase/ssr#createServerClient` configured with the
  request/response cookies; reads `getUser()`; on 401 for an
  `/app/*` path, returns `NextResponse.redirect('/signin?next=…')`.
- `lib/supabase/auth.ts` — `getCurrentUser`, `requireUser`,
  `getSupabaseRouteHandlerClient` (variant for `route.ts`
  files where the cookies adapter must accept `set` calls).
- `lib/auth/actions.ts` — server actions. Marked `'use server'`.
- `lib/auth/safe-next.ts` — pure helper.
- `lib/auth/route-table.ts` — declarative list of public route
  prefixes (`['/', '/signin', '/try', '/about', '/legal',
  '/auth/callback', '/api/health', '/diag']`). Consumed by
  the middleware; exported for unit tests.

Pure helpers and their tests live in `__tests__/` next to the
source. Each file is single-purpose; bias to splitting.

## Cross-links

**In** (already shipped — verify still wired):
- Phase 2's `lib/supabase/server.ts` is the foundation. The new
  `getSupabaseRouteHandlerClient` and middleware client are
  added alongside, **not** duplicated.
- Phase 1's `Header` gets a "Sign in" link that points to
  `/signin` (currently shows disabled "Sign in" text) — this
  is the retro-fit (§5).

**Out** (this phase ships these):
- `getCurrentUser()` / `requireUser()` is the API every later
  `/app/*` page consumes.
- The middleware route table is the canonical place to declare
  a route as public vs. authed.

**Retro-fit**:
- `components/site/header.tsx` — convert the disabled "Sign in"
  span into a real `<Link href="/signin">` once authed.

## SEO / metadata

`/signin` — `<title>Sign in — boardroom</title>`,
`<meta name="robots" content="noindex">` (the page itself is
public, but search-indexing the form serves no one).
`/auth/callback` — Route handler; no metadata.
`/app` — `<title>Boardroom — session</title>`, `noindex`.

## Empty / loading / error states

- **`/signin` (initial)**: form with empty email input + submit.
- **`/signin` (post-submit, `?sent=1`)**: "Check your email for
  a sign-in link. The link expires in 15 minutes." No second
  submit; the form is replaced by the confirmation.
- **`/signin` (error)**: render the error message above the
  form; preserve the typed email via a hidden field rebroadcast.
- **`/auth/callback` (success)**: redirect to `/app` (or
  `?next=`).
- **`/auth/callback` (failure)**: redirect to
  `/signin?error=<message>`.
- **`/app` (unauth)**: never renders — middleware redirects.

## Decisions made upfront — DO NOT ASK

- **Magic-link only.** No password fields. No social providers
  in v1. Matches `bearings.md` identity tiers.
- **Email validation:** Zod `z.string().email()`. Trim
  whitespace before validate.
- **Confirmation UX:** server-side render of `?sent=1` state.
  No client JS for the "check your email" toast.
- **`safeNextPath`:** allow only `^/[^/]` paths (one leading
  slash, no protocol-relative); strip and fall back to `/app`
  on anything else.
- **Middleware vs. layout gate:** middleware is authoritative.
  `/app/layout.tsx` *also* calls `requireUser()` as
  belt-and-suspenders — the middleware catches anon traffic
  fast; the layout guarantees server components downstream
  can assume an authed user.
- **No `public.profiles` migration in this phase.** Profiles
  ship in phase 6 alongside `sessions`. `getCurrentUser()` for
  now returns Supabase's `auth.users` user as-is; later phases
  join in profile data.
- **No `pnpm db:migrate` runner replacement in this phase.**
  No migration is needed for auth (Supabase manages
  `auth.users`). The stub stays. Phase 6 replaces it with the
  real runner alongside the first migration.
- **Sign-out:** server action; clears Supabase cookies and
  redirects to `/`.
- **Vercel preview branches:** the magic-link redirect URL set
  in `setup/03_supabase.md` already lists
  `https://*.boardroom-breakdown.vercel.app/auth/callback`
  — preview branches inherit. **Note:** the live URL is
  `let-us-discuss-*.vercel.app`; `setup/03_supabase.md` is
  updated this phase to reflect both project names.
- **Test inbox for e2e magic-link walk:** **deferred.** A
  proper magic-link e2e requires a real mailbox (Mailosaur,
  Postmark, or a `+e2e@` Gmail filter). The phase 3 verify
  gate covers (a) middleware decisions via unit tests, (b)
  the signin form renders and posts to the action,
  (c) `/app` unauth → `/signin` redirect via e2e. The
  end-to-end magic-link click is filed as a `[needs-e2e]` row
  in `plan/AUDIT.md` for `/iterate` to address once the demo
  loop (phase 6) needs it.
- **`getCurrentUser` runtime:** Node runtime (server), not
  Edge — Supabase's full client lives there. The middleware
  runs on the Edge runtime, but uses only `auth.getUser()`
  which is Edge-safe.

A brief that leaves Open Qs is a brief that fails its job.

## Mobile reflow / responsive

`/signin`: single column at all viewports. Email input is
full-width; the submit button stretches at sm, becomes fixed-
width at md. `/app` placeholder is two-line; no reflow
concerns.

## Pages × tests matrix

| Surface | Unit tests | E2E |
|---|---|---|
| `lib/auth/safe-next.ts` | accepts `/foo`, `/foo/bar`; rejects `//evil`, `https://evil`, `\\evil`, missing | — |
| `lib/auth/route-table.ts` | `isPublicRoute('/')`, `'/signin'`, `'/api/health'` true; `'/app'`, `'/app/sessions'` false | — |
| `lib/auth/actions.ts` | `signInWithOtpAction` validates email; returns error on invalid; calls `signInWithOtp` with the right payload (SDK mocked) | — |
| `lib/supabase/auth.ts` | `getCurrentUser` returns null when no session; returns user when SDK mocked to return one; `requireUser` redirects when null | — |
| `app/signin/page.tsx` | renders form initially; renders confirmation when `sent=1` | renders form at `/signin`; fields visible |
| `app/app/page.tsx` | calls `requireUser`; renders email + sign-out form (SDK mocked) | unauth GET `/app` → redirect to `/signin?next=/app` (HTTP 307) |
| `middleware.ts` | n/a — covered by `route-table.ts` + integration redirect e2e | implicitly via the `/app` redirect test |

## Verify gate

```bash
pnpm verify
```

E2E sets `SUPABASE_URL` / `SUPABASE_ANON_KEY` to *non-empty
placeholders* via `playwright.config.ts#webServer.env` so the
build does not 401 at boot. The redirect-flow e2e does not
exercise a live Supabase backend (the middleware short-circuits
before hitting the API for anon requests).

## Commit body template

```
feat: magic-link auth — phase 3

- /signin (server-rendered form + sent-state)
- /auth/callback (code exchange + safe-next redirect)
- /app placeholder (requireUser + sign-out)
- middleware.ts gates /app/* via Supabase getUser
- lib/auth/{actions,route-table,safe-next}.ts
- lib/supabase/auth.ts (getCurrentUser, requireUser)
- Header.tsx retro-fit: real /signin link replaces disabled span
- setup/03_supabase.md C: redirect URLs span both project names

Decisions:
- Magic-link only; no password, no social (per bearings)
- safe-next allowlist (^/[^/]); fall back to /app
- Middleware + layout double-gate /app/*
- profiles migration deferred to phase 6
- e2e magic-link walk deferred; route-table + redirect e2e
  covers the gate for this phase
- /signin and /app meta noindex
```

## DoD

Flip Phase 3's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`,
append commit hash, add to "Phase log".

## Confirm deploy

```bash
pnpm deploy:check
```

## Follow-ups (out of scope this phase)

- **`[needs-e2e]` `/iterate` audit row:** end-to-end magic-link
  click walk (requires a test inbox provider; pick one when
  phase 6 demos the full flow).
- `public.profiles` migration + first real runner (phase 6).
- Real boardroom at `/app` (phase 5).
- "Forgot to verify" UX (probably a rare-case page in phase 17
  polish).
- Account deletion flow (out of v1).
