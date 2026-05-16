# Critique log

> Last pass: 2026-05-16 at commit 29e5d62
> Pass count: 1

> External-observer feedback for boardroom. Populated by
> `/critique`, drained by `/iterate`. See `skills/critique.md`
> for the contract.

## Pending

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
  critique loop. Tracked in parallel as the
  `[operator] Populate SUPABASE_E2E_SESSION_COOKIE` row in
  `plan/AUDIT.md` (score 3.0).
- **Evidence:** `grep -E 'SUPABASE_E2E_SESSION_COOKIE' .env
  .env.example` returns nothing. Reader sub-agent returned
  `auth_state: "auth-failed"` per reader hard rule 9 (no
  silent fallback to anonymous when Auth: session-cookie is
  declared).
- **Suggested fix:** Operator action. Create a dedicated
  `critique-bot@…` Supabase user; sign in once via
  magic-link in a browser; copy the resulting
  `sb-<project>-auth-token` cookie; set
  `SUPABASE_E2E_SESSION_COOKIE` in `.env`. Mirror the value
  into the loop's runtime env. Update `.env.example` with a
  commented-out template so the variable is discoverable.
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
  drew the wrong conclusion. Next /critique pass walks the
  corrected canonical and produces real product findings.

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
  identified correctly, this finding evaporates. The reader
  prompt should pass the canonical alias explicitly going
  forward (already does — the original pass-1 prompt named
  `https://let-us-discuss.vercel.app` which 404'd; pass 2
  names `https://let-us-discuss-ai.vercel.app`).
- **Resolution:** no infra change required. Closed as
  misdirected.
