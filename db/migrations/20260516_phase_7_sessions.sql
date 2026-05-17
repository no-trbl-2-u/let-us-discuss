-- Phase 7 (split 7a): sessions / turns / artifacts.
-- RLS pins each row to the owning auth.users id.

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pitch text not null,
  template_slug text not null,
  persona_slugs text[] not null,
  model text not null,
  status text not null check (status in (
    'clarify','confer','exec-summary','specialists','artifact','done','aborted'
  )),
  total_tokens int not null default 0,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  idx int not null,
  phase text not null check (phase in (
    'clarify','confer','exec-summary','specialists','artifact','moderator'
  )),
  persona_slug text,
  author text not null check (author in ('persona','user','moderator')),
  body text not null,
  replying_to text,
  tokens int not null default 0,
  created_at timestamptz not null default now(),
  unique (session_id, idx)
);

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  spec_md text not null,
  exec_summary text not null,
  callouts text not null,
  tokens_used int not null,
  finished_at timestamptz not null default now()
);

alter table public.sessions   enable row level security;
alter table public.turns      enable row level security;
alter table public.artifacts  enable row level security;

create policy sessions_self on public.sessions
  for all to authenticated using (user_id = auth.uid());

create policy turns_self on public.turns
  for all to authenticated using (
    exists (
      select 1 from public.sessions s
       where s.id = turns.session_id and s.user_id = auth.uid()
    )
  );

create policy artifacts_self on public.artifacts
  for all to authenticated using (
    exists (
      select 1 from public.sessions s
       where s.id = artifacts.session_id and s.user_id = auth.uid()
    )
  );
