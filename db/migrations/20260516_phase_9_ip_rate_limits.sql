-- Phase 9: per-IP demo rate-limit counter.
-- One row per (ip_hash, day_utc, surface). The /api/demo/begin route
-- uses the service-role client to upsert/increment; no auth user owns
-- these rows, so RLS stays enabled but no policy is added (the table is
-- not readable from anon/authenticated, only from service-role).

create table public.ip_rate_limits (
  ip_hash text not null,
  day_utc date not null,
  surface text not null check (surface in ('demo')),
  count int not null default 1,
  primary key (ip_hash, day_utc, surface)
);

alter table public.ip_rate_limits enable row level security;
