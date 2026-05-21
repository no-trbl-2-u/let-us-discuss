import { createCipheriv, randomBytes } from 'node:crypto'
import { BYOK_KEY_VERSION, IV_BYTES, getMasterKey } from './master-key'

// Server-only. AES-256-GCM via Node `crypto`. Random 12-byte IV per
// call; the auth tag is captured after `final()` and stored alongside
// the ciphertext. The decrypt path (lib/byok/decrypt.ts) re-uses
// (ciphertext, iv, authTag) and the master key to recover plaintext.
//
// The master key is sourced from BYOK_MASTER_KEY env. If unset (or the
// wrong length) `getMasterKey` returns null and we throw — callers
// should check `getMasterKey()` first and return 503 before reaching
// this helper.

export const MAX_KEY_LENGTH = 256
export const MIN_KEY_LENGTH = 32

export type EncryptedKey = {
  ciphertext: Buffer
  iv: Buffer
  authTag: Buffer
  keyVersion: number
}

export function encryptKey(plaintext: string): EncryptedKey {
  const master = getMasterKey()
  if (master === null) {
    throw new Error('BYOK master key is not configured')
  }
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', master, iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return { ciphertext, iv, authTag, keyVersion: BYOK_KEY_VERSION }
}

// Returns `sk-ant-…XYZW` (first 6 + ellipsis + last 4) for safe display.
// Short keys (< 12 chars after trim) fall back to a single `***` token
// so we don't accidentally show most of the key.
export function maskKey(plaintext: string): string {
  const trimmed = plaintext.trim()
  if (trimmed.length < 12) return '***'
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`
}
