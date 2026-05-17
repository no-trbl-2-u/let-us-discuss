-- Phase 8: flag_audit.
-- Row per moderation-flagged surface (input or output). RLS-pins read +
-- insert to the owning session's user. Verbatim text + verdict payload so
-- retrospective review can re-evaluate without re-running the model.

create table public.flag_audit (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  surface text not null check (surface in ('input','output')),
  text text not null,
  verdict jsonb not null,
  flagged_at timestamptz not null default now()
);

alter table public.flag_audit enable row level security;

create policy flag_audit_self on public.flag_audit
  for select to authenticated using (
    exists (
      select 1 from public.sessions s
       where s.id = flag_audit.session_id and s.user_id = auth.uid()
    )
  );

create policy flag_audit_insert on public.flag_audit
  for insert to authenticated with check (
    exists (
      select 1 from public.sessions s
       where s.id = flag_audit.session_id and s.user_id = auth.uid()
    )
  );
