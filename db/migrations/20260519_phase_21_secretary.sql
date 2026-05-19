-- Phase 21: secretary persona + Mode 1 (in-session)
--
-- Widens turns.author to allow 'secretary'; adds the fourth
-- artifact column. Additive; existing rows get the empty-string
-- default for secretary_log.

begin;

alter table public.turns drop constraint if exists turns_author_check;
alter table public.turns add constraint turns_author_check
  check (author in ('persona', 'user', 'moderator', 'secretary'));

alter table public.artifacts add column if not exists secretary_log text
  not null default '';

commit;
