import { _resetWarnedForTests, hashIp, readIp } from '@/lib/anti-abuse/ip-hash'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('readIp', () => {
  it('returns the first comma-segment of x-forwarded-for', () => {
    const h = new Headers({ 'x-forwarded-for': '203.0.113.1, 10.0.0.2' })
    expect(readIp(h)).toBe('203.0.113.1')
  })

  it('falls back to x-real-ip', () => {
    const h = new Headers({ 'x-real-ip': '203.0.113.42' })
    expect(readIp(h)).toBe('203.0.113.42')
  })

  it('returns null when neither header is set', () => {
    expect(readIp(new Headers())).toBeNull()
  })
})

describe('hashIp', () => {
  const originalEnv = process.env
  beforeEach(() => {
    process.env = { ...originalEnv }
    _resetWarnedForTests()
  })
  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('returns a deterministic 32-char hex prefix when salt + ip present', () => {
    process.env.IP_HASH_SALT = 'pepper'
    const h = new Headers({ 'x-forwarded-for': '203.0.113.7' })
    const a = hashIp(h)
    const b = hashIp(h)
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{32}$/)
  })

  it("returns 'unresolved' when no IP header is present", () => {
    process.env.IP_HASH_SALT = 'pepper'
    expect(hashIp(new Headers())).toBe('unresolved')
  })

  it('warns once when IP_HASH_SALT is unset, then stays quiet', () => {
    // biome-ignore lint/performance/noDelete: setting to undefined leaves the string in process.env
    delete process.env.IP_HASH_SALT
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const h = new Headers({ 'x-real-ip': '198.51.100.1' })
    hashIp(h)
    hashIp(h)
    hashIp(h)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('changes hash when the salt changes', () => {
    const h = new Headers({ 'x-forwarded-for': '203.0.113.7' })
    const a = hashIp(h, 'salt-a')
    const b = hashIp(h, 'salt-b')
    expect(a).not.toBe(b)
  })
})
