# Operator batch — apply the pending migrations + ADMIN_EMAILS

> ELI5 walkthrough. Four small operator tasks queued up across the
> last few phases. Each is independent — do them in any order.
> Total time: ~15 minutes if everything goes smoothly.
>
> Filed by `/oversight` round 15 (2026-05-20) at the user's request.

---

## What's all this for?

Three phases shipped code that writes to Supabase columns that
don't exist yet, plus phase 23 shipped an admin dashboard that
needs to know who's allowed to see it. Until you do the four
steps below:

- **Phase 16 (token usage):** every session's "Usage" footer
  shows `—` for tokens + cost. The numbers exist in app memory
  but can't be saved.
- **Phase 21 (secretary):** the Secretary persona's structured
  log turns silently vanish at the database. The fourth artifact
  tile ("secretary-log.md") is empty forever.
- **Phase 22 (retros):** the "Recent retros" panel before each
  session is always empty. The cross-session memory loop is a
  no-op in prod.
- **Phase 23 (admin dashboard):** `/admin` 404s for everyone.

Nothing is broken — the app catches each missing piece and
degrades gracefully. But the surfaces are silently no-ops until
you do these four things.

---

## Before you start

You need:

- Access to the production Supabase dashboard for the boardroom
  project. (Or `pnpm db:migrate` from your local machine if you
  have the right `.env` connecting to prod — most operators just
  use the SQL editor.)
- Access to the Vercel project's environment variables.
- Your own email address (for ADMIN_EMAILS bootstrap).

Open both dashboards in tabs and keep them open. You'll bounce
between them.

---

## Step 1 — Phase 16 token usage migration

**What it does:** adds three columns to `public.sessions` so
the per-session usage footer can persist real numbers instead
of `—`.

**How to apply:**

1. Open the Supabase dashboard for the boardroom project.
2. Click **SQL Editor** in the left sidebar.
3. Open a new query tab.
4. Open the file `db/migrations/20260518_phase_16_token_usage.sql`
   in this repo. (Or copy from below — it's tiny.)
5. Paste the SQL:

   ```sql
   alter table public.sessions
     add column if not exists prompt_tokens int not null default 0,
     add column if not exists completion_tokens int not null default 0,
     add column if not exists cost_cents int not null default 0;
   ```

6. Click **Run** (or press cmd/ctrl-enter). You should see
   "Success. No rows returned."

**How to verify it worked:**

- In Supabase, run `select prompt_tokens, completion_tokens,
  cost_cents from public.sessions limit 1;` — no error means
  the columns exist.
- After a new boardroom session runs end-to-end, open
  `/app/sessions/[that-session-id]` — the footer should show
  real numbers (e.g. `prompt 1.2k · completion 580 · est $0.02`)
  instead of `—`.

**Heads up:** older sessions (from before the migration) still
show `—` because they were never written with the new columns.
That's expected — only new sessions get the real numbers.

---

## Step 2 — Phase 21 secretary migration

**What it does:** (a) lets the database accept `'secretary'` as
a valid turn author, and (b) adds a `secretary_log` column to
the artifacts table so the fourth artifact tile has a place to
live.

**How to apply:**

1. Same SQL editor. New query tab.
2. Paste the SQL (from `db/migrations/20260519_phase_21_secretary.sql`):

   ```sql
   begin;

   alter table public.turns drop constraint if exists turns_author_check;
   alter table public.turns add constraint turns_author_check
     check (author in ('persona', 'user', 'moderator', 'secretary'));

   alter table public.artifacts add column if not exists secretary_log text
     not null default '';

   commit;
   ```

3. Click **Run**.

**How to verify it worked:**

- Sign in to the boardroom and start a real session at `/app`.
  When the session finishes, the boardroom shelf shows a
  "Plus the Secretary" eyebrow and the artifact grid renders a
  fourth tile called `secretary-log.md` with non-empty content.
- If the tile still renders an `—` sentinel or is missing, the
  migration didn't take — re-run step 2.

---

## Step 3 — Phase 22 retros migration

**What it does:** creates a new `retros` table (one row per
finished session, RLS so each user only sees their own), and
widens two `CHECK` constraints so the orchestrator can use the
new `retro-review` and `retrospective` phase names. This is the
biggest migration of the three but still drop-safe.

**How to apply:**

1. Same SQL editor. New query tab.
2. Open `db/migrations/20260519_phase_22_retros.sql` in the
   repo — it's longer than the other two; safest to copy from
   the file directly so you get the full SQL with all the
   policies.
3. Paste the full file content into the SQL editor.
4. Click **Run**.

You should see "Success. No rows returned."

**How to verify it worked:**

- In Supabase, run `select count(*) from public.retros;` — it
  should return `0` (table exists, no rows yet — that's right).
- Run two boardroom sessions back-to-back as the same user. The
  second session, before clarify, should show a "Recent retros"
  panel listing the first session's "for next time" items. If
  it doesn't appear, the orchestrator's `loadRetros()` is still
  failing silently — check Supabase logs for an RLS or column
  error.

---

## Step 4 — Set `ADMIN_EMAILS` in Vercel

**What it does:** tells the `/admin` route who's allowed to see
it. Without this, the route returns 404 to every user, so the
admin dashboard you shipped in phase 23 is functionally
invisible.

**How to apply:**

1. Open the Vercel dashboard → boardroom project → **Settings**
   → **Environment Variables**.
2. Click **Add New**.
3. Name: `ADMIN_EMAILS`
4. Value: your own email address. If you want multiple admins,
   comma-separate them, e.g. `you@example.com,teammate@example.com`.
5. Apply to: **Production** *and* **Preview** (check both boxes).
6. Click **Save**.
7. Trigger a redeploy so the new env value is picked up:
   - Easiest path: Vercel dashboard → **Deployments** → click
     the three-dot menu on the latest deploy → **Redeploy** →
     uncheck "Use existing build cache" → **Redeploy**.
   - Or: push any small commit to `main`; the next auto-deploy
     reads the new env.

Mirror to local `.env` (so `pnpm dev` shows you the dashboard
too):

```bash
echo 'ADMIN_EMAILS=you@example.com' >> .env
```

(Or edit `.env` by hand if you prefer.)

**How to verify it worked:**

- After the redeploy finishes, sign in to the production site
  with the email you added.
- Visit `https://let-us-discuss-ai.vercel.app/admin`.
- You should see the admin dashboard with five tiles
  (sessions/day, tokens/day, top cost sessions, flag rate,
  error rate). Numbers are zero or near-zero until traffic
  builds up — that's fine.
- Sign in as a different (non-admin) email and visit the same
  URL — should 404.

---

## When everything is done

Come back to this repo and run:

```bash
git pull
```

Then tell `/oversight` "the migrations are applied" — the
next oversight pass will move the four operator rows to
`## Resolved` in `plan/AUDIT.md` and update
`setup/03_supabase.md` Section status.

If anything went wrong on one of the steps, you can also just
say "step 2 failed with <error>" and the next oversight will
investigate before moving anything to resolved.

---

## What if I'm not ready?

That's fine — none of these block any feature. The four rows
will stay pending in `plan/AUDIT.md` and the loop continues to
skip them per the `[operator]` contract. Re-read this file when
you're ready.
