-- Phase 27: BYOK orchestrator integration — key_origin column.
--
-- Records which key paid for each session so cost attribution stays
-- honest once BYOK is in use. Additive: existing rows default to
-- 'project'; the orchestrator's create-time insert keeps that default
-- when no user key is on file (or BYOK is not enabled on the
-- deployment).

begin;

alter table public.sessions
  add column if not exists key_origin text not null default 'project';

-- Drop + re-add the check constraint idempotently.
alter table public.sessions drop constraint if exists sessions_key_origin_check;
alter table public.sessions add constraint sessions_key_origin_check
  check (key_origin in ('user', 'project'));

commit;
