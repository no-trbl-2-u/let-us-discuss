# `boardroom` — external service setup index

> One runbook per external service. Pre-flighted upfront so
> `/march` can run unattended for long windows without
> hitting a "configure this in the dashboard" wall.
>
> Convention: `00_files.md` is this index. Each service gets
> a numbered runbook (`NN_<service>.md`). Numbers reflect
> setup dependency order — do them top to bottom on a fresh
> machine.

See `nexus/customization/external-services.md` (sibling
layout) or `.nexus/customization/external-services.md`
(submoduled) for the convention this template implements.

---

## Status legend

- **`OK`** — runbook complete, all dashboard config done,
  all env vars wired
- **`PARTIAL`** — runbook complete, some dashboard config
  still pending
- **`STUB`** — runbook stubbed, not yet written
- **`—`** — not yet planned

---

## Bootstrap automation

Most rows in this index are scriptable end-to-end by
`/bootstrap` (see
[`nexus/customization/bootstrap-automation.md`](../../customization/bootstrap-automation.md)).
Each `NN_<service>.md` runbook lists which sections are
`Automated by /bootstrap` near the top. Sections that
require a human (DNS, OAuth approvals, billing) appear as
handoffs during the bootstrap run and as `[needs-user-call]`
rows in `plan/AUDIT.md` if deferred.

`/bootstrap status` is the read-only diagnostic — safe to
run any time, including inside `/oversight`.

---

## Index

| # | Service | Runbook | Status | Phases that touch it |
|---|---|---|---|---|
| 01 | GitHub | `01_github.md` | `STUB` | substrate, all (push), `/triage` (issues), cloud loop |
| 02 | Vercel | `02_vercel.md` | `STUB` | phase 1 (deploy gate), all (deploys), Preview env |
| 03 | Supabase (Postgres + Auth + email) | `03_supabase.md` | `STUB` | phase 2 (client), phase 3 (auth + magic-link email), phase 4+ (schema + RLS), phase 8 (flag_audit table) |
| 04 | Anthropic | `04_anthropic.md` | `STUB` | phase 7 (persona reasoning), phase 6 (demo loop preview) |
| 05 | OpenAI | `05_openai.md` | `STUB` | phase 8 (moderation pre-filter — input + output) |

> Drop any row that doesn't apply to this project. Renumber
> to keep dependency order. The minimum is GitHub + hosting;
> everything else is project-specific.

---

## Per-service quick reference

A short block per row in the index. The runbook itself
(`NN_<service>.md`) is the source of truth; this is the
glanceable summary `/oversight` reads.

### 01 — GitHub `STUB`
**Runbook:** `01_github.md`
**Will cover:** repo creation (done — `no-trbl-2-u/let-us-discuss`),
branch protection rules on `main`, PAT scopes for `/triage`,
Actions secrets for the cloud loop, default labels for triage
routing.
**`.env`:** `GH_TOKEN`, `GH_REPO`
**Status:** repo exists; PAT not yet wired; branch protection
+ labels TODO before unattended runs.

### 02 — Vercel `STUB`
**Runbook:** `02_vercel.md`
**Will cover:** project creation, team membership, env-var
propagation (Production + Preview + Development), deploy
hooks, build settings, optional custom domain.
**`.env`:** `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`,
`VERCEL_TEAM_ID?`, `DEPLOY_PROVIDER=vercel`
**Status:** STUB; phase 1 ships when this is at least
PARTIAL (token + project id).

### 03 — Supabase `STUB`
**Runbook:** `03_supabase.md`
**Will cover:** project creation, region, schema migrations
(versioned `.sql` files), RLS policies per table, Auth
config (magic-link only), email templates + custom SMTP
(post-v1 — Supabase's default sender is fine until then),
backup cadence, PITR posture.
**`.env`:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Status:** STUB; phase 2 (DB client) needs PARTIAL; phase 3
(auth) needs OK on the Auth section.

### 04 — Anthropic `STUB`
**Runbook:** `04_anthropic.md`
**Will cover:** API key, workspace/organization, spend limit
+ usage alerts, model selection rationale (Opus for personas,
Sonnet for cheaper roles when applicable), rate-limit
headroom, structured-output schemas (Zod-derived).
**`.env`:** `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`
**Status:** STUB; phase 7 ships when this is OK.

### 05 — OpenAI `STUB`
**Runbook:** `05_openai.md`
**Will cover:** API key (moderation endpoint only — no
generation calls go to OpenAI), spend limit ($5/mo
plenty for moderation), rate-limit headroom.
**`.env`:** `OPENAI_API_KEY`, `OPENAI_MODERATION_MODEL`
**Status:** STUB; phase 8 ships when this is OK.

---

## Loop interaction

When `/oversight` runs, it should:

1. Read this index.
2. For each row, confirm the env vars listed actually exist
   in `.env` (and in the deploy platform's env table for
   cloud environments).
3. For `PARTIAL` rows, surface a flag: "service N is
   partially configured; verify Section X is done before
   phase Y ships."
4. For `STUB` rows whose phase is in the next 3 pending
   phases, surface as `[needs-user-call]` in
   `plan/AUDIT.md`.

This makes external-service drift visible to the loop
without dashboard access.

---

## Pre-flight before unattended runs

Before walking away for a Level 3–4 window (see
[`../intervention-spectrum.md`](../../intervention-spectrum.md)):

- [ ] Every service touching the next 5 pending phases is
      `OK`.
- [ ] Each `OK` service's verification checklist (bottom of
      its runbook) passes a spot-check.
- [ ] Every env var in every Section H is present in every
      deploy environment.
- [ ] Every runbook's "manual post-launch action" list is
      empty.

---

## See also

- `templates/setup/NN_service.md` — the per-service runbook
  template.
- `nexus/customization/external-services.md` — the
  convention.
- `intervention-spectrum.md` — Level 3 prerequisite + Level
  4 pre-flight item 8.
- `plan/bearings.md` — External services table (the
  per-runbook with last-verified date).
