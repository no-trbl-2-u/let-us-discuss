import { randomBytes } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { decryptKey } from '@/lib/byok/decrypt'
import { encryptKey, maskKey } from '@/lib/byok/encrypt'
import { BYOK_KEY_VERSION, MASTER_KEY_BYTES } from '@/lib/byok/master-key'

const SAMPLE_KEY = 'sk-ant-api03-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

function setMasterKey(buf: Buffer): void {
  process.env.BYOK_MASTER_KEY = buf.toString('base64')
}

describe('encryptKey / decryptKey', () => {
  const originalEnv = process.env.BYOK_MASTER_KEY

  beforeEach(() => {
    setMasterKey(randomBytes(MASTER_KEY_BYTES))
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.BYOK_MASTER_KEY
    } else {
      process.env.BYOK_MASTER_KEY = originalEnv
    }
  })

  it('round-trips a plaintext key under the same master key', () => {
    const encrypted = encryptKey(SAMPLE_KEY)
    expect(encrypted.keyVersion).toBe(BYOK_KEY_VERSION)
    expect(encrypted.iv.length).toBe(12)
    expect(encrypted.authTag.length).toBeGreaterThanOrEqual(12)
    expect(decryptKey(encrypted)).toBe(SAMPLE_KEY)
  })

  it('throws on decrypt when the master key has rotated', () => {
    const encrypted = encryptKey(SAMPLE_KEY)
    setMasterKey(randomBytes(MASTER_KEY_BYTES))
    expect(() => decryptKey(encrypted)).toThrow(/auth tag mismatch/i)
  })

  it('throws on decrypt when the ciphertext has been tampered with', () => {
    const encrypted = encryptKey(SAMPLE_KEY)
    encrypted.ciphertext[0] = (encrypted.ciphertext[0] ?? 0) ^ 0xff
    expect(() => decryptKey(encrypted)).toThrow(/auth tag mismatch/i)
  })

  it('throws on encrypt when the master key is not configured', () => {
    delete process.env.BYOK_MASTER_KEY
    expect(() => encryptKey(SAMPLE_KEY)).toThrow(/not configured/i)
  })

  it('throws on decrypt when the key_version does not match runtime', () => {
    const encrypted = encryptKey(SAMPLE_KEY)
    encrypted.keyVersion = 99
    expect(() => decryptKey(encrypted)).toThrow(/key_version/i)
  })
})

describe('maskKey', () => {
  it('masks a long Anthropic-shaped key as `<first6>…<last4>`', () => {
    expect(maskKey(SAMPLE_KEY)).toBe(
      `${SAMPLE_KEY.slice(0, 6)}…${SAMPLE_KEY.slice(-4)}`,
    )
  })

  it('falls back to `***` for short input', () => {
    expect(maskKey('short')).toBe('***')
    expect(maskKey('eleven-char')).toBe('***')
    expect(maskKey('')).toBe('***')
  })

  it('trims surrounding whitespace before measuring length', () => {
    expect(maskKey(`   ${SAMPLE_KEY}   `)).toBe(
      `${SAMPLE_KEY.slice(0, 6)}…${SAMPLE_KEY.slice(-4)}`,
    )
  })
})
