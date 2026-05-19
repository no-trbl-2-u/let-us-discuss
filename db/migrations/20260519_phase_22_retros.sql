-- Phase 22: secretary Mode 2 + cross-session retros
--
-- Creates the public.retros table (one row per concluded session,
-- user-scoped, append-only) and widens the turns.phase +
-- sessions.status check constraints to allow the new wrapper-phase
-- values ('retro-review' and 'retrospective').

begin;

-- Widen turns.phase. Drop + re-add the check constraint.
alter table public.turns drop constraint if exists turns_phase_check;
alter table public.turns add constraint turns_phase_check
  check (phase in (
    'retro-review',
    'clarify',
    'confer',
    'exec-summary',
    'specialists',
    'artifact',
    'retrospective',
    'moderator'
  ));

-- Widen sessions.status so the orchestrator can persist the wrapper
-- phase as the session's running status. Same drop + re-add shape.
alter table public.sessions drop constraint if exists sessions_status_check;
alter table public.sessions add constraint sessions_status_check
  check (status in (
    'retro-review',
    'clarify',
    'confer',
    'exec-summary',
    'specialists',
    'artifact',
    'retrospective',
    'done',
    'aborted'
  ));

-- Retros table. One row per concluded session.
create table if not exists public.retros (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  pitch_excerpt text not null,
  entry_md text not null,
  for_next_time text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Indexed for the load-recent query.
create index if not exists retros_user_recent_idx
  on public.retros (user_id, created_at desc);

alter table public.retros enable row level security;

drop policy if exists retros_select_own on public.retros;
create policy retros_select_own on public.retros
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists retros_insert_own on public.retros;
create policy retros_insert_own on public.retros
  for insert to authenticated
  with check (auth.uid() = user_id);

commit;
