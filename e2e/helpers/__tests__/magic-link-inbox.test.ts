import { describe, expect, it } from 'vitest'
import {
  extractMagicLink,
  magicLinkInboxFromEnv,
} from '@/e2e/helpers/magic-link-inbox'

describe('magicLinkInboxFromEnv', () => {
  it('returns null when MAGIC_LINK_INBOX_PROVIDER is unset', () => {
    expect(magicLinkInboxFromEnv({})).toBeNull()
  })

  it('returns null when explicitly "none"', () => {
    expect(magicLinkInboxFromEnv({ MAGIC_LINK_INBOX_PROVIDER: 'none' })).toBeNull()
  })

  it('throws when "mailosaur" is missing credentials', () => {
    expect(() =>
      magicLinkInboxFromEnv({ MAGIC_LINK_INBOX_PROVIDER: 'mailosaur' }),
    ).toThrow(/MAILOSAUR_API_KEY/)
  })

  it('builds a mailosaur inbox when credentials are present', () => {
    const inbox = magicLinkInboxFromEnv({
      MAGIC_LINK_INBOX_PROVIDER: 'mailosaur',
      MAILOSAUR_API_KEY: 'key',
      MAILOSAUR_SERVER_ID: 'srv',
    })
    expect(inbox).not.toBeNull()
    expect(typeof inbox?.waitForMagicLink).toBe('function')
  })
})

describe('extractMagicLink', () => {
  it('prefers /auth/callback URLs', () => {
    const urls = [
      'https://example.com/help',
      'https://let-us-discuss.vercel.app/auth/callback?code=abc',
      'https://login.example.com/verify?token=xyz',
    ]
    expect(extractMagicLink(urls)).toBe(
      'https://let-us-discuss.vercel.app/auth/callback?code=abc',
    )
  })

  it('falls back to any auth/verify/magic-shaped URL', () => {
    const urls = [
      'https://example.com/help',
      'https://login.example.com/verify?token=xyz',
    ]
    expect(extractMagicLink(urls)).toBe(
      'https://login.example.com/verify?token=xyz',
    )
  })

  it('returns null when no candidate matches', () => {
    expect(extractMagicLink(['https://example.com/help'])).toBeNull()
  })
})
