import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getSiteOrigin } from '@/lib/site/origin'

describe('getSiteOrigin', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv
    }
  })

  it('returns the canonical Vercel alias when NEXT_PUBLIC_SITE_URL is unset', () => {
    expect(getSiteOrigin()).toBe('https://let-us-discuss-ai.vercel.app')
  })

  it('honors NEXT_PUBLIC_SITE_URL when set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://custom.example.com'
    expect(getSiteOrigin()).toBe('https://custom.example.com')
  })

  it('trims a trailing slash from the env-supplied value', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://custom.example.com/'
    expect(getSiteOrigin()).toBe('https://custom.example.com')
  })

  it('trims multiple trailing slashes', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://custom.example.com///'
    expect(getSiteOrigin()).toBe('https://custom.example.com')
  })
})
