// Hand-written placeholder for the typed Supabase client.
// Operator regenerates this with `pnpm db:types` after the phase 7
// migration (db/migrations/20260516_phase_7_sessions.sql) lands against
// the project; this file's shape mirrors the migration so typecheck passes
// pre-regeneration. The auto-generated file will be richer; nothing in app
// code depends on fields outside what's listed here.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type SessionRow = {
  id: string
  user_id: string
  pitch: string
  template_slug: string
  persona_slugs: string[]
  model: string
  status:
    | 'retro-review'
    | 'clarify'
    | 'confer'
    | 'exec-summary'
    | 'specialists'
    | 'artifact'
    | 'retrospective'
    | 'done'
    | 'aborted'
  total_tokens: number
  prompt_tokens: number
  completion_tokens: number
  cost_cents: number
  ip_hash: string | null
  key_origin: 'user' | 'project'
  created_at: string
  updated_at: string
}

type TurnRow = {
  id: string
  session_id: string
  idx: number
  phase:
    | 'retro-review'
    | 'clarify'
    | 'confer'
    | 'exec-summary'
    | 'specialists'
    | 'artifact'
    | 'retrospective'
    | 'moderator'
  persona_slug: string | null
  author: 'persona' | 'user' | 'moderator' | 'secretary'
  body: string
  replying_to: string | null
  tokens: number
  created_at: string
}

type ArtifactRow = {
  id: string
  session_id: string
  spec_md: string
  exec_summary: string
  callouts: string
  secretary_log: string
  tokens_used: number
  finished_at: string
}

type SessionInsert = Omit<
  SessionRow,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'total_tokens'
  | 'prompt_tokens'
  | 'completion_tokens'
  | 'cost_cents'
  | 'key_origin'
> & {
  id?: string
  total_tokens?: number
  prompt_tokens?: number
  completion_tokens?: number
  cost_cents?: number
  key_origin?: 'user' | 'project'
  created_at?: string
  updated_at?: string
}

type TurnInsert = Omit<TurnRow, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

type ArtifactInsert = Omit<
  ArtifactRow,
  'id' | 'finished_at' | 'secretary_log'
> & {
  id?: string
  secretary_log?: string
  finished_at?: string
}

type FlagAuditRow = {
  id: string
  session_id: string | null
  surface: 'input' | 'output'
  text: string
  verdict: Json
  flagged_at: string
}

type FlagAuditInsert = Omit<FlagAuditRow, 'id' | 'flagged_at'> & {
  id?: string
  flagged_at?: string
}

type IpRateLimitRow = {
  ip_hash: string
  day_utc: string
  surface: 'demo'
  count: number
}

type IpRateLimitInsert = IpRateLimitRow & { count?: number }

type RetroRow = {
  id: string
  session_id: string
  user_id: string
  pitch_excerpt: string
  entry_md: string
  for_next_time: string[]
  created_at: string
}

type RetroInsert = Omit<RetroRow, 'id' | 'created_at'> & {
  id?: string
  for_next_time?: string[]
  created_at?: string
}

type UserApiKeyRow = {
  user_id: string
  ciphertext: string
  iv: string
  auth_tag: string
  key_version: number
  mask: string
  created_at: string
  updated_at: string
}

type UserApiKeyInsert = Omit<UserApiKeyRow, 'created_at' | 'updated_at'> & {
  key_version?: number
  created_at?: string
  updated_at?: string
}

type UserApiKeyAuditRow = {
  id: number
  user_id: string
  event: 'add' | 'rotate' | 'revoke'
  key_version: number
  created_at: string
}

type UserApiKeyAuditInsert = Omit<UserApiKeyAuditRow, 'id' | 'created_at'> & {
  id?: number
  key_version?: number
  created_at?: string
}

type AppliedMigrationRow = {
  filename: string
  applied_at: string
  applied_by: string | null
}

type AppliedMigrationInsert = Omit<AppliedMigrationRow, 'applied_at' | 'applied_by'> & {
  applied_at?: string
  applied_by?: string | null
}

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: SessionRow
        Insert: SessionInsert
        Update: Partial<SessionRow>
        Relationships: []
      }
      turns: {
        Row: TurnRow
        Insert: TurnInsert
        Update: Partial<TurnRow>
        Relationships: []
      }
      artifacts: {
        Row: ArtifactRow
        Insert: ArtifactInsert
        Update: Partial<ArtifactRow>
        Relationships: []
      }
      flag_audit: {
        Row: FlagAuditRow
        Insert: FlagAuditInsert
        Update: Partial<FlagAuditRow>
        Relationships: []
      }
      ip_rate_limits: {
        Row: IpRateLimitRow
        Insert: IpRateLimitInsert
        Update: Partial<IpRateLimitRow>
        Relationships: []
      }
      retros: {
        Row: RetroRow
        Insert: RetroInsert
        Update: Partial<RetroRow>
        Relationships: []
      }
      user_api_keys: {
        Row: UserApiKeyRow
        Insert: UserApiKeyInsert
        Update: Partial<UserApiKeyRow>
        Relationships: []
      }
      user_api_key_audit: {
        Row: UserApiKeyAuditRow
        Insert: UserApiKeyAuditInsert
        Update: Partial<UserApiKeyAuditRow>
        Relationships: []
      }
      applied_migrations: {
        Row: AppliedMigrationRow
        Insert: AppliedMigrationInsert
        Update: Partial<AppliedMigrationRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
