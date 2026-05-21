-- Phase 26: BYO Anthropic API key foundation.
--
-- Creates public.user_api_keys (one row per user — the encrypted bearer
-- token + crypto metadata + a mask cached at write time for cheap
-- display) and public.user_api_key_audit (append-only event log per
-- user for add / rotate / revoke). Both cascade-delete via the
-- auth.users FK so phase 18's account deletion auto-purges.
--
-- The actual encryption happens app-side via AES-256-GCM keyed by the
-- BYOK_MASTER_KEY env var (see lib/byok/encrypt.ts). The DB only stores
-- ciphertext, IV, and auth tag — never plaintext.

begin;

-- One row per user. The mask column lets the metadata loader render
-- the masked summary without ever touching the decrypt path.
create table if not exists public.user_api_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ciphertext bytea not null,
  iv bytea not null,
  auth_tag bytea not null,
  key_version int not null default 1,
  mask text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_api_keys enable row level security;

drop policy if exists user_api_keys_select_own on public.user_api_keys;
create policy user_api_keys_select_own on public.user_api_keys
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_api_keys_insert_own on public.user_api_keys;
create policy user_api_keys_insert_own on public.user_api_keys
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists user_api_keys_update_own on public.user_api_keys;
create policy user_api_keys_update_own on public.user_api_keys
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_api_keys_delete_own on public.user_api_keys;
create policy user_api_keys_delete_own on public.user_api_keys
  for delete to authenticated
  using (auth.uid() = user_id);

-- Append-only audit log. User can SELECT their own; INSERT is
-- service-role only so users can't forge audit events.
create table if not exists public.user_api_key_audit (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null check (event in ('add', 'rotate', 'revoke')),
  key_version int not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists user_api_key_audit_user_recent_idx
  on public.user_api_key_audit (user_id, created_at desc);

alter table public.user_api_key_audit enable row level security;

drop policy if exists user_api_key_audit_select_own on public.user_api_key_audit;
create policy user_api_key_audit_select_own on public.user_api_key_audit
  for select to authenticated
  using (auth.uid() = user_id);

-- No INSERT / UPDATE / DELETE policies for authenticated users:
-- only the service role (which bypasses RLS) writes rows.

commit;
