-- Phase 30: applied_migrations bootstrap.
--
-- Records which db/migrations/*.sql files have been applied to this
-- project's Postgres. Populated by scripts/operator-apply.mjs; read
-- by app/admin/migrations/page.tsx (env-gated) to display state.
--
-- The script also runs this exact CREATE TABLE statement on first
-- launch (idempotent via IF NOT EXISTS) so a fresh deploy doesn't
-- need a chicken-and-egg "apply this migration first" step. Keeping
-- the SQL file in db/migrations/ so future readers can find it
-- where they expect.
--
-- RLS is on but with no policies for authenticated users — only the
-- service role (or direct-pg connections from the operator script)
-- writes; reads happen through the typed supabase-js client which
-- service-role-bypasses RLS for the admin-page query path.

begin;

create table if not exists public.applied_migrations (
  filename text primary key,
  applied_at timestamptz not null default now(),
  applied_by text
);

alter table public.applied_migrations enable row level security;

-- Reads: any authenticated user can SELECT. The admin gate is at
-- the route level (requireAdmin in app/admin/migrations/page.tsx),
-- not at the DB. Rows carry no user-scoped data (filename + applied_at
-- + applied_by) so widening SELECT to authenticated is fine.
drop policy if exists applied_migrations_select_authed on public.applied_migrations;
create policy applied_migrations_select_authed on public.applied_migrations
  for select to authenticated
  using (true);

-- No INSERT / UPDATE / DELETE policies. Writes happen only via
-- scripts/operator-apply.mjs's direct pg connection (which bypasses
-- RLS entirely as the database owner / service role).

commit;
