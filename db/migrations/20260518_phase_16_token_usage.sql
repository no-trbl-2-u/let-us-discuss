-- Phase 16: split token usage + estimated cost on sessions.
-- Additive; legacy rows get 0 defaults. The application code
-- renders `—` for legacy rows (where total_tokens > 0 and the
-- new columns are 0) so the footer doesn't lie about untracked
-- sessions.

alter table public.sessions
  add column if not exists prompt_tokens int not null default 0,
  add column if not exists completion_tokens int not null default 0,
  add column if not exists cost_cents int not null default 0;
