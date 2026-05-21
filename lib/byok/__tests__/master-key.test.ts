import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { MASTER_KEY_BYTES, getMasterKey } from '@/lib/byok/master-key'

describe('getMasterKey', () => {
  it('returns null when BYOK_MASTER_KEY is unset', () => {
    expect(getMasterKey({})).toBeNull()
  })

  it('returns null when BYOK_MASTER_KEY is an empty string', () => {
    expect(getMasterKey({ BYOK_MASTER_KEY: '' })).toBeNull()
    expect(getMasterKey({ BYOK_MASTER_KEY: '   ' })).toBeNull()
  })

  it('returns null when BYOK_MASTER_KEY is not valid base64', () => {
    expect(getMasterKey({ BYOK_MASTER_KEY: '!!!not-base64!!!' })).toBeNull()
  })

  it('returns null when BYOK_MASTER_KEY decodes to a wrong-length buffer', () => {
    const tooShort = Buffer.alloc(16).toString('base64')
    const tooLong = Buffer.alloc(48).toString('base64')
    expect(getMasterKey({ BYOK_MASTER_KEY: tooShort })).toBeNull()
    expect(getMasterKey({ BYOK_MASTER_KEY: tooLong })).toBeNull()
  })

  it('returns a 32-byte Buffer for a valid value', () => {
    const raw = randomBytes(MASTER_KEY_BYTES)
    const encoded = raw.toString('base64')
    const out = getMasterKey({ BYOK_MASTER_KEY: encoded })
    expect(out).not.toBeNull()
    expect(out?.length).toBe(MASTER_KEY_BYTES)
    expect(out?.equals(raw)).toBe(true)
  })

  it('tolerates whitespace around the env value', () => {
    const raw = randomBytes(MASTER_KEY_BYTES)
    const encoded = raw.toString('base64')
    const out = getMasterKey({ BYOK_MASTER_KEY: `  ${encoded}  ` })
    expect(out?.equals(raw)).toBe(true)
  })
})
