# Critique log

> Last pass: 2026-05-16 at commit 29e5d62
> Pass count: 1

> External-observer feedback for boardroom. Populated by
> `/critique`, drained by `/iterate`. See `skills/critique.md`
> for the contract.

## Pending

### [needs-user-call] Production canonical URL returns 404

- **Pass:** 1 (2026-05-16, commit `29e5d62`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** infra
- **Severity:** HIGH
- **Observation:** `https://let-us-discuss.vercel.app` —
  declared in `plan/bearings.md` L27 as the canonical "Live
  at:" URL — returns HTTP 404 on every route (`/`,
  `/about/personas`, `/signin`, `/api/health`). No Vercel
  production alias points at any deployment. Direct
  consequence: marketing pages are unreachable for an
  external visitor, and the Supabase magic-link callback URL
  configured against this hostname lands on a 404 in
  production — sign-in is effectively broken for anyone
  outside Vercel's team auth.
- **Evidence:** `curl -I https://let-us-discuss.vercel.app/`
  → 404; same for `/signin`, `/about/personas`,
  `/api/health`. `pnpm deploy:check` separately reports the
  most-recent deployment as `state=ready` at
  `let-us-discuss-55herdrf3-tj-braindump.vercel.app`, so the
  build itself is healthy — the alias is the gap.
- **Suggested fix:** Operator action. In the Vercel project
  dashboard for `let-us-discuss`, confirm Production Domain
  is set to `let-us-discuss.vercel.app` and that the latest
  ready deployment is the active production deployment. If
  the project was renamed or the deploy slot was reassigned,
  re-promote. Also re-verify the Supabase dashboard Site URL
  + Redirect URLs still match (covered separately under the
  resolved `[operator]` row in `plan/AUDIT.md` — re-check
  after the alias is fixed).
- **Source:** web-fetch (curl + reader sub-agent)

### [needs-user-call] Vercel deployment protection blocks anonymous /critique

- **Pass:** 1 (2026-05-16, commit `29e5d62`)
- **Viewport:** desktop
- **Auth state:** anonymous
- **Category:** infra
- **Severity:** HIGH
- **Observation:** Per-deploy URLs (e.g.
  `https://let-us-discuss-55herdrf3-tj-braindump.vercel.app`)
  return HTTP 401 to anonymous requests — Vercel deployment
  protection is enabled on the project. This is why the
  reader sub-agent's anonymous pass could not load any page:
  even though the deployment is "ready", it is gated behind
  Vercel's team auth, not the application's own magic-link
  auth. Every future `/critique` anonymous pass will return
  the same single infra finding until this is resolved.
- **Evidence:** `curl -o /dev/null -w '%{http_code}'
  https://let-us-discuss-55herdrf3-tj-braindump.vercel.app/`
  → 401. Reader sub-agent passes both returned only the
  unreachability finding (no product observations possible).
- **Suggested fix:** Operator action. In Vercel project
  settings → Deployment Protection, **either** turn off
  protection for Production (the canonical alias also needs
  it off for the public site to work — this is likely the
  same root cause as the 404 above), **or** generate a
  Protection Bypass token and set
  `VERCEL_AUTOMATION_BYPASS_SECRET` in the loop's
  environment so the reader can include it as a header.
  Reasonable v1 choice: turn protection off on the
  production alias and leave it on for preview-branch
  deploys; configure the loop to walk the production URL,
  not branch URLs.
- **Source:** web-fetch (curl)

### [needs-user-call] SUPABASE_E2E_SESSION_COOKIE unset — authed /critique cannot walk /app

- **Pass:** 1 (2026-05-16, commit `29e5d62`)
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
  critique loop. The two pending operator rows in
  `plan/AUDIT.md` (`Wire magic-link inbox credentials` and
  `Populate CRITIQUE_SESSION_COOKIE`) cover adjacent work
  but neither names the env var the reader actually reads.
- **Evidence:** `grep -E 'SUPABASE_E2E_SESSION_COOKIE' .env
  .env.example` returns nothing. Reader sub-agent returned
  `auth_state: "auth-failed"` per reader hard rule 9 (no
  silent fallback to anonymous when Auth: session-cookie is
  declared).
- **Suggested fix:** Operator action. Create a dedicated
  `critique-bot@…` Supabase user; sign in once via
  magic-link in a browser; copy the resulting
  `sb-<project>-auth-token` cookie (or the full cookie
  string the reader needs); set
  `SUPABASE_E2E_SESSION_COOKIE` in `.env`. Mirror the value
  into the loop's runtime env. Update `.env.example` with a
  commented-out template so the variable is discoverable.
  This work overlaps with the existing
  `[operator] Populate CRITIQUE_SESSION_COOKIE` row in
  `plan/AUDIT.md` — collapse them when the operator
  resolves the cookie name (CRITIQUE_SESSION_COOKIE vs
  SUPABASE_E2E_SESSION_COOKIE is a naming inconsistency
  between `nexus/customization/auth-aware-critique.md` and
  the existing AUDIT row).
- **Source:** web-fetch (reader sub-agent + grep)

## Done

(empty — first pass)
