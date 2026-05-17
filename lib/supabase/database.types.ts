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
    | 'clarify'
    | 'confer'
    | 'exec-summary'
    | 'specialists'
    | 'artifact'
    | 'done'
    | 'aborted'
  total_tokens: number
  ip_hash: string | null
  created_at: string
  updated_at: string
}

type TurnRow = {
  id: string
  session_id: string
  idx: number
  phase:
    | 'clarify'
    | 'confer'
    | 'exec-summary'
    | 'specialists'
    | 'artifact'
    | 'moderator'
  persona_slug: string | null
  author: 'persona' | 'user' | 'moderator'
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
  tokens_used: number
  finished_at: string
}

type SessionInsert = Omit<
  SessionRow,
  'id' | 'created_at' | 'updated_at' | 'total_tokens'
> & {
  id?: string
  total_tokens?: number
  created_at?: string
  updated_at?: string
}

type TurnInsert = Omit<TurnRow, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

type ArtifactInsert = Omit<ArtifactRow, 'id' | 'finished_at'> & {
  id?: string
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
