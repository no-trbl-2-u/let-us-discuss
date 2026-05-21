import type { SupabaseClient } from '@supabase/supabase-js'
import type { SupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { decryptKey } from './decrypt'
import { encryptKey, maskKey } from './encrypt'

// Server-only. Wraps the Supabase storage for `user_api_keys` + the
// service-role inserts into `user_api_key_audit`. The decrypt path is
// only exercised by `getDecryptedKey` — phase 27's orchestrator calls
// it at session start; everything else (settings page, audit display)
// reads from the cached `mask` column without touching the master key.

export type KeyMeta = {
  mask: string
  keyVersion: number
  updatedAt: string
}

export type AuditEvent = {
  id: number
  event: 'add' | 'rotate' | 'revoke'
  keyVersion: number
  createdAt: string
}

type ServiceClient = SupabaseClient<Database>

function bytea(buf: Buffer): string {
  // Postgres bytea over PostgREST accepts the `\x<hex>` hex-encoded
  // literal. supabase-js round-trips this; the read path returns the
  // same string and we decode it via bytesFromBytea below.
  return `\\x${buf.toString('hex')}`
}

function bytesFromBytea(value: unknown): Buffer {
  if (typeof value !== 'string') {
    throw new Error('expected bytea string from postgres')
  }
  const trimmed = value.startsWith('\\x') ? value.slice(2) : value
  return Buffer.from(trimmed, 'hex')
}

export async function loadKeyMeta(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<KeyMeta | null> {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('mask, key_version, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    throw new Error(`loadKeyMeta failed: ${error.message}`)
  }
  if (!data) return null
  return {
    mask: data.mask,
    keyVersion: data.key_version,
    updatedAt: data.updated_at,
  }
}

async function insertAudit(
  service: ServiceClient,
  userId: string,
  event: 'add' | 'rotate' | 'revoke',
  keyVersion: number,
): Promise<void> {
  const { error } = await service.from('user_api_key_audit').insert({
    user_id: userId,
    event,
    key_version: keyVersion,
  })
  if (error) {
    throw new Error(`audit insert failed: ${error.message}`)
  }
}

export async function setKey(
  supabase: SupabaseServerClient,
  userId: string,
  plaintext: string,
  serviceFactory: () => ServiceClient = createServiceClient,
): Promise<KeyMeta> {
  const trimmed = plaintext.trim()
  const encrypted = encryptKey(trimmed)
  const mask = maskKey(trimmed)

  const { data: existing, error: existingErr } = await supabase
    .from('user_api_keys')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (existingErr) {
    throw new Error(`setKey lookup failed: ${existingErr.message}`)
  }
  const isRotation = existing !== null

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('user_api_keys')
    .upsert(
      {
        user_id: userId,
        ciphertext: bytea(encrypted.ciphertext),
        iv: bytea(encrypted.iv),
        auth_tag: bytea(encrypted.authTag),
        key_version: encrypted.keyVersion,
        mask,
        updated_at: now,
      },
      { onConflict: 'user_id' },
    )
    .select('mask, key_version, updated_at')
    .single()
  if (error) {
    throw new Error(`setKey upsert failed: ${error.message}`)
  }

  const service = serviceFactory()
  await insertAudit(
    service,
    userId,
    isRotation ? 'rotate' : 'add',
    encrypted.keyVersion,
  )

  return {
    mask: data.mask,
    keyVersion: data.key_version,
    updatedAt: data.updated_at,
  }
}

export async function deleteKey(
  supabase: SupabaseServerClient,
  userId: string,
  serviceFactory: () => ServiceClient = createServiceClient,
): Promise<void> {
  const { data: existing, error: existingErr } = await supabase
    .from('user_api_keys')
    .select('key_version')
    .eq('user_id', userId)
    .maybeSingle()
  if (existingErr) {
    throw new Error(`deleteKey lookup failed: ${existingErr.message}`)
  }
  if (!existing) {
    // Nothing to revoke; idempotent.
    return
  }
  const { error } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('user_id', userId)
  if (error) {
    throw new Error(`deleteKey failed: ${error.message}`)
  }
  const service = serviceFactory()
  await insertAudit(service, userId, 'revoke', existing.key_version)
}

export async function getDecryptedKey(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<string | null> {
  // Phase 27's orchestrator entry point. This is the only call that
  // exercises the decrypt path; everything else stays on the cached
  // mask column.
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('ciphertext, iv, auth_tag, key_version')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    throw new Error(`getDecryptedKey failed: ${error.message}`)
  }
  if (!data) return null
  return decryptKey({
    ciphertext: bytesFromBytea(data.ciphertext),
    iv: bytesFromBytea(data.iv),
    authTag: bytesFromBytea(data.auth_tag),
    keyVersion: data.key_version,
  })
}

export async function loadRecentAudit(
  supabase: SupabaseServerClient,
  userId: string,
  limit = 5,
): Promise<AuditEvent[]> {
  const { data, error } = await supabase
    .from('user_api_key_audit')
    .select('id, event, key_version, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    throw new Error(`loadRecentAudit failed: ${error.message}`)
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    event: row.event,
    keyVersion: row.key_version,
    createdAt: row.created_at,
  }))
}
