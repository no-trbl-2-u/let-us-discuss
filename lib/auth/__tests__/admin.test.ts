import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getCurrentUserMock, redirectMock, notFoundMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  redirectMock: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`)
  }),
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

vi.mock('@/lib/supabase/auth', () => ({
  getCurrentUser: getCurrentUserMock,
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}))

import { isAdminEmail, requireAdmin } from '@/lib/auth/admin'

describe('isAdminEmail', () => {
  const originalEnv = process.env
  beforeEach(() => {
    process.env = { ...originalEnv }
  })
  afterEach(() => {
    process.env = originalEnv
  })

  it('returns false when ADMIN_EMAILS is unset', () => {
    delete process.env.ADMIN_EMAILS
    expect(isAdminEmail('a@b.co')).toBe(false)
  })

  it('returns false when ADMIN_EMAILS is empty / whitespace', () => {
    process.env.ADMIN_EMAILS = '   '
    expect(isAdminEmail('a@b.co')).toBe(false)
  })

  it('matches a comma-separated list with whitespace + mixed case', () => {
    process.env.ADMIN_EMAILS = ' Alice@Example.com , bob@example.com , CAROL@example.com '
    expect(isAdminEmail('alice@example.com')).toBe(true)
    expect(isAdminEmail('BOB@example.com')).toBe(true)
    expect(isAdminEmail('carol@EXAMPLE.com')).toBe(true)
    expect(isAdminEmail('dave@example.com')).toBe(false)
  })

  it('is case-insensitive on the input email', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com'
    expect(isAdminEmail('ADMIN@EXAMPLE.COM')).toBe(true)
    expect(isAdminEmail(' Admin@Example.com ')).toBe(true)
  })

  it('returns false for null / undefined / empty input', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com'
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
    expect(isAdminEmail('')).toBe(false)
    expect(isAdminEmail('   ')).toBe(false)
  })
})

describe('requireAdmin', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    getCurrentUserMock.mockReset()
    redirectMock.mockClear()
    notFoundMock.mockClear()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('redirects anonymous visitors to /signin?next=/admin', async () => {
    getCurrentUserMock.mockResolvedValue(null)
    await expect(requireAdmin()).rejects.toThrow(/NEXT_REDIRECT:\/signin\?next=\/admin/)
    expect(redirectMock).toHaveBeenCalledWith('/signin?next=/admin')
  })

  it('calls notFound() for an authed non-admin', async () => {
    process.env.ADMIN_EMAILS = 'admin@example.com'
    getCurrentUserMock.mockResolvedValue({ id: 'u-1', email: 'civilian@example.com' })
    await expect(requireAdmin()).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFoundMock).toHaveBeenCalledOnce()
  })

  it('returns the user when their email is in ADMIN_EMAILS', async () => {
    process.env.ADMIN_EMAILS = 'admin@example.com'
    getCurrentUserMock.mockResolvedValue({ id: 'u-1', email: 'admin@example.com' })
    const user = await requireAdmin()
    expect(user.id).toBe('u-1')
    expect(redirectMock).not.toHaveBeenCalled()
    expect(notFoundMock).not.toHaveBeenCalled()
  })
})
