# Vercel setup — boardroom

> **STUB.** Project not yet linked. Phase 1's `pnpm
> deploy:check` lights up once this reaches PARTIAL (token +
> project id in `.env`).
>
> **Account:** TBD (the user's personal Vercel account)
> **Region:** Auto (Vercel's default; revisit if Postgres
> latency to Supabase becomes a real issue)
> **Dashboard:** https://vercel.com/dashboard

See `../../nexus/customization/external-services.md`.

---

## What boardroom needs from Vercel

- Production deploy of `main` (Next.js project) — every phase.
- Preview deploy per PR — phases that ship UI.
- Env-var propagation across Production + Preview +
  Development — phases 2+ (when Supabase keys land).
- Edge runtime for streaming AI responses — phase 7.

## What Vercel is NOT doing (deferred)

- Custom domain — until post-v1 (Vercel-generated domain is
  fine for v1).
- Vercel KV / Blob / Postgres — using Supabase for those;
  Vercel managed-storage products are punted.
- Vercel Analytics — punted to phase 16's observability
  decision.

---

## Section A — Project creation

Path: https://vercel.com/new

- [ ] Import GitHub repo `no-trbl-2-u/let-us-discuss`
- [ ] Project name: `boardroom-breakdown` (or `boardroom` if
      the team-slug allows)
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Root directory: `.` (auto)
- [ ] Build command: default (`pnpm build`)
- [ ] Install command: `pnpm install`
- [ ] Node version: 20.x

## Section B — Env vars (Production / Preview / Development)

Path: Project → Settings → Environment Variables

Set in all three environments unless noted:

- [ ] `SUPABASE_URL` (phase 2+)
- [ ] `SUPABASE_ANON_KEY` (phase 2+)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (phase 2+; **Production only**
      OR Production + Preview but never Development)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (phase 2+)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (phase 2+)
- [ ] `ANTHROPIC_API_KEY` (phase 7+)
- [ ] `OPENAI_API_KEY` (phase 8+)

## Section C — Token for the deploy gate

Path: https://vercel.com/account/tokens

- [ ] Generate a token scoped to this project
- [ ] Drop into `.env`:
      ```
      DEPLOY_PROVIDER=vercel
      VERCEL_TOKEN=...
      VERCEL_PROJECT_ID=prj_...
      # VERCEL_TEAM_ID=team_...   # if team-owned
      ```

## Section D — Build settings (verify after phase 1 ships)

- [ ] Functions region: leave as auto.
- [ ] Edge runtime opt-ins are per-route via `export const
      runtime = 'edge'` (phase 7 enables streaming routes).

---

## Verification (run before unattended)

- [ ] `pnpm deploy:check` returns the latest deploy state.
- [ ] A push to `main` produces a green deploy within 5 min.
- [ ] A PR produces a Preview URL within 5 min.
